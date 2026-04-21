# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: production ──────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN apk add --no-cache python3 make g++ sqlite

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/build ./build

ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV PORT=3000

# Persistent volume for SQLite database and backups
VOLUME ["/data"]

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -q -O- http://localhost:3000/api/health || exit 1

CMD ["node", "build/index.js"]
