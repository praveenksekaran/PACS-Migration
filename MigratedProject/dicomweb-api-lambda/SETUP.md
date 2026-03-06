# Lambda + S3 Setup Guide (AWS Console)

Region for all resources: **ap-south-2 (Hyderabad)**

---

## Step 1 — Create S3 Buckets

Go to **S3 → Create bucket** and create two buckets:

| Bucket name | Purpose |
|-------------|---------|
| `dicomweb-import` | Drop zone — DICOM files uploaded here trigger Lambda |
| `dicomweb-data` | Permanent storage — processed files moved here by Lambda |

Settings for both buckets:
- Region: **ap-south-2**
- Block all public access: **ON** (keep default)
- Versioning: OFF (optional, can enable for audit trail)
- Everything else: leave as default

---

## Step 2 — Create IAM Role for Lambda

Go to **IAM → Roles → Create role**

1. **Trusted entity type:** AWS service
2. **Use case:** Lambda
3. Click **Next**
4. Attach these managed policies:
   - `AWSLambdaBasicExecutionRole` (for CloudWatch logs)
5. Click **Next**, name the role: `dicomweb-lambda-role`
6. Click **Create role**

After creating, open the role and add an **inline policy** (JSON):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::dicomweb-import/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::dicomweb-data/*"
    }
  ]
}
```

Name it `dicomweb-s3-policy` and save.

---

## Step 3 — Package the Lambda function

Run these commands in the `lambda/` folder:

```bash
cd lambda
npm install
zip -r ../lambda-deployment.zip .
```

This creates `lambda-deployment.zip` in the project root.

> **Windows alternative** — use PowerShell:
> ```powershell
> cd lambda
> npm install
> Compress-Archive -Path * -DestinationPath ..\lambda-deployment.zip
> ```

---

## Step 4 — Create the Lambda Function

Go to **Lambda → Create function**

1. **Author from scratch**
2. **Function name:** `dicomweb-import-processor`
3. **Runtime:** Node.js 20.x
4. **Architecture:** x86_64
5. **Execution role:** Use an existing role → select `dicomweb-lambda-role`
6. Click **Create function**

### Upload the deployment package

In the function page:
1. Click **Upload from → .zip file**
2. Upload `lambda-deployment.zip`
3. Click **Save**

### Configure environment variables

Go to **Configuration → Environment variables → Edit** and add:

| Key | Value |
|-----|-------|
| `IMPORT_BUCKET` | `dicomweb-import` |
| `DATA_BUCKET` | `dicomweb-data` |
| `DB_HOST` | `dicomwebmig.clacs4oiaso2.ap-southeast-2.rds.amazonaws.com` |
| `DB_PORT` | `5432` |
| `DB_NAME` | `dicomweb` |
| `DB_USER` | `postgres` |
| `DB_PASSWORD` | *(your RDS password)* |

### Configure timeout and memory

Go to **Configuration → General configuration → Edit**:
- **Memory:** 512 MB (increase to 1024 MB for large DICOM files)
- **Timeout:** 1 min (increase to 5 min for large batches)

---

## Step 5 — Add S3 Trigger

In the Lambda function page, click **Add trigger**:

1. **Source:** S3
2. **Bucket:** `dicomweb-import`
3. **Event types:** `PUT` (ObjectCreated:Put)
4. **Suffix:** *(leave blank — trigger on all files)*
5. Acknowledge the recursive invocation notice
6. Click **Add**

---

## Step 6 — Allow RDS to accept Lambda connections

Go to **RDS → Databases → dicomwebmig → Connectivity & security**

Check the **VPC security group** attached to the RDS instance. Open that security group in **EC2 → Security Groups** and confirm there is an **Inbound rule** for:
- **Type:** PostgreSQL (port 5432)
- **Source:** `0.0.0.0/0` (or at minimum the Lambda's IP range)

If the RDS is **Publicly accessible = Yes** (which it is, since local migration works), this is already satisfied.

---

## Step 7 — Test the pipeline

1. Upload a DICOM file to `dicomweb-import`:
   ```bash
   aws s3 cp ./import/sample.dcm s3://dicomweb-import/sample.dcm
   ```
   Or use `npm run upload` from the project root to batch-upload all files from `./import/`.

2. Check Lambda logs in **CloudWatch → Log groups → /aws/lambda/dicomweb-import-processor**

3. Verify the file appeared in `dicomweb-data`:
   ```bash
   aws s3 ls s3://dicomweb-data/ --recursive
   ```

4. Verify the metadata is in PostgreSQL by querying the API:
   ```
   GET http://localhost:5001/rs/studies
   ```

---

## Architecture after Phase 2

```
DICOM files
    ↓  (npm run upload  OR  direct S3 upload)
dicomweb-import S3 bucket
    ↓  (S3 ObjectCreated trigger)
Lambda: dicomweb-import-processor
    ├── Parses DICOM metadata
    ├── Copies file to dicomweb-data S3
    ├── Upserts metadata to RDS PostgreSQL
    └── Deletes file from dicomweb-import

API server (Fastify)
    ├── QIDO queries  → RDS PostgreSQL
    └── WADO requests → dicomweb-data S3
```
