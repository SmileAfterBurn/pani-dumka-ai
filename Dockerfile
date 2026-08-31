# Multi-stage production Dockerfile for Pani Dumka (Cloud Run ready)
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build Vite client and esbuild server
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy production package.json and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built distribution files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Run Pani Dumka full-stack server
CMD ["node", "dist/server.cjs"]
