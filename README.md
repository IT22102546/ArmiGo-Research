# 🎓 Armigo Platform

## 📋 Introduction

ArmiGo is a gamified VR-based therapy system designed specifically for upper limb rehabilitation in children with hemiplegia. This innovative solution integrates multi-sensor wearable technology, real-time machine learning, immersive virtual reality, and dedicated mobile and web applications to create a complete digital therapy ecosystem.

Developed in response to the critical gaps in pediatric rehabilitation—including lack of access, high costs, low motivation, and limited therapist availability ArmiGo enables home-based therapy that is both engaging and clinically effective. Through sensor-fused gloves and sleeves, interactive VR games, AI-powered feedback, and companion mobile/web apps, the system not only tracks movement but also guides, corrects, and motivates young patients while keeping therapists and parents connected throughout the recovery journey.

The integrated mobile app allows parents to monitor progress and schedule sessions, while the web-based clinical dashboard provides therapists with detailed analytics and remote supervision capabilities. Designed specifically for Sri Lanka and similar low-resource settings, ArmiGo stands as a scalable, affordable, and holistic rehabilitation platform—empowering children to regain movement, independence, and confidence through technology-enabled care.

## 📋 Prerequisites

### Required Software

1. **Node.js** v20.x or higher
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **pnpm** v10.19.0 or higher

   ```bash
   # Install pnpm globally
   npm install -g pnpm@10.19.0

   # Verify installation
   pnpm --version
   ```

3. **PostgreSQL** v15 or higher
   - Windows: https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql@15`
   - Linux: `sudo apt-get install postgresql-15`

4. **Git**
   - Download: https://git-scm.com/downloads
   - Verify: `git --version`

### Optional (Recommended)

- **Docker Desktop**: For containerized development ([Download](https://www.docker.com/products/docker-desktop))
- **Redis**: For caching (optional in development)
- **VS Code**: With recommended extensions

---

## 🚀 Quick Start

### Local Development Setup

Continue to [Installation](#-installation) for detailed setup instructions.

---

## 📥 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/FAITE-TECH/learnup-platform.git
cd learnup-platform
```

### Step 2: Install Dependencies

The project uses pnpm workspaces. Install all dependencies from the root:

```bash
pnpm install
```

**Note**: If prompted to approve build scripts, select **"Yes, approve all"** (especially for `@prisma/client`, `@nestjs/core`, `electron`).

### Step 3: Database Setup

Choose one of the following methods:

#### Method A: Local PostgreSQL

1. **Create Database**:

   ```bash
   # Connect to PostgreSQL
   psql -U postgres

   # In psql:
   CREATE DATABASE learnup_db;
   CREATE USER learnup_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE learnup_db TO learnup_user;
   \q
   ```

2. **Configure Connection**:
   Create `.env` file in `apps/backend/`:

   ```bash
   cd apps/backend
   cp .env.example .env
   ```

   Update `DATABASE_URL` in `.env`:

   ```env
   DATABASE_URL="postgresql://learnup_user:your_secure_password@localhost:5432/learnup_db?schema=public"
   ```

#### Method B: Docker PostgreSQL

```bash
# Start only PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait for containers to be ready (5-10 seconds)
```

The database URL is already configured in `apps/backend/.env.example` for Docker.

### Step 4: Configure Environment Variables

```bash
cd apps/backend

# Copy example environment file
cp .env.example .env

# Edit .env and update the following CRITICAL variables:
```

**Required Environment Variables**:

```env
# Database (update if using local PostgreSQL)
DATABASE_URL="postgresql://learnup_user:password@localhost:5432/learnup_db?schema=public"

# JWT Secrets (MUST CHANGE IN PRODUCTION)
JWT_SECRET="your-super-secure-jwt-secret-key-minimum-32-characters-long"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-key-minimum-32-characters"

# Application
NODE_ENV=development
PORT=5000

# CORS (add your frontend URLs)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006
```

### Step 5: Initialize Database

```bash
# From apps/backend directory
cd apps/backend

# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed database with test data (optional but recommended)
pnpm run db:seed
```

**After seeding**, you'll have test accounts for all roles (details in [Default Users](#default-users) section).

---

## ⚙️ Configuration

### Backend Configuration

**File**: `apps/backend/.env`

