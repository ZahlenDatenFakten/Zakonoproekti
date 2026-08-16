# Multi-Stage Production Build for State Registry Portal
# Stage 1: Build Frontend Assets
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors & install dependencies
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit

# Copy application source code
COPY . .

# Build production bundle with TypeScript check
RUN npm run build

# Stage 2: Production Web Server (Node.js)
FROM node:20-alpine AS production

WORKDIR /app

# We only need the production dependencies for the server (express, cors, etc)
COPY package*.json ./
RUN npm ci --omit=dev --prefer-offline --no-audit

# Copy the server script and the built frontend assets
COPY server.js ./
COPY --from=builder /app/dist ./dist

# Create an empty config.json so we can set correct permissions
RUN touch config.json && \
    chown node:node config.json && \
    chmod 666 config.json

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

ENV PORT=3000

CMD ["node", "server.js"]
