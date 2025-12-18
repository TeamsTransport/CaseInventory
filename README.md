# Drive Safe Bonus Tracker - Full Stack Edition

A comprehensive driver safety management system with React frontend, Go backend, and MariaDB database.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- Go 1.22+ (for local development)

### Option 1: Run with Docker (Recommended)

```bash
# Clone and setup
./setup.sh

# Build and run all services
docker-compose up --build

# Access the application:
# Frontend: http://localhost
# Backend API: http://localhost:8080
# Database: localhost:3306 (user: user, password: password)