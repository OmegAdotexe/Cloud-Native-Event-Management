# CampusConnect / Relay Backend

This is the Spring Boot 3.x modular monolith backend for **CampusConnect** (Relay).

## Prerequisites
* **Java 21+** (JDK 21 or higher)
* **Apache Maven 3.9+** (or use an IDE with Maven integration)
* **Docker & Docker Compose** (for PostgreSQL, RabbitMQ, and MailHog)

---

## Setup and Run

### 1. Environment Configuration
The backend loads environment variables from either `backend/.env` or the project root `.env`.

Copy the sample environment file if you don't already have one:
```bash
# From the backend directory:
cp .env.example .env
```

Ensure `JWT_SECRET` is set to a valid 256-bit (32+ byte) Base64URL-encoded key. You can generate one in Windows PowerShell with:
```powershell
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
[Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
```

### 2. Start Infrastructure
Launch PostgreSQL, RabbitMQ, and MailHog containers:
```bash
docker compose up -d
```
*(If using older Docker Compose standalone, use `docker-compose up -d`)*

### 3. Build the Application
```bash
mvn clean compile
```
Or to run tests and package the JAR:
```bash
mvn clean package
```

### 4. Run the Backend

#### Option A: With Docker Infrastructure (PostgreSQL + RabbitMQ + MailHog)
Ensure `docker compose up -d` is running.

**PowerShell (Windows)**:
```powershell
# Pre-seeded with demo accounts:
mvn spring-boot:run "-Dspring-boot.run.profiles=dev"

# Or setting the environment variable:
$env:SPRING_PROFILES_ACTIVE="dev"; mvn spring-boot:run
```

**Bash / CMD**:
```bash
mvn -Dspring-boot.run.profiles=dev spring-boot:run
```

> **Note for PowerShell Users**: Always enclose `-Dspring-boot.run.profiles=...` in quotes (e.g., `"-Dspring-boot.run.profiles=dev"`). Otherwise, PowerShell treats the dot (`.run`) as a member access token and throws `Unknown lifecycle phase ".run.profiles=dev"`.

#### Option B: Standalone Without Docker (In-Memory H2 Mode)
If you don't have Docker installed or running, you can boot the backend immediately using the `local` profile (uses an embedded in-memory H2 database with schema auto-generated):

**PowerShell (Windows)**:
```powershell
mvn spring-boot:run "-Dspring-boot.run.profiles=local,dev"
```

**Bash / CMD**:
```bash
mvn -Dspring-boot.run.profiles=local,dev spring-boot:run
```

---

## Pre-seeded Demo Credentials (with `dev` profile)

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `superadmin@example.com` | `password` |
| **Event Admin** | `admin@example.com` | `password` |
| **Participant** | `participant@example.com` | `password` |

---

## Services & Ports

| Service | Port / URL | Credentials / Notes |
|---|---|---|
| **Backend REST API** | `http://localhost:8080` | Spring Boot 3.3 |
| **Actuator Health** | `http://localhost:8080/actuator/health` | Application status |
| **PostgreSQL** | `localhost:5432` | DB: `campusconnect`, User: `postgres`, Pass: `postgres` |
| **RabbitMQ AMQP** | `localhost:5672` | Messaging broker |
| **RabbitMQ Management UI** | `http://localhost:15672` | User: `guest`, Pass: `guest` |
| **MailHog Web UI** | `http://localhost:8025` | Inspect outgoing emails |
| **MailHog SMTP** | `localhost:1025` | Local SMTP sink |

---

## Troubleshooting

* **Database Connection Refused**: Ensure PostgreSQL is healthy via `docker compose ps`.
* **RabbitMQ Connection Error**: Ensure the RabbitMQ container is running before launching the backend (`docker compose up -d rabbitmq`).
* **VS Code / Eclipse Lombok Issues**: If you experience cached bytecode or annotation processing issues in VS Code, run `Java: Clean Java Language Server Workspace` from the command palette (`Ctrl+Shift+P`).
