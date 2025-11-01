# Node.js Alpine base image for development
FROM node:18-alpine AS development

# Set working directory
WORKDIR /workspace

# Install dependencies for native modules and pnpm
RUN apk add --no-cache python3 make g++ curl && \
    npm install -g pnpm@10.19.0

# Copy workspace configuration files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy shared package
COPY packages ./packages

# Copy backend package
COPY apps/backend ./apps/backend

# Install dependencies for the entire workspace
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
WORKDIR /workspace/apps/backend
RUN pnpm prisma generate

# Set working directory to backend
WORKDIR /workspace/apps/backend

# Expose port
EXPOSE 5000

# Start development server
CMD ["pnpm", "run", "start:dev"]

# Production build stage
FROM node:18-alpine AS build

WORKDIR /workspace

# Install pnpm
RUN npm install -g pnpm@10.19.0

# Copy workspace configuration files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy shared package
COPY packages ./packages

# Copy backend package
COPY apps/backend ./apps/backend

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Set working directory to backend
WORKDIR /workspace/apps/backend

# Generate Prisma Client
RUN pnpm prisma generate

# Build the application
RUN pnpm run build

# Production stage - Debian-based for Prisma compatibility
FROM node:18-slim AS production

WORKDIR /workspace

# Create non-root user first
RUN groupadd -g 1001 nodejs && \
    useradd -m -u 1001 -g nodejs nestjs

# Install system dependencies (curl for healthcheck, OpenSSL for Prisma)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl openssl ca-certificates && \
    npm install -g pnpm@10.19.0 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy workspace configuration files
COPY --chown=nestjs:nodejs package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy shared package
COPY --chown=nestjs:nodejs packages ./packages

# Copy backend package.json
COPY --chown=nestjs:nodejs apps/backend/package.json ./apps/backend/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Set working directory to backend
WORKDIR /workspace/apps/backend

# Copy built application from build stage
COPY --chown=nestjs:nodejs --from=build /workspace/apps/backend/dist ./dist

# Copy Prisma schema and .env file
COPY --chown=nestjs:nodejs --from=build /workspace/apps/backend/prisma ./prisma
COPY --chown=nestjs:nodejs apps/backend/.env ./.env

# Generate Prisma Client for production
RUN pnpm prisma generate

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/v1/health || exit 1

# Start production server
CMD ["node", "dist/main.js"]