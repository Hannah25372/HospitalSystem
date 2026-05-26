# Prerequisites
- Java 17
- Gradle includes all other installs/dependencies.

# Ports & endpoints
- gRPC server: `localhost:9090`
- H2 console: `http://localhost:8080/h2-console`
    - JDBC URL: jdbc:h2:mem:hospitaldb
    - Username: sa, Password: (empty)

# Architecture
Spring Boot 3.5 + Java 17, 
four gRPC services (Hospital, Patient, Stay, Bill) exposed on port 9090, 
JPA entities using an H2 in-memory database (schema is auto-created on startup and dropped on shutdown).


# How to run
### Windows
```powershell
cd backend
.\gradlew.bat bootRun
```

### Linux/Mac
```powershell
cd backend
.\gradlew bootRun
```

# Running tests
Service tests located at `backend\src\test\java\com\hospital\hospital_service\service`
These test the interation with the database.
They can be run in the IDE or with command:
```powershell
cd backend
gradlew.bat test   # Windows
```