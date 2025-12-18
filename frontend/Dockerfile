# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package manifests; the glob will match package.json and package-lock.json if present
COPY package*.json ./

# Install deps: prefer npm ci when lockfile exists, else fallback to npm install
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