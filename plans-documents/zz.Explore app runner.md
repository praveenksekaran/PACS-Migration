# dicomweb-api — AWS Deployment Plan

## Recommended Approach: AWS App Runner

App Runner connects directly to your GitHub repo, builds the Docker image automatically on every push, and deploys it — no servers, no networking, no CI/CD pipeline to configure manually.

```
git push → App Runner detects change → builds image → deploys → HTTPS endpoint ready
```

---

## Options Comparison

| | **App Runner** | **ECS Fargate + CodePipeline** | **EC2 + Docker** |
|--|--|--|--|
| Complexity | Minimal | High | Medium |
| Git → Deploy | Built-in | Requires CodePipeline + CodeBuild + ECR setup | Manual |
| Infra to manage | None | Task definitions, clusters, ALB | Server, AMI, SGs |
| Auto-scaling | Automatic | Configurable | Manual |
| HTTPS | Automatic | Needs ALB + ACM cert | Manual |
| Cost model | Per request + compute | Always-on per task | EC2 hourly |
| Best for | APIs, web services | Complex multi-container apps | Full control |

**App Runner is the right choice** — dicomweb-api is a REST API with no special networking requirements.

---

## Full Deployment Pipeline

```
GitHub repo (dicomweb-api)
        │
        │  git push to main
        ▼
  AWS App Runner (ap-southeast-2)
  ┌─────────────────────────────────┐
  │ 1. Detects new commit           │
  │ 2. Pulls source from GitHub     │
  │ 3. Builds Docker image          │
  │ 4. Runs health check            │
  │ 5. Swaps traffic (zero-downtime)│
  └─────────────────────────────────┘
        │
        ├── QIDO queries ──► RDS PostgreSQL  (ap-southeast-2)
        ├── WADO requests ──► S3 dicomweb-data (ap-south-2)
        └── HTTPS ──────────► https://xyz.ap-southeast-2.awsapprunner.com
```

---

## What Needs to Be Created

### 1. Dockerfile
A multi-stage build in the project root. Key requirement: `dicom-dimse-native` is a native C++ addon — the image needs Linux build tools so it compiles correctly for the container OS.

### 2. .dockerignore
Exclude `node_modules`, `data/`, `import/`, `logs/`, `lambda/` etc. from the build context.

### 3. IAM Instance Role for App Runner
App Runner needs an IAM role so the container can read from S3 (`dicomweb-data`) without hardcoded AWS credentials.

### 4. App Runner Service
- Connect to GitHub repo
- Point to `Dockerfile`
- Set environment variables (DB credentials, S3 bucket names, region)
- Port: `5001`

### 5. Environment Variables in App Runner
Move secrets out of `config/default.js` into App Runner managed environment variables:

| Variable | Value |
|----------|-------|
| `NODE_CONFIG` | JSON with DB host/user/password, AWS region, bucket names |

---

## Region Note

App Runner is **not available in `ap-south-2`** (Hyderabad — where the S3 buckets and Lambda are).

**Use `ap-southeast-2` (Sydney)** — the RDS is already there and cross-region S3 access works fine via the AWS SDK.

| Resource | Region |
|----------|--------|
| App Runner (API server) | `ap-southeast-2` ✅ |
| RDS PostgreSQL | `ap-southeast-2` ✅ same region |
| S3 dicomweb-import | `ap-south-2` (cross-region SDK access) |
| S3 dicomweb-data | `ap-south-2` (cross-region SDK access) |
| Lambda | `ap-south-2` (stays with S3 buckets) |

---

## Implementation Checklist

- [ ] Create `Dockerfile` (multi-stage, handles native C++ addon)
- [ ] Create `.dockerignore`
- [ ] Create IAM role for App Runner instance with S3 read access to `dicomweb-data`
- [ ] Set up App Runner service connected to GitHub
- [ ] Configure environment variables in App Runner (replace `config/default.js` secrets)
- [ ] Test QIDO and WADO endpoints via App Runner HTTPS URL
- [ ] Update `viewerOrigin` CORS config to allow viewer domain
