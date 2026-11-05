# Relay / CampusConnect

**Relay** (CampusConnect) is a full-stack event operations platform for campuses and organizations. It provides event creation and publishing, schedule and timeline management, capacity enforcement with automatic waitlist promotion, real-time analytics, and asynchronous notification delivery.

---

## Architecture Overview

* **Frontend**: React 18 SPA built with Vite, React Router, Recharts, and Lucide Icons (`src/`).
* **Backend**: Spring Boot 3.x modular monolith with Spring Security, Spring Data JPA, and Spring AMQP (`backend/`).
* **Database**: PostgreSQL 15+ (`backend/docker-compose.yml`).
* **Message Broker**: RabbitMQ 3.x for asynchronous notification dispatch.
* **Email Testing**: MailHog local SMTP server and web inbox.

---

## Prerequisites

Ensure you have the following installed on your local machine:
* **Node.js** 18+ and **npm** 9+
* **Java** 21+ (JDK 21 or higher)
* **Apache Maven** 3.9+ (or use IDE-bundled Maven)
* **Docker & Docker Compose** (Docker Desktop on Windows/macOS, or Docker engine on Linux)

---

## Quick Start (Run Locally)

### 1. Configure Environment Variables
Copy `.env.example` to `.env` in the repository root:
```bash
cp .env.example .env
```
*(The provided `.env.example` already contains development-ready secrets and database settings).*

---

### 2. Start the Infrastructure (Docker)
In a terminal, navigate to the `backend` folder and start PostgreSQL, RabbitMQ, and MailHog:
```bash
cd backend
docker compose up -d
```
*(Verify services are running with `docker compose ps`)*

---

### 3. Start the Backend API
From the `backend` directory, run the Spring Boot application with the `dev` profile to automatically seed demo user accounts:

```bash
mvn -Dspring-boot.run.profiles=dev spring-boot:run
```

Once started, the backend API will be available at **`http://localhost:8080`**.

---

### 4. Start the Frontend
Open a new terminal window in the project root directory (`SEproject/`):

```bash
# Install frontend dependencies (first time only)
npm install

# Start the Vite development server
npm run dev
```

Open your browser and navigate to **`http://localhost:5173`**.

---

## Pre-seeded Demo Accounts

When the backend starts with `-Dspring-boot.run.profiles=dev`, the following demo accounts are created:

| Role | Email | Password | Access & Capabilities |
|---|---|---|---|
| **Super Admin** | `superadmin@example.com` | `password` | Full platform overview, cross-organizer management, reassign events, global metrics |
| **Event Admin** | `admin@example.com` | `password` | Create events, publish drafts, manage registrations, manage timelines, view analytics |
| **Participant** | `participant@example.com` | `password` | Browse published events, register, join waitlists, manage personal registrations |

---

## Ports and Dashboards

| Service | URL / Port | Credentials / Purpose |
|---|---|---|
| **Frontend Web App** | `http://localhost:5173` | Main user interface |
| **Backend REST API** | `http://localhost:8080` | REST API |
| **Actuator Health Check**| `http://localhost:8080/actuator/health` | Server health and metrics |
| **PostgreSQL Database**| `localhost:5432` | DB: `campusconnect`, User: `postgres`, Pass: `postgres` |
| **RabbitMQ Management** | `http://localhost:15672` | User: `guest`, Pass: `guest` |
| **MailHog Web Inbox** | `http://localhost:8025` | View outgoing email notifications |

---

## Useful Development Commands

### Frontend
```bash
npm run dev       # Start Vite dev server with Hot Module Replacement (HMR)
npm run build     # Build production bundle to dist/
npm run preview   # Preview production build locally
```

### Backend
```bash
cd backend
mvn clean compile                        # Compile all Java sources
mvn test                                 # Run test suite
mvn -Dspring-boot.run.profiles=dev spring-boot:run  # Run app with demo accounts
docker compose down                      # Stop infrastructure containers
docker compose down -v                   # Stop infrastructure and wipe database volume
```

---

## Common Troubleshooting

* **Port 5432 or 5672 in use**: If you already have local PostgreSQL or RabbitMQ services running on your machine, stop them before running `docker compose up -d`.
* **PowerShell Execution Policy Error on Windows**: If `npm run dev` produces a `.ps1 cannot be loaded` security error, use `npm.cmd run dev` or adjust your PowerShell execution policy (`Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`).
* **VS Code / Eclipse Lombok Compilation Issues**: If you experience bytecode discrepancies in VS Code, open the Command Palette (`Ctrl + Shift + P`), run **`Java: Clean Java Language Server Workspace`**, and restart the IDE.
* **Vite Proxy**: The frontend development server automatically proxies all `/api` requests to `http://localhost:8080` via `vite.config.js`. Ensure the backend is started before making API requests from the frontend.