```env
# ==============================================
# DATABASE
# ==============================================
DATABASE_URL="postgresql://learnup_user:password@localhost:5432/learnup_db?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=learnup_user
DB_PASSWORD=your_password
DB_NAME=learnup_db

# ==============================================
# APPLICATION
# ==============================================
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
WEB_URL=http://localhost:3000

# ==============================================
# JWT AUTHENTICATION (REQUIRED)
# ==============================================
JWT_SECRET="generate-a-secure-random-string-min-32-chars"
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET="generate-another-secure-random-string-min-32-chars"
JWT_REFRESH_EXPIRES_IN=7d

# ==============================================
# REDIS (Optional in development)
# ==============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ==============================================
# CORS (Add your frontend URLs)
# ==============================================
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006,capacitor://localhost

# ==============================================
# SECURITY
# ==============================================
BCRYPT_SALT_ROUNDS=12
SESSION_SECRET=your-session-secret-key

# ==============================================
# FILE UPLOADS
# ==============================================
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# ==============================================
# EMAIL (Notification System)
# ==============================================
# Set EMAIL_ENABLED=true to enable email notifications
EMAIL_ENABLED=false
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_SECURE=false
EMAIL_FROM=noreply@learnup.com
EMAIL_FROM_NAME=LearnUp Platform

# See docs/EMAIL_SETUP.md for detailed configuration guide
```

### Frontend Configuration

**File**: `apps/frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=LearnApp
```

### Mobile Configuration

**File**: `apps/mobile/application/app.config.ts`

Update the `apiUrl` in the `extra` section:

```typescript
export default {
  expo: {
    // ... other config
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api/v1",
    },
  },
};
```

### Desktop Configuration

**File**: `apps/mobile-desktop/src/lib/api-client.ts`

Update the `BASE_URL`:

```typescript
const BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1";
```

---

## 🏃 Running Applications

### Backend API

```bash
cd apps/backend

# Development mode (with hot reload)
pnpm run start:dev

# Debug mode
pnpm run start:debug

# Production mode
pnpm run build
pnpm run start:prod
```

**Backend will be available at**: http://localhost:5000  
**API Documentation**: http://localhost:5000/api/docs

### Frontend (Next.js)

```bash
cd apps/frontend

# Development mode
pnpm run dev

# Production build
pnpm run build
pnpm run start
```

**Frontend will be available at**: http://localhost:3000

---

## 🔔 Notification System

The platform includes a comprehensive real-time notification system with multiple delivery channels.

### Features

- ✅ **Real-Time WebSocket Notifications**: Instant delivery to online users
- ✅ **Email Notifications**: Beautiful HTML emails with responsive design
- ✅ **Database Persistence**: All notifications stored and retrievable
- ✅ **Multiple Notification Types**: Exams, classes, system updates, announcements
- ✅ **Unread Tracking**: Badge counts and status management
- ✅ **Mark as Read**: Individual or bulk operations
- 🔄 **Push Notifications**: Coming soon (FCM/APNS)
- 🔄 **Daily Digest Emails**: Coming soon

### Quick Setup

#### 1. Enable Email Notifications (Optional)

```bash
# Edit apps/backend/.env
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=LearnUp Platform
```

For detailed email setup instructions, see [docs/EMAIL_SETUP.md](./docs/EMAIL_SETUP.md)

#### 2. Test Notifications

1. Start the backend: `cd apps/backend && pnpm start:dev`
2. Start the frontend: `cd apps/frontend && pnpm dev`
3. Login and trigger a notification event (e.g., approve a teacher)
4. Check:
   - Real-time notification appears in bell icon
   - Toast popup shows new notification
   - Email sent (if enabled)

### Architecture

```
Event → NotificationsService → [Database + WebSocket + Email]
                                       ↓           ↓         ↓
                                   Prisma    Gateway  EmailService
                                       ↓           ↓         ↓
                                   Storage   Online Users  SMTP
```

### Documentation

- [Email Configuration Guide](./docs/EMAIL_SETUP.md) - Complete SMTP setup
- [Implementation Summary](./docs/NOTIFICATION_SYSTEM_SUMMARY.md) - Technical details
- [Next Steps](./docs/NEXT_STEPS.md) - Roadmap and future enhancements

### Supported Notification Events

- **User Management**: Account approval/rejection
- **Exams**: Approval, rejection, scheduling, grade publication
- **Classes**: Schedule creation, updates, cancellations
- **Enrollments**: New student enrollments
- **System**: Maintenance, updates, announcements

---

## 🧪 Testing

### Backend Tests

