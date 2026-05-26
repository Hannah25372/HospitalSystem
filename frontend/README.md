# Prerequisites
- Node.js 18+
- Java 17

# How to run

Use script at `project_root/run-dev.bat` to start all services on windows. Run from project_root with:
```powershell
.\run-dev.bat
```

To start all services manually, follow the below steps.


### 1. Start the backend

```powershell
cd backend
.\gradlew.bat bootRun    # Windows

.\gradlew bootRun        # Mac/Linux
```
Runs on localhost:9090 (gRPC) + http://localhost:8080/h2-console (H2)

### 2. Start the gateway 

The backend must be already running.

```powershell
cd gateway
npm install    # first time only
npm run dev
```

GraphQL served at http://localhost:4000/graphql

### 3. Start the frontend

```powershell
cd frontend
npm install      # first time only
npm run dev
```

App at http://localhost:5173


# Running codegen
  
Running codegen regenerates TypeScript types if the GraphQL schema changes.
To run:
```powershell
cd frontend
npm run codegen
```


# Views / routes
- /patients
  - Patient list with hospital filter.
  - Option to view patients (link to dashboard) and register patients/hospitals (link to registration form)
- /patients/:id
  - Patient dashboard including info panel, registered hospitals, quarterly stay summary chart, stay history, and bills.
  - Options to edit/delete patients and hospitals, create/cancel stays, and generate bills
- /register
  - Create new patient, create new hospital, or register existing patient into existing hospital

# Running tests
Api tests have been created for a selection of events. These require the backend and the gateway to be running. They build on each other and run in order, resulting in populating the database.

Use script at `project_root/run-api-tests.bat` to start required services and run tests. Run from project_root with:
```powershell
.\run-api-tests.bat
```

To run manually, start the backend and gateway services with the instructions above.

Once running, run the tests with:
```powershell
cd gateway
npm test
```