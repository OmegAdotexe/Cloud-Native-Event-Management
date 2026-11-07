# ==============================================================================
# Multi-stage Dockerfile for CampusConnect Backend
# ==============================================================================

# Build Stage
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# Install maven
RUN apk add --no-cache maven

# Copy pom.xml and source code
COPY pom.xml .
COPY src src

# Build executable jar
RUN mvn clean package -DskipTests -B

# Runner Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy jar from builder
COPY --from=builder /workspace/target/backend-*.jar app.jar

ENV SERVER_PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
