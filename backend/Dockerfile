
# Build stage
FROM golang:1.22-alpine AS builder

# Provide a module path for first-time init (override via docker-compose build args)
ARG MODULE_PATH=github.com/yourname/caseinventory
ENV CGO_ENABLED=0

WORKDIR /app

# Copy source code first (so we can detect if go.mod exists)
COPY . .

# Install git (needed for fetching modules) and run conditional init/tidy
RUN apk add --no-cache git bash && \
    if [ ! -f go.mod ]; then \
      echo "go.mod not found. Initializing module: ${MODULE_PATH}"; \
      go mod init "${MODULE_PATH}"; \
    else \
      echo "go.mod found. Skipping init."; \
    fi && \
    echo "Tidying modules (will create/update go.sum)..." && \
    go mod tidy

# Build the application (adjust path if your main package is elsewhere)
RUN GOOS=linux GOARCH=amd64 go build -o main .

# Final stage
FROM alpine:latest
WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/main .

# Expose port
EXPOSE 8080

# Command to run
CMD ["./main"]
