# 1. Introduction 

The Objective of this project is to migrate & modernise a legacy code using AI. No improvement or new features will be added.  
A PACS system was chosen for this which includes Dicom-Server and Dicom-Viewer. Two different project were used
1. [Dicom-Server](https://github.com/knopkem/dicomweb-pacs/tree/master) : is nodejs application with local DICOM storage and sqllite DB 
2. [Dicom-viewer](https://github.com/pyb0924/MyPACS) : a .NET WPF windows application with a native C++ binding wrapping DCMTK. No support to WADO, REST. 

Objectives:
1. Modernize DICOM-Server: support cloud storage for DICOM, RDS and Containerized deployment.
2. Migrate DICOM-viewer: migrate from Windows application to Web application, .NET WPF to React/Vite, support WADO/QIDO 

# 2. Architecture (Legacy and New)
- Architecture transformation: monolith to microservices, on-prem to cloud

# 3. Strategy 

1. Plan
2. Simplify 
3. Follow a process 
4. Execute in Phases
5. Automate testing
6. Deployment Plan
7. Deploy

#### 3.1 Plan
Created a multi-step, phased plan. e.g. Migrating viewer and modernizing server are two different step. migrating DB or using S3 for file share are 
different phases. make sure step are independant and phases can be tested at every stage.

#### 3.2 Simplify
Try to simplify, either by moving files or folders to create logical structures inline with the steps/phases.
or remove unecessary components/features/Files which is not required for migration.
Make sure the code is clean and is buildable

#### 3.3 Follow a process
Constrain: Though AI can generate code. often we find it loosing context when build large project or complex logic. also It generates bad code espicially when you debug or change/upgrade features.
In this project we tried to follow Test Driven Development (TDD) to over come the above constrain. 

Constrain: how should requirements be captured. we humans follow Features & User stories. AI follows PRD.md. 
We tried to capture requirements as Behaviours, as in Behaviour Driven Development (BDD), which are simple for both humans & AI to understand.

Make sure behaviours are grouped inline with steps and phases.

#### 3.4 Execute in Phases
Stay in control of the migration and code. 
Instruct the AI to execute a phase following the plan, follow TDD as-in write the test case, write minimal code and then refactor the code. wait for your instruction before starting next phase. 

once a phase is complete either use another AI or manually build and run the application. verify the no issues are found.

In each step, execute every phase one after another till all steps and phases are complete.

#### 3.5  Automate testing
Automate all test cases, since requirements are captured as behaviours, its easy to use framework like playwrite for automation. 
test cases are organised and aliged to phases. 

End of every phase, test cases were executed relavent for that phase and also a regression was performed. 

#### 3.6 Deployment Plan
Create a seperate deployment plan. so that you have the flexibility or options in deployment. Also have this plan to be implemented in phases.
This will include cosmetic code changes, Cloud configuration & scripts, updating test cases etc.

#### 3.7 Deploy & Verify
Setup the environment. in case of AWS, Create new user, provide permission, setup CLI etc. 
 
You can manually execute the plan or use AI. after each phase, verify the deployment.

# 4. Claude Code
Claude code is a Senior Engineer who is beside you and executs tasks as you instruct. Its CLI based and very powerful. 
The only draw back was that inspite of having a PRO subscripts, the usage limit was reaching very often and to wait. 

# 5. Documents
All plans, scripts, test-cases, reports, orininal and migrated codes are avaliable in this repository. 

# 6. DICOM-Server

# 7. DICOM-viewer
 
