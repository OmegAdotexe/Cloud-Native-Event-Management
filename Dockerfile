# ==============================================================================
# Multi-stage Dockerfile for CampusConnect Frontend
# ==============================================================================

# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy sources and build Vite SPA
COPY . .
RUN npm run build

# Runner Stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
