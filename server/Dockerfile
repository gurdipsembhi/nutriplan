# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (layer cache — only re-runs npm install if these change)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: Production ──────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Only install production dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Cloud Run sets PORT env var (default 8080)
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/index.js"]
