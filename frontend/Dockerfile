# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package manifests (lock file may or may not exist)
COPY package.json ./
# Try to copy the lock if present; ignore error if missing
# (Docker can’t conditionally copy; we handle the condition in RUN)
COPY package-lock.json . 2>/dev/null || true

# Install: use `npm ci` when lock exists; otherwise fall back to `npm install`
RUN if [ -f package-lock.json ]; then \
      echo "Using package-lock.json -> npm ci"; \
      npm ci; \
    else \
      echo "No package-lock.json -> npm install"; \
      npm install; \
    fi

# Copy source
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]