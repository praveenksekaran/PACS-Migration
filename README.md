# 1. Introduction

## 1.1 Purpose

This project demonstrates how to use an AI coding assistant (Claude Code) to migrate and modernise a legacy codebase — without adding new features or business logic. The goal is a like-for-like migration that is cleaner, cloud-native, and more maintainable.

A **PACS (Picture Archiving and Communication System)** was chosen as the subject because it is a realistic, non-trivial system: it involves medical imaging standards (DICOM), a network protocol (DIMSE), a database, file storage, a REST API, and a rich client UI. It is complex enough to be a meaningful test of AI-assisted migration, yet small enough to complete in a reasonable time.

## 1.2 What is PACS?

PACS is the system used in hospitals to store, retrieve, and display medical images (CT scans, MRI, X-rays). It is built around the **DICOM** standard (Digital Imaging and Communications in Medicine), which defines both the file format for medical images and the network protocols for transferring them.

Key DICOM concepts used in this project:

| Concept | Description |
|---|---|
| **DIMSE** | DICOM Message Service Element — the legacy binary network protocol used between DICOM devices (C-Store, C-Find, C-Echo) |
| **QIDO-RS** | Query-based Image Data Objects over RS — RESTful API to search studies, series, and instances |
| **WADO-RS** | Web Access to DICOM Objects over RS — RESTful API to retrieve pixel data frames |
| **WADO-URI** | Older URI-based retrieval — downloads the full `.dcm` file |
| **Study / Series / Instance** | The DICOM hierarchy: a patient has studies (visits), each study has series (scan sequences), each series has instances (individual images/frames) |

## 1.3 The Two Legacy Projects

Two open-source projects were selected to form the complete PACS system:

