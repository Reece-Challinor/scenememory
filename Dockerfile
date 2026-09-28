# Multi-stage Dockerfile for SceneMemory
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install dependencies reproducibly
RUN npm ci

# Copy source code and scripts
COPY . .

# Fetch and verify model assets
RUN node scripts/fetch-model.mjs

# Build production web bundle
RUN npm run build

# Production Runtime Stage
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/MODEL_PROVENANCE.md ./MODEL_PROVENANCE.md

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:8080/healthz').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