```bash
cd apps/backend

# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov

# Run E2E tests
pnpm test:e2e
```

**Test Coverage**: 51 test cases covering authentication, notifications, and exam management.

### Frontend Tests

```bash
cd apps/frontend

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test -- --coverage
```

---

### Mobile (Expo)

```bash
cd apps/mobile/application

# Start Expo dev server
pnpm start

# Run on Android
pnpm run android

# Run on iOS (macOS only)
pnpm run ios

# Run in web browser
pnpm run web
```

### Desktop (Electron)

```bash
cd apps/mobile-desktop

# Development mode
pnpm run dev

# Build for production
pnpm run build:win      # Windows
pnpm run build:mac      # macOS
pnpm run build:linux    # Linux
```

---

## 🐳 Docker Deployment

### Quick Start with Docker

The easiest way to get the LearnApp Platform running is with Docker:

```bash
# Clone the repository
git clone https://github.com/FAITE-TECH/learnup-platform.git
cd learnup-platform

# Start all services (first time setup)
docker-compose up -d

# Wait for services to initialize (30-60 seconds)
# Check logs
docker-compose logs -f backend

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# API Docs: http://localhost:5000/api/docs
```

### Services Started

| Service      | Port | URL                   | Description             |
| ------------ | ---- | --------------------- | ----------------------- |
| **frontend** | 3000 | http://localhost:3000 | Next.js Web Application |
| **backend**  | 5000 | http://localhost:5000 | NestJS API Server       |
| **postgres** | 5432 | localhost:5432        | PostgreSQL Database     |
| **redis**    | 6379 | localhost:6379        | Redis Cache             |

### Database Initialization

The database is **automatically initialized** on first run:

- ✅ Migrations applied automatically
- ✅ Seed data loaded (test users and sample data)
- ✅ Ready to use immediately

### Docker Commands Reference

```bash
# Start all services
docker-compose up -d

# Start with rebuild (after code changes)
docker-compose up -d --build

# View logs (all services)
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Stop services (preserves data)
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v

# Restart a service
docker-compose restart backend
docker-compose restart frontend

# Access backend shell
docker-compose exec backend sh

# Access database CLI
docker-compose exec postgres psql -U postgres -d learnup_test_db

# Run database migrations manually
docker-compose exec backend npm run prisma:migrate:deploy

# Reseed database
docker-compose exec backend npm run db:seed

# Check service status
docker-compose ps

# View resource usage
docker stats
```

### Production Deployment

For production deployment with monitoring and security:

```bash
# Use production Docker Compose configuration
docker-compose -f docker-compose.production.yml up -d

# Or use the deployment script
chmod +x deploy.sh
./deploy.sh production deploy
```

**Production Services Include:**

- ✅ Nginx reverse proxy with SSL
- ✅ Prometheus monitoring
- ✅ Grafana dashboards
- ✅ Automated health checks
- ✅ Log aggregation
- ✅ Resource limits and optimization

### Environment Variables for Docker

Create `.env` file in the root directory:

```env
# Database
DB_NAME=learnup_test_db
DB_USERNAME=postgres
DB_PASSWORD=

# Redis
REDIS_PASSWORD=learnup123

# Application
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-minimum-32-characters

# URLs
API_URL=http://localhost:5000
WEB_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006

# Production only (optional)
AWS_REGION=us-east-1
AWS_S3_BUCKET=learnup-storage
GRAFANA_ADMIN_PASSWORD=admin
```

### Troubleshooting Docker

**Problem: Services not starting**

```bash
# Check logs for errors
docker-compose logs

# Restart everything
docker-compose down
docker-compose up -d
```

**Problem: Database connection issues**

```bash
# Wait for postgres to be ready
docker-compose exec postgres pg_isready

# Check database exists
docker-compose exec postgres psql -U postgres -l
```

**Problem: Port already in use**

```bash
# Find process using port
# Windows PowerShell:
netstat -ano | findstr :5000
# macOS/Linux:
lsof -i :5000

# Kill the process or change port in docker-compose.yml
```

**Problem: Out of disk space**

```bash
# Remove unused Docker resources
docker system prune -a

# Remove volumes (⚠️ deletes data)
docker volume prune
```

---

## 🎥 Video Conferencing (Jitsi)

The LearnUp Platform uses self-hosted Jitsi Meet for video conferencing capabilities.

### Quick Start

**Windows (PowerShell):**

```powershell
.\scripts\start-jitsi.ps1 start
```