1. **[Dicom-Server](https://github.com/knopkem/dicomweb-pacs/tree/master)** — a Node.js + Fastify application with local DICOM file storage and a SQLite database managed by a native C++ binding (`dicom-dimse-native`). It serves QIDO-RS and WADO-RS/URI endpoints and ships with the OHIF viewer bundled as static files.

2. **[Dicom-viewer](https://github.com/pyb0924/MyPACS)** — a Windows-only .NET WPF desktop application using the fo-dicom library and a native C++ DCMTK binding. It supported QIDO-RS queries and WADO-URI downloads but had no WADO-RS support and many planned features (Window/Level, Pan, Zoom) left as `// TODO` stubs.

## 1.4 Migration Objectives

| # | Objective | From | To |
|---|---|---|---|
| 1 | Modernize DICOM-Server storage | Local filesystem + SQLite | Amazon S3 + Amazon RDS PostgreSQL |
| 2 | Containerize DICOM-Server | On-premise Node.js process | Docker image on Amazon ECS |
| 3 | Migrate DICOM-viewer platform | Windows WPF desktop application | React/Vite web application |
| 4 | Add web DICOM standards to viewer | WADO-URI only | QIDO-RS + WADO-RS + WADO-URI |
| 5 | Enable interactive imaging tools | WL/Zoom/Flip stubs (not implemented) | Full cornerstone3D tool suite |

**Constraint:** No new features. Every capability in the migrated system must have a direct counterpart in the original.

# 2. Architecture (Legacy and New)

## 2.1 Legacy Architecture

The original system was a tightly coupled monolith running on a single on-premise Windows machine. The API server and viewer were bundled together in one Node.js process, and the WPF viewer was a separate Windows-only desktop app.

```
DICOM Devices (CT/MRI)
        | DIMSE Protocol (C-Store/C-Find/C-Echo) — Port 8888
        v
  DIMSE Server (dicom-dimse-native C++ binding)
        |
  File System Storage (./data/StudyUID/InstanceUID)
  SQLite DB (managed internally by C++ native lib)
        |
  Fastify Web Server (Port 5001) — single process
  - QIDO-RS queries via DIMSE -> SQLite
  - WADO-RS/URI reads from local ./data/
  - Also serves OHIF viewer as static files (bundled together)

  WPF Desktop Viewer (separate Windows install)
  - .NET WPF + fo-dicom + native C++ DCMTK binding
  - Downloads full .dcm files to local disk before rendering
  - No WADO-RS support, no browser, no cross-platform
```

**Problems with the legacy architecture:**
- Single machine — no horizontal scaling, no failover
- Local disk — DICOM storage limited by server disk size; no redundancy
- SQLite managed by C++ binding — impossible to query or migrate without re-architecting
- WPF viewer — Windows-only, must be installed on every workstation
- API and viewer tightly coupled — cannot deploy or scale them independently
- WADO-RS not implemented — viewer could not use modern streaming retrieval

## 2.2 New Architecture

The migrated system separates every concern into an independently deployable cloud service.

```
                        Browser
                           |
              Elastic Beanstalk (ap-southeast-2)
              Node.js Fastify Server (port 8080)
              - Serves React/Vite SPA (dist/)
              - Injects app-config.js (API_URL)
              - Sets COOP/COEP/CORP headers (SharedArrayBuffer for MPR)
                           |
              QIDO-RS / WADO-RS / WADO-URI (HTTP REST)
                           |
              ECS on EC2 t2.micro (ap-southeast-2)
              Fastify API Server (port 5001) — Docker container
              - QIDO queries -> PostgreSQL RDS
              - WADO pixel data -> S3 (streamed directly)
              /                          \
  Amazon RDS PostgreSQL           Amazon S3 dicomweb-data (ap-south-2)
  (ap-southeast-2)                DICOM pixel files stored as
  DICOM metadata tables:          {StudyUID}/{SOPInstanceUID}
  patients / studies /
  series / instances

  S3 dicomweb-import (drop zone)
          |
          | S3 ObjectCreated event
          v
     AWS Lambda (event-driven import processor)
     - Downloads DICOM file from import bucket
     - Parses metadata (dicom-parser)
     - Copies file to dicomweb-data bucket
     - Upserts metadata into RDS PostgreSQL
```

## 2.3 Architecture Comparison

| Dimension | Legacy | New |
|---|---|---|
| Deployment model | Single on-premise process | Microservices on AWS (ECS + EB + Lambda + RDS + S3) |
| DICOM file storage | Local filesystem `./data/` | Amazon S3 (`dicomweb-data` bucket) |
| Metadata database | SQLite (C++ managed, opaque) | Amazon RDS PostgreSQL (structured, queryable) |
| Import pipeline | Manual `npm run import` → DIMSE C-STORE | Upload to S3 → Lambda event trigger |
| API deployment | Bare Node.js process | Docker container on ECS |
| Viewer | Windows WPF desktop app | React/Vite SPA served from Elastic Beanstalk |
| Viewer rendering | fo-dicom → WPF WriteableBitmap (CPU) | cornerstone3D → WebGL (GPU) |
| DICOM retrieval | WADO-URI only (full file to disk) | WADO-RS frames endpoint (pixel streaming, no disk I/O) |
| Viewer-API coupling | Served from same origin (relative URLs) | Independent services (absolute URLs, CORS configured) |
| Cross-platform | Windows only | Any browser on any OS |

# 3. Strategy

AI can write code, but it loses context on large projects, and produces poor results when debugging or making incremental changes without structure. This section describes the process used to keep the AI productive and the migration under control.

The seven-step strategy:

1. Plan
2. Simplify
3. Follow a process
4. Execute in Phases
5. Automate testing
6. Deployment Plan
7. Deploy

#### 3.1 Plan

Before writing any code, a written plan was produced for each migration step. The plan:

- Identified the major steps (server modernisation, viewer migration, deployment) and kept them independent — they can be worked on sequentially without one blocking the other
- Broke each step into small, ordered phases. For example, migrating the DB (SQLite → PostgreSQL) is a separate phase from migrating file storage (local → S3). Each phase has a single, testable goal
- Identified dependencies between phases explicitly, so the AI could not skip ahead or generate code that assumed later phases were complete
- Captured known constraints up front — for example, that SQLite was managed by a C++ native binding with no JS-level SQL access, meaning a simple driver swap was impossible and the entire data layer needed re-architecting

The plan documents are in `plans-documents/` and served as the primary input to the AI for each phase.

#### 3.2 Simplify

Before executing any migration, the legacy codebase was simplified:

- **Separate concerns:** The API server and OHIF viewer were bundled in a single Node.js process. They were separated into two independent projects (`dicomweb-api` and `dicomweb-react-viewer`) with their own `package.json`, start scripts, and configuration. This decoupling is a prerequisite for independent cloud deployment.
- **Remove dead code:** Features that existed only as stubs or `// TODO` comments (e.g. Window/Level mouse drag in the WPF viewer) were removed from scope. If something was not working in the original, it was not in scope for migration.
- **Flatten structure:** Files were reorganised to align with the planned phases — e.g. `src/db/` was created as a clean home for all database logic before writing any DB code.
- **Verify buildability:** After every simplification step, the project was confirmed to build and run before proceeding. This prevents accumulated breakage.

The separation plan is documented in `plans-documents/2.separation_plan.md`.

#### 3.3 Follow a Process

**Constraint 1 — AI loses context on large tasks.** Claude Code (and AI assistants in general) tend to produce lower-quality output when given open-ended, large tasks. They also regress when asked to debug or incrementally change code that was previously generated. To mitigate this:

- Requirements were written before code. The AI was given a specific, narrow phase to implement, not "migrate the whole server."
- **Test-Driven Development (TDD)** was applied: write the test first, then write the minimal code to make it pass, then refactor. This forces small increments and gives the AI a clear success criterion for each step.
- Each phase started fresh with only the current phase's context — not the full history of all previous phases.

**Constraint 2 — How to capture requirements for both humans and AI.** User stories work well for humans; structured markdown (PRD.md) works for AI. Neither format is ideal for driving automated tests directly.

- Requirements were captured as **Behaviours** using **Gherkin syntax** (Feature / Scenario / Given / When / Then) — the format used in Behaviour-Driven Development (BDD).
- Gherkin is readable by non-technical stakeholders, maps directly to automated tests, and gives the AI unambiguous acceptance criteria for each scenario.
- Behaviours were grouped by implementation phase, so the AI could see exactly which scenarios applied to the current phase.

Example (from `plans-documents/4.behaviours_testcase.md`):
```gherkin
Scenario: cornerstone3D initialises before any viewport is rendered
  Given the application HTML has loaded
  When the React root mounts
  Then cornerstoneCore.init() is called before any CornerstoneViewport renders
  And the wadouri image loader is registered under the "wadouri:" URI scheme
  And the wadors image loader is registered under the "wadors:" URI scheme
```

#### 3.4 Execute in Phases

Phases were executed one at a time, with explicit human checkpoints:

1. Provide the AI with the plan document for the current phase and the relevant behaviour scenarios
2. Instruct the AI to write the test first (TDD)
3. Instruct the AI to write the minimal code to pass the test
4. Instruct the AI to refactor if needed — but only after tests pass
5. **Stop. Do not start the next phase.** Build and run the application manually (or with a second AI session) to verify there are no runtime issues beyond what the tests cover
6. Only after verification, proceed to the next phase

This "gate at every phase" approach keeps accumulated bugs minimal and ensures the codebase is always in a deployable state.

#### 3.5 Automate Testing

Since requirements were written as Gherkin behaviours, translating them to automated tests was straightforward:

- **Unit tests** (Vitest + Testing Library): component-level tests for React components, Zustand stores, and utility functions. 246 unit tests total.
- **E2E tests** (Playwright): browser-level tests that drive the full React app and verify behaviours end-to-end. 111 E2E tests covering all 7 implementation phases.
- Tests are tagged by phase, so a phase-specific regression can be run in isolation before the full suite is executed.
- Live API tests are tagged `@api` and run against the deployed AWS environment using `API_SERVER_URL=http://<host>:5001 npx playwright test --grep "@api"`.

At the end of every phase:
1. Phase-specific tests were run to verify the new behaviour
2. The full test suite was run as a regression check against all previous phases

#### 3.6 Deployment Plan

A separate deployment plan was written before any deployment work began. This separation is important because deployment often requires cosmetic code changes (e.g. changing hard-coded `localhost` URLs to environment variables), cloud configuration scripts, and updates to test cases — none of which are core migration work.

The deployment plan was also phased:

| Phase | Action |
|---|---|
| 1 | Containerise the API server (Dockerfile, local Docker test) |
| 2 | Push Docker image to Amazon ECR |
| 3 | Create IAM roles (ECS task execution role, task role for S3 access) |
| 4 | Create ECS cluster and EC2 instance (t2.micro, free tier) |
| 5 | Register ECS task definition (container config, port mappings, environment variables) |
| 6 | Create ECS service and verify the container is running |
| 7 | Package and deploy React viewer to Elastic Beanstalk |
| 8 | Wire CORS — update API's `viewerOrigin` to the EB domain |

Having the plan written in advance meant each deployment phase could be handed to the AI with precise instructions, avoiding the common failure mode of AI making ad-hoc infrastructure decisions.

Deployment plans: `plans-documents/7.api-deployment-plan.md` and `plans-documents/8.viewer-deployment-plan.md`.

#### 3.7 Deploy & Verify

AWS environment setup:
- Created a dedicated IAM user with least-privilege permissions (ECR push, ECS manage, RDS access, S3 read/write)
- Configured AWS CLI with the new user's credentials (`aws configure`)
- Created S3 buckets (`dicomweb-import`, `dicomweb-data`), RDS PostgreSQL instance, ECR repository, and ECS cluster using AWS CLI commands from the deployment plan

Each deployment phase was verified before proceeding:
- API on ECS: `curl http://<EC2_PUBLIC_DNS>:5001/rs/studies` — must return a JSON array
- Viewer on EB: `curl http://<EB_CNAME>/app-config.js` — must return `window.config` with the correct `apiUrl`
- CORS: viewer domain added to API's `viewerOrigin` config via `NODE_CONFIG` environment variable on the ECS task (no rebuild required)
- Live Playwright `@api` tests run against the deployed API to confirm contract compliance

# 4. Claude Code

Claude Code is Anthropic's AI coding assistant, used as the primary implementation tool throughout this project. It operates as a CLI — it reads and writes files, runs commands, and interacts with the codebase directly, rather than just generating text in a chat window.

## 4.1 How It Was Used

| Task | How Claude Code helped |
|---|---|
| Legacy code analysis | Read all source files, produced the architecture analysis and component inventory in `plans-documents/1.app_analysis.md` |
| Migration planning | Generated detailed phase-by-phase migration plans given high-level objectives |
| BDD behaviour writing | Translated architecture analysis into Gherkin scenarios, grouped by implementation phase |
| TDD implementation | For each phase: wrote tests first, then wrote minimal implementation code to pass them |
| Refactoring | Simplified code after tests passed, without changing behaviour |
| Deployment scripting | Generated AWS CLI command sequences for each deployment phase |
| Documentation | Generated all `plans-documents/` files and this README |

## 4.2 Working Model

The workflow used was: **human provides context and direction, AI executes one phase at a time.**

- The human reads and approves the plan before the AI starts each phase
- The AI is told explicitly when to stop (end of phase) and not to proceed ahead
- After each phase, a human (or a second AI session with fresh context) builds and runs the application to verify runtime behaviour beyond what unit tests cover
- Corrections and course adjustments are made by the human before the next phase begins

This keeps the human in control of the overall direction while offloading the mechanical implementation work to the AI.

## 4.3 Constraints Observed

**Usage limits:** Despite a PRO subscription, the usage limit (context window and rate limit) was reached frequently, requiring pauses between phases. This reinforced the value of phase-based working — each phase is a natural break point.

**Context loss on large tasks:** When given a large open-ended task, Claude Code would sometimes generate code that was technically correct but ignored earlier design decisions or introduced inconsistencies. Keeping tasks small (one phase, one file set) and providing explicit plans mitigated this significantly.

**Debugging is harder than generating:** AI-generated code that needed debugging was more challenging to fix using the AI than simply regenerating it with a clearer specification. The TDD approach helped here — a failing test is a precise specification, which the AI handles well.

**Code review is still required:** AI code is not always optimal or idiomatic. The simplify skill (`/simplify`) was used after each phase to review and clean up generated code before committing.

# 5. Documents

All plans, scripts, test cases, and migrated code are available in this repository.

## 5.1 Repository Structure

```
PACS-Migration/
├── README.md                          # This file
├── plans-documents/                   # All planning and analysis documents
│   ├── 1.app_analysis.md              # Legacy architecture analysis
│   ├── 2.separation_plan.md           # API / viewer separation plan
│   ├── 3.viewer_migration_plan.md     # WPF to React migration plan (7 phases)
│   ├── 4.behaviours_testcase.md       # BDD Gherkin behaviours (all phases)
│   ├── 5.api-migration_plan.md        # API modernisation plan (PostgreSQL + S3)
│   ├── 6.api-deployment-lambda-s3.md  # Lambda import processor design
│   ├── 7.api-deployment-plan.md       # ECS deployment plan (API server)
│   ├── 8.viewer-deployment-plan.md    # Elastic Beanstalk deployment plan (viewer)
│   └── 9.Run-automated-testing.md     # How to run Vitest + Playwright test suites
├── MigratedProject/
│   ├── dicomweb-api/                  # Migrated API server (Node.js + Fastify)
│   │   ├── src/
│   │   │   ├── app.js                 # Fastify server entry point
│   │   │   ├── routes/routes.js       # QIDO-RS and WADO-RS/URI endpoints
│   │   │   ├── utils.js               # DICOM tag processing, query builder
│   │   │   ├── s3.js                  # S3 client wrapper
│   │   │   ├── storescu.js            # Legacy DIMSE import tool (retired)
│   │   │   ├── db/                    # PostgreSQL connection, migrations, repository
│   │   │   └── scripts/               # Data migration and S3 upload utilities
│   │   ├── config/default.js          # Server configuration (ports, AWS, DB)
│   │   ├── Dockerfile                 # Docker image definition
│   │   └── package.json
│   └── dicomweb-react-viewer/         # Migrated React viewer
│       ├── src/
│       │   ├── App.tsx                # Root component (cornerstone3D init gate)
│       │   ├── components/            # CornerstoneViewport, StudyTree, QRModal, etc.
│       │   ├── store/                 # Zustand stores (viewer, qr, studyTree, ui, status)
│       │   ├── lib/                   # cornerstone.ts (init), volumeLoader.ts (MPR)
│       │   └── api/                   # dicomWebClient.ts (QIDO-RS fetch calls)
│       ├── e2e/                       # Playwright E2E test specs (111 tests)
│       ├── server.js                  # Fastify SPA server (served on EB)
│       ├── vite.config.ts             # Build config (dev proxy, outDir)
│       └── package.json
```

## 5.2 Planning Documents

| Document | Description |
|---|---|
| `1.app_analysis.md` | Full analysis of the legacy codebase — architecture diagrams, component inventory, data flows, identified constraints |
| `2.separation_plan.md` | Step-by-step plan to decouple the API server from the OHIF viewer: coupling points identified, CORS implications, config changes |
| `3.viewer_migration_plan.md` | 7-phase plan for the WPF-to-React migration — component mapping, data flow comparison, API endpoint usage, LOC estimates per phase |
| `4.behaviours_testcase.md` | All requirements written in Gherkin BDD syntax, organised by implementation phase — directly used to generate Playwright test specs |
| `5.api-migration_plan.md` | API modernisation plan — Phase 1 (SQLite → PostgreSQL) and Phase 2 (local files → S3 + Lambda), with risk register |
| `6.api-deployment-lambda-s3.md` | Lambda function design for event-driven DICOM import processing — trigger, processing steps, IAM permissions, VPC considerations |
| `7.api-deployment-plan.md` | 8-phase ECS deployment plan for the API server — ECR push, IAM roles, ECS cluster, task definition, service creation, testing |
| `8.viewer-deployment-plan.md` | Elastic Beanstalk deployment plan for the React viewer — build, zip packaging, EB application/environment creation, CORS wiring |
| `9.Run-automated-testing.md` | How to run the test suites — Vitest unit tests (246), Playwright E2E tests (111), live `@api` tests against AWS |

## 5.3 Test Coverage Summary

| Suite | Tool | Count | Scope |
|---|---|---|---|
| Unit tests | Vitest + Testing Library | 246 | Components, Zustand stores, utility functions |
| E2E tests | Playwright | 111 | Full browser automation across all 7 viewer phases |
| Live API tests | Playwright (`@api` tag) | ~12 | Contract tests against deployed AWS API server |

# 6. DICOM-Server

## 6.1 Legacy State

The original server ([dicomweb-pacs](https://github.com/knopkem/dicomweb-pacs/tree/master)) was a single Node.js Fastify application with the following characteristics:

| Aspect | Legacy |
|---|---|
| Framework | Node.js + Fastify 4.x |
| Metadata DB | SQLite — managed entirely by `dicom-dimse-native` (C++ native binding) |
| File storage | Local filesystem `./data/{StudyUID}/{InstanceUID}` |
| DICOM import | `storescu.js` — reads files from `./import/`, sends via DIMSE C-STORE (port 8888) |
| QIDO queries | `dimse.findScu()` → local PACS → SQLite |
| WADO retrieval | Reads raw bytes directly from `./data/` filesystem |
| Deployment | On-premise, single process |

**Critical constraint:** SQLite was managed internally by the C++ `dicom-dimse-native` library — there was no JS-level SQL. A simple DB driver swap was not possible; the entire data layer required re-architecting.

## 6.2 Migration — Phase 1: SQLite to PostgreSQL

**Goal:** Decouple metadata storage from the native C++ library and store it in a standard, queryable PostgreSQL database.

### Schema Design
The DICOM hierarchy is modelled as four related PostgreSQL tables:
```
patients -> studies -> series -> instances
```
Each table stores the relevant DICOM tags (PatientID, StudyDate, Modality, SOPInstanceUID, file path, etc.) extracted during import using `dicom-parser`.

### Key Changes
- Added `pg` (node-postgres) as the database client
- Created `src/db/` module with `connection.js` (connection pool), `migrate.js` (schema bootstrap), and `repository.js` (CRUD queries)
- Modified import flow: after a DICOM file is processed, `dicom-parser` extracts metadata and upserts it into PostgreSQL — bypassing the C++ DIMSE layer for all query operations
- Replaced all `utils.doFind()` calls (which went DIMSE → SQLite) with direct PostgreSQL queries via `repository.doFind()`
- One-time migration script `src/scripts/migrate-sqlite-to-pg.js` walks `./data/`, parses each DICOM file, and bulk-inserts metadata into PostgreSQL

### QIDO-RS Query Flow (new)
```
GET /rs/studies?PatientName=Smith
  -> utils.doFindPg()
  -> repository.doFind('STUDY', conditions, tags)
  -> PostgreSQL SELECT with parameterised WHERE clauses
  -> JSON response (application/dicom+json)
```

## 6.3 Migration — Phase 2: Cloud Storage (S3 + Lambda)

**Goal:** Replace local `./import/` and `./data/` folders with S3 buckets; replace the manual `npm run import` script with event-driven serverless processing.

### S3 Bucket Design

| Bucket | Purpose |
|---|---|
| `dicomweb-import` | Upload drop zone — DICOM files placed here trigger Lambda processing |
| `dicomweb-data` | Permanent storage — files stored as `{StudyUID}/{SOPInstanceUID}` |

### Lambda Import Processor
A Lambda function (`dicomweb-import-processor`) is triggered by S3 `ObjectCreated` events on the `dicomweb-import` bucket. It replaces `storescu.js`:

1. Receives S3 event — extracts bucket name and object key
2. Downloads the DICOM file from `dicomweb-import`
3. Parses DICOM metadata using `dicom-parser` (bundled in a Lambda layer)
4. Extracts: PatientID, StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID, Modality, StudyDate
5. Copies the file to `dicomweb-data` under `{StudyUID}/{SOPInstanceUID}` key
6. Upserts metadata into Amazon RDS PostgreSQL (same schema as Phase 1)
7. Deletes the file from the import bucket

### WADO Retrieval (new)
WADO endpoints now stream DICOM pixel data directly from S3 instead of the local filesystem:

```
GET /rs/studies/{uid}/series/{uid}/instances/{uid}/frames/1
  -> s3.getObjectBuffer('dicomweb-data', '{StudyUID}/{SOPInstanceUID}')
  -> dicomParser.parseDicom(buffer)
  -> extract pixel data element (tag 7FE00010)
  -> stream as multipart/related response

GET /wadouri?studyUID=&seriesUID=&objectUID=
  -> s3.getObjectBuffer('dicomweb-data', '{StudyUID}/{SOPInstanceUID}')
  -> stream raw DICOM bytes (application/dicom)
```

AWS SDK `@aws-sdk/client-s3` is used for all S3 operations.

## 6.4 API Endpoints (DICOM Standards Implemented)

| Endpoint | Standard | Description |
|---|---|---|
| `GET /rs/studies` | QIDO-RS | Search studies (supports PatientName, PatientID, StudyDate filters) |
| `GET /rs/studies/{uid}/metadata` | QIDO-RS | Study + series metadata |
| `GET /rs/studies/{uid}/series` | QIDO-RS | List series in a study |
| `GET /rs/studies/{uid}/series/{uid}/instances` | QIDO-RS | List instances in a series |
| `GET /rs/studies/{uid}/series/{uid}/metadata` | QIDO-RS | Series + image-level metadata |
| `GET /rs/studies/{uid}/series/{uid}/instances/{uid}/metadata` | WADO-RS | Per-instance metadata (no pixel data) |
| `GET /rs/studies/{uid}/series/{uid}/instances/{uid}/frames/{n}` | WADO-RS | Pixel data as multipart/related |
| `GET /wadouri?studyUID=&seriesUID=&objectUID=` | WADO-URI | Full DICOM file retrieval |

## 6.5 Technology Stack

| Component | Technology |
|---|---|
| Web framework | Fastify 4.x |
| Database client | `pg` (node-postgres) 8.x |
| DICOM parsing | `dicom-parser` 1.8.x |
| Cloud storage | `@aws-sdk/client-s3` 3.x |
| Security | `@fastify/helmet`, `@fastify/cors` |
| Configuration | `config` package (environment-specific overrides via `NODE_CONFIG` env var) |
| Containerisation | Docker — deployed via Amazon ECS on EC2 (t2.micro, free tier) |
| Image registry | Amazon ECR |
| Logging | `simple-node-logger` (rolling daily log files) |

## 6.6 Deployment (AWS)

```
ECR (Docker image registry)
        |
ECS Cluster on EC2 t2.micro  (ap-southeast-2, Sydney)
  dicomweb-api container (port 5001)
  - ECS Task Role: s3:GetObject on dicomweb-data
  - NODE_CONFIG env var for DB credentials and AWS config
  - CloudWatch log group: /ecs/dicomweb-api
        |
        +---> Amazon RDS PostgreSQL (ap-southeast-2)
        |     DICOM metadata store
        |
        +---> Amazon S3 dicomweb-data (ap-south-2)
              DICOM pixel data store
```

CORS is configured to allow only the deployed viewer's origin (`viewerOrigin` config key), set via the `NODE_CONFIG` environment variable on the ECS task.

---

# 7. DICOM-Viewer

## 7.1 Legacy State

The original viewer ([MyPACS](https://github.com/pyb0924/MyPACS)) was a Windows-only desktop application with these characteristics:

| Aspect | Legacy (WPF) |
|---|---|
| Platform | Windows only — .NET WPF desktop application |
| Language | C# + XAML (MVVM with GalaSoft.MvvmLight Messenger) |
| DICOM library | fo-dicom — renders to WPF `WriteableBitmap` |
| Image retrieval | WADO-URI only — downloads full `.dcm` files to local disk before rendering |
| Query | QIDO-RS (PatientName/PatientID search) — working |
| Interactive tools | Window/Level: `// TODO WL/WW adjust by Mouse Drag` (not implemented); Zoom/Flip/Invert: menu stubs with no commands |
| MPR | Not present |
| WADO-RS | Not used |
| Deployment | Install on each Windows workstation |

## 7.2 Migration — Technology Choices

The WPF MVVM architecture maps cleanly to React + Zustand:

| WPF Concept | React Equivalent | Reason |
|---|---|---|
| `UserControl` / `ViewModel` | React component + Zustand store slice | 1:1 structural match |
| `GalaSoft.MvvmLight.Messaging` | Zustand `store.getState().action()` | Direct typed calls replace string-keyed events |
| `fo-dicom` + `WriteableBitmap` | `@cornerstonejs/core` WebGL rendering | GPU-accelerated, browser-native |
| WADO-URI disk download | WADO-RS frames endpoint + Web Worker decode | Zero disk I/O; stream pixels directly to GPU |
| `App.config` | `window.config` injected via `app-config.js` | Server-side config injection at runtime |

### Full Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Build tool | Vite | 5.x |
| Language | TypeScript | 5.x |
| UI framework | React | 18.x |
| State management | Zustand | 4.x |
| DICOM rendering | `@cornerstonejs/core` | 4.x — WebGL GPU rendering |
| Image loading | `@cornerstonejs/dicom-image-loader` | 4.x — WADO-URI and WADO-RS, Web Worker pixel decode |
| Interactive tools | `@cornerstonejs/tools` | 4.x — WindowLevel, Pan, Zoom, Flip, StackScroll |
| DICOM metadata | `dcmjs` | DicomMetaDictionary for tag lookups |
| Viewer server | Fastify 4.x (`server.js`) | Serves static SPA; injects `app-config.js`; sets COOP/COEP/CORP headers |
| Testing (unit) | Vitest + Testing Library | — |
| Testing (e2e) | Playwright | — |

## 7.3 What Was Added vs WPF

| Feature | WPF | React (new) |
|---|---|---|
| WADO-RS frames endpoint | Not used | `GET /rs/.../frames/1` — pixel data only, called by cornerstone3D Web Worker |
| Streaming prefetch | Sequential blocking downloads | `imageRetrievalPool` — concurrent fetch; first frame renders while rest load |
| Disk writes | Every instance saved as `.dcm` to disk | Zero I/O — pixel bytes flow: network -> Web Worker -> GPU texture -> canvas |
| Window/Level | `// TODO` (not implemented) | `WindowLevelTool` — left-click drag; GPU shader update at 60fps; live WL/WW overlay |
| Pan, Zoom, Flip H/V, Invert | Menu stubs (no commands) | Full `@cornerstonejs/tools` ToolGroup — all real, mouse/keyboard bound |
| Mouse-wheel stack scroll | Slider only | `StackScrollMouseWheelTool` + slider |
| MPR (volume rendering) | Not present | Axial/Coronal/Sagittal via `VolumeViewport` + `SharedArrayBuffer` |
| WADO-RS metadata | Not used | `GET /rs/.../instances/{uid}/metadata` — instant overlay text without pixel data |

## 7.4 Component Map (WPF to React)

| WPF Component | React Component | File |
|---|---|---|
| `MainWindow.xaml` | `App.tsx` | `src/App.tsx` |
| `QRWindow.xaml` + `QRViewModel` | `QRModal.tsx` + `useQRStore` | `src/components/QRModal.tsx` |
| `FileExplorerViewModel` | `useStudyTreeStore` | `src/store/studyTreeStore.ts` |
| `MainWindow.xaml TreeView` | `StudyTree.tsx` | `src/components/StudyTree.tsx` |
| `Viewer2D.xaml Image` (WPF WriteableBitmap) | `CornerstoneViewport.tsx` | `src/components/CornerstoneViewport.tsx` |
| `Viewer2D.xaml TextBlocks` (corner overlays) | `CornerOverlay.tsx` | `src/components/CornerOverlay.tsx` |
| `Viewer2D.xaml Slider` | `InstanceSlider.tsx` | `src/components/InstanceSlider.tsx` |
| `AnnotationViewModel` | `toolbarStore.annotationToggle` | `src/store/toolbarStore.ts` |
| `StatusViewModel` + Messenger | `useStatusStore` | `src/store/statusStore.ts` |
| `ExitViewModel` | **Removed** | Browsers cannot close tabs programmatically |

## 7.5 Data Flow Comparison

```
WPF:
  Tree click -> FileExplorerViewModel
    -> DicomFile.Open(localPath) [disk read]
    -> Messenger.Send("key_selectedChange")
      -> Viewer2DViewModel.OnSelectedChange
        -> DicomFile.Open(path) -> DicomImage.RenderImage()
          -> WriteableBitmap [CPU decode, RAM copy, WPF paint]

React:
  Tree click -> studyTreeStore.selectInstance(sopUid)
    -> builds imageIds[] from QIDO-RS instance list
    -> viewerStore.setActiveStack(imageIds, index)
      -> CornerstoneViewport useEffect detects imageIds change
        -> stackViewport.setStack(imageIds, 0)
          -> dicom-image-loader Web Worker
            -> GET /rs/.../frames/1 (WADO-RS)
              -> decode pixels -> GPU texture -> WebGL canvas
            -> metadata cache -> viewerStore.updateOverlayText()
              -> CornerOverlay re-renders
```

## 7.6 Phased Implementation

| Phase | Goal | Key Additions |
|---|---|---|
| 1 | Project scaffold — Vite + React + TypeScript builds and runs | `vite`, `react`, `zustand`, dev proxy to API |
| 2 | QIDO-RS study browser — Q/R modal, study tree, status bar | `dicomWebClient.ts`, Zustand stores, layout components |
| 3 | WADO-URI basic image viewer — select series, images render | `@cornerstonejs/core`, `@cornerstonejs/dicom-image-loader`, `CornerstoneViewport` |
| 4 | WADO-RS pixel streaming + interactive tools — W/L drag, Pan, Zoom, Flip | `@cornerstonejs/tools`, ToolGroup, WADO-RS imageIds |
| 5 | Multi-frame MPR volume viewport — Axial/Coronal/Sagittal | `@cornerstonejs/streaming-image-volume-loader`, `VolumeViewport`, `SharedArrayBuffer` |
| 6 | Annotation overlay | DICOM overlay bits (group 60xx) via WADO-URI fallback |
| 7 | Server build integration — `npm run build` -> served by Fastify `server.js` | `vite.config.ts` `outDir: dist`, `app-config.js` injection |

## 7.7 API Endpoints Used by the Viewer

| Component | Endpoint | Standard |
|---|---|---|
| Q/R study search | `GET /rs/studies?PatientName=*` | QIDO-RS |
| Load series list | `GET /rs/studies/{uid}/series` | QIDO-RS |
| Load instance list | `GET /rs/studies/{uid}/series/{uid}/instances` | QIDO-RS |
| WADO-URI image load | `GET /wadouri?studyUID=&seriesUID=&objectUID=` | WADO-URI |
| WADO-RS pixel data | `GET /rs/studies/{uid}/series/{uid}/instances/{uid}/frames/1` | WADO-RS |
| Metadata (overlay text) | `GET /rs/studies/{uid}/series/{uid}/instances/{uid}/metadata` | WADO-RS |
| MPR volume | `GET /rs/.../frames/1` (all instances in series) | WADO-RS |

## 7.8 SharedArrayBuffer / MPR Headers

MPR volume rendering via `@cornerstonejs/streaming-image-volume-loader` requires `SharedArrayBuffer`, which in turn requires the server to set three HTTP security headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: cross-origin
```

These are set in `server.js` (the Fastify SPA server) and are already in place — no changes were needed to enable MPR.

## 7.9 Deployment (AWS)

The viewer is deployed to **AWS Elastic Beanstalk** (Node.js 20 platform, `ap-southeast-2`):

```
Browser (HTTP :80)
    |
EB nginx (reverse proxy to port 8080)
    |
Node.js Fastify server.js (port 8080)
    - GET /app-config.js  -> window.config = { apiUrl: process.env.API_URL }
    - GET /assets/*       -> pre-built React/Vite static files (dist/)
    - GET /*              -> SPA fallback (dist/index.html)
```

The `API_URL` environment variable is set in the EB environment, pointing to the ECS-hosted API server. This allows the API endpoint to be changed without rebuilding the React app — only the Fastify server is restarted.

**Build and deploy flow:**
```bash
npm run build          # tsc + vite build -> dist/
# Package dist/ + server.js + package.json into a zip
# Upload zip to S3, register as EB application version, deploy to environment
```

## 7.10 What Was Not Migrated

| WPF Feature | Decision | Reason |
|---|---|---|
| `ExitViewModel` | Removed | Browsers cannot close a tab programmatically |
| DIMSE C-Find / C-Get | Removed | Browsers have no raw TCP access; replaced by QIDO-RS/WADO-RS |
| Local file OS dialog (arbitrary path) | Partial | `<input type="file">` works but cannot access arbitrary filesystem paths |
| Recursive local folder scan | Partial | `webkitdirectory` attribute covers folder selection |
| Annotation `.dcm` write to disk | Removed | Browsers cannot write arbitrary files; would need STOW-RS as a future addition |
| WL/WW stubs, Zoom/Flip/Invert stubs | Fully implemented | These were TODO/stub in WPF; `@cornerstonejs/tools` makes them complete in React |
