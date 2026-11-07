# Event Management Platform (Relay / CampusConnect)

Full-stack, cloud-native event operations platform for campuses and organizations.

---

## 🌐 Quick Access Links (Local Development)

| Application | URL | Description |
|---|---|---|
| **Frontend Web App** | [http://localhost:5173](http://localhost:5173) | Main user interface (React 18 + Vite) |
| **Backend REST API** | [http://localhost:8080](http://localhost:8080) | REST API endpoints (`/api/...`) |
| **Swagger UI / OpenAPI Docs** | [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html) | Interactive API documentation & JWT test console |
| **OpenAPI Spec (JSON)** | [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs) | Machine-readable API schema |
| **Actuator Health** | [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health) | Subsystem health check (`db`, `rabbit`, `mail`, `disk`, `ping`) |
| **MailHog Web Inbox** | [http://localhost:8025](http://localhost:8025) | View sent notification emails |
| **RabbitMQ Management** | [http://localhost:15672](http://localhost:15672) | Message broker console (`guest` / `guest`) |

---

## 🔑 Demo Accounts

All accounts use the password: **`password`**

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Super Admin** | `superadmin@example.com` | `password` | Global metrics, platform-wide oversight, user management, reassign events |
| **Event Admin** | `admin@example.com` | `password` | Create events, manage registrations, verify gate passes, update timelines |
| **Participant** | `participant@example.com` | `password` | Browse events with category filters, register, view printable QR passes |

---

## 🎫 Key Features

### 1. Digital Passes & QR Code Admission Control
- **Participant Pass (`TicketModal.jsx`)**: When registered, attendees can view and print an official admission pass featuring dynamic QR code generation.
- **Venue Gate Verifier (`TicketVerifierModal.jsx`)**: Organizers can verify attendee passes at the door by code (e.g. `CC-2026-E1-R1`) or scanned URL to confirm legitimacy, prevent duplicate entries, and block unapproved attendees.

### 2. Category Filtering & Search
- Participants can instantly filter events by categories (`WORKSHOP`, `SEMINAR`, `SPORTS`, `CULTURAL`, `OTHER`) and search by keyword in real time.

### 3. Asynchronous Notifications & Message Broker
- Event actions (registrations, cancellations, timeline updates) publish AMQP messages to RabbitMQ.
- Email workers process the queue asynchronously and deliver styled HTML emails to MailHog.

### 4. Interactive OpenAPI 3.0 (Swagger UI)
- Fully interactive API explorer with JWT Bearer authentication support at `/swagger-ui/index.html`.

---

## 🚀 How to Start and Stop Locally

From the root `EMS` directory, run:
- **`start.bat`**: Starts PostgreSQL & MailHog containers, launches the Spring Boot backend server, and starts the Vite frontend dev server.
- **`stop.bat`**: Shuts down the Docker containers and terminates background dev servers cleanly.
- **`start-dev.ps1`**: PowerShell alternative with automated Java 25 detection and health checks.

---

## 🐳 Production Container Deployment

To build and run the entire platform (Frontend + Backend + PostgreSQL + RabbitMQ + MailHog) as unified containers:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Access the production frontend at `http://localhost` (port 80).

---

## 🧪 Automated Testing

The backend includes a comprehensive integration and unit test suite:

```bash
cd backend
mvn test
```

- **39 / 39 automated tests passing** (0 failures, 0 errors, 0 skipped).

---

## 📐 Architecture & Technology Stack

- **Frontend**: React 18, Vite, React Router, Recharts, Lucide Icons (`src/`)
- **Backend**: Spring Boot 3.3.4, Java 25 LTS, Spring Security + JWT, Spring Data JPA, Springdoc OpenAPI (`backend/`)
- **Database**: PostgreSQL 15 (`campusconnect-postgres` Docker container on port `5433`)
- **Message Broker**: RabbitMQ 4.4.0 on port `5672`
- **Email Server**: MailHog on port `1025` (SMTP) & `8025` (Web UI)