**Linux/macOS:**

```bash
./scripts/start-jitsi.sh start
```

### Access Jitsi

- **Local URL:** http://localhost:8443
- **Create Meeting:** http://localhost:8443/YourRoomName

### Configuration

The Jitsi configuration is in `infrastructure/jitsi/.env.jitsi`. Key settings:

```env
JITSI_HTTP_PORT=8443
PUBLIC_URL=http://localhost:8443
DOCKER_HOST_ADDRESS=192.168.1.x  # Your machine's IP
ENABLE_LOBBY=true
ENABLE_BREAKOUT_ROOMS=true
```

### Documentation

See **[Self-Hosted Jitsi Setup Guide](docs/JITSI_SELF_HOSTED_SETUP.md)** for detailed configuration and troubleshooting.



## 📚 Documentation

### Architecture & Migration Guides

- **[Architecture Review](docs/ARCHITECTURE_REVIEW.md)**: Comprehensive analysis of the codebase with identified issues and phased remediation plan
- **[Phase 1 Normalization Complete](docs/PHASE1_NORMALIZATION_COMPLETE.md)**: Schema normalization completion report with migration details
- **[Service Migration Guide](docs/SERVICE_MIGRATION_GUIDE.md)**: Developer guide for migrating services to use foreign key relationships
- **[Development Assistant Guide](docs/DEVELOPMENT_ASSISTANT_GUIDE.md)**: Guide for AI development assistants working on this project

### Migration Status

**Phase 0: Foundation (✅ Complete)**

- API versioning with URI strategy (`/api/v1`)
- Request correlation IDs for distributed tracing
- Standard error/success response envelopes
- Soft-delete middleware and repository pattern
- Common DTOs (pagination, validation, filters)

**Phase 1: Schema Normalization (✅ Complete)**

- Foreign key relationships for Subject, Grade, Medium
- 11 FK constraints added with referential integrity
- 15 indexes created for query optimization
- Backward-compatible dual-column approach
- GradeAssignment model deprecated
- 100% backfill success (zero data loss)

**Phase 2: Workflow State Machines (🔄 Next)**

- Enrollment workflow (DRAFT → PENDING → CONFIRMED → ACTIVE)
- Payment workflow with state validation
- Exam lifecycle management
- WorkflowTransition audit log

**Phase 3: Cross-Service Schema Alignment (⏳ Planned)**

- Python facial recognition service alignment
- Event-driven sync between services
- Shared user identity across services

**Phase 4: Query Optimization (⏳ Planned)**

- Materialized views for dashboards
- Redis caching layer
- N+1 query elimination
- Query monitoring and alerting

---

## 🛠️ Development Guidelines

### Working with Foreign Keys

All new code should use FK relationships instead of string-based references:

```typescript
// ✅ Use FK IDs
const newClass = await prisma.class.create({
  data: {
    subjectId: "cm3abc123...", // FK to subjects
    gradeId: "cm3xyz789...", // FK to grades
  },
  include: {
    subjectRef: true, // Get full subject object
    gradeRef: true, // Get full grade object
  },
});

// ❌ Don't use string names (deprecated)
const oldClass = await prisma.class.create({
  data: {
    subject: "Mathematics", // DEPRECATED
    grade: "10", // DEPRECATED
  },
});
```

See [Service Migration Guide](docs/SERVICE_MIGRATION_GUIDE.md) for complete examples.

### Soft Deletes

Use soft-delete methods from `BaseRepository` or `__withDeleted` flag:

```typescript
// Soft delete (sets deletedAt timestamp)
await baseRepository.softDelete(id, userId);

// Query including deleted records
const allUsers = await prisma.user.findMany({
  __withDeleted: true, // Escape hatch for admin queries
});

// Restore soft-deleted record
await baseRepository.restore(id);
```

### API Versioning

All endpoints are versioned under `/api/v1`:

```typescript
// Automatically prefixed with /api/v1
@Controller("classes")
export class ClassesController {
  @Get()
  findAll() {
    // Accessible at: GET /api/v1/classes
  }
}
```

---

## 🤝 Contributing

1. Read the [Architecture Review](docs/ARCHITECTURE_REVIEW.md) to understand the system
2. Follow the [Service Migration Guide](docs/SERVICE_MIGRATION_GUIDE.md) for FK usage
3. Run tests before committing: `pnpm test`
4. Follow TypeScript and Prisma best practices
5. Update documentation for significant changes

---

## 📄 License
