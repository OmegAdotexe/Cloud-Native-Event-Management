# CampusConnect / Relay Backend

This is the Spring Boot modular monolith backend for CampusConnect.

## Requirements
* Java 21
* Maven
* Docker Compose (for PostgreSQL and RabbitMQ)

## Setup and Run

1. Copy `.env.example` to `.env` and set `JWT_SECRET` to a Base64URL-encoded value representing at least 32 random bytes. Spring Boot loads either `backend/.env` or the repository-root `.env`; neither file is committed:
   ```bash
   cp .env.example .env
   ```

   In Windows PowerShell, generate a compatible value with:
   ```powershell
   $bytes = New-Object byte[] 32
   $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
   $rng.GetBytes($bytes)
   $rng.Dispose()
   [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
   ```

2. Start the infrastructure (PostgreSQL and RabbitMQ):
   ```bash
   docker-compose up -d
   ```

3. Build and test the application:
   ```bash
   mvn clean package
   ```

4. Run the application:
   ```bash
   mvn spring-boot:run
   ```

   To create the demo accounts, add the `dev` profile:
   ```bash
   mvn -Dspring-boot.run.profiles=dev spring-boot:run
   ```

## Services
* API runs on `http://localhost:8080`
* RabbitMQ Management UI runs on `http://localhost:15672` (guest/guest)
* PostgreSQL runs on `localhost:5432`
* Actuator Health endpoint: `http://localhost:8080/actuator/health`
