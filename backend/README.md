# CampusConnect / Relay Backend

This is the Spring Boot modular monolith backend for CampusConnect.

## Requirements
* Java 21
* Maven
* Docker Compose (for PostgreSQL and RabbitMQ)

## Setup and Run

1. Copy `.env.example` to `.env` (optional, Spring Boot will use defaults matching `docker-compose` out of the box if environment variables are not set):
   ```bash
   cp .env.example .env
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

## Services
* API runs on `http://localhost:8080`
* RabbitMQ Management UI runs on `http://localhost:15672` (guest/guest)
* PostgreSQL runs on `localhost:5432`
* Actuator Health endpoint: `http://localhost:8080/actuator/health`
