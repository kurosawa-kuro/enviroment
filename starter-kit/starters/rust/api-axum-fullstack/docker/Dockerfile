# Frontend build stage
FROM node:22-bookworm-slim AS frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Backend build stage
FROM rust:1.84-slim AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src
COPY src/ src/
RUN touch src/main.rs && cargo build --release

# Runtime stage
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN mkdir -p /app/data
COPY --from=builder /app/target/release/starter /usr/local/bin/starter
COPY --from=frontend /app/client/dist /app/client/dist
ENV STATIC_DIR=/app/client/dist
ENV DB_PATH=/app/data/db.sqlite3
EXPOSE 8080
CMD ["starter"]
