## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Microservices Evaluation](#2-microservices-evaluation)
3. [Recommended Architecture Strategy](#3-recommended-architecture-strategy)
4. [Hostinger VPS Deployment Guide](#4-hostinger-vps-deployment-guide)
5. [Infrastructure Requirements](#5-infrastructure-requirements)
6. [Implementation Roadmap](#6-implementation-roadmap)
7. [Cost Analysis](#7-cost-analysis)
8. [Risk Assessment](#8-risk-assessment)
9. [Monitoring & Operations](#9-monitoring--operations)
10. [Appendix: Technical Specifications](#10-appendix-technical-specifications)

---

## 1. Current Architecture Analysis

### 1.1 Technology Stack

| Component              | Technology                     | Version |
| ---------------------- | ------------------------------ | ------- |
| **Backend API**        | NestJS (TypeScript)            | 10.x    |
| **Frontend**           | Next.js (TypeScript)           | 14.x    |
| **Mobile**             | React Native (Expo)            | -       |
| **Desktop**            | Electron                       | -       |
| **Database**           | PostgreSQL                     | 15+     |
| **Cache**              | Redis                          | 7+      |
| **Facial Recognition** | Python (FastAPI + InsightFace) | 3.11+   |
| **Video Conferencing** | Jitsi Meet (Self-hosted)       | -       |
| **Package Manager**    | pnpm (Monorepo)                | 10.19.0 |

### 1.2 Current Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CURRENT ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐      │
│   │   Next.js Web   │     │  React Native   │     │    Electron     │      │
│   │   (Frontend)    │     │    (Mobile)     │     │   (Desktop)     │      │
│   └────────┬────────┘     └────────┬────────┘     └────────┬────────┘      │
│            │                       │                       │               │
│            └───────────────────────┼───────────────────────┘               │
│                                    │                                        │
│                          ┌─────────▼─────────┐                             │
│                          │    NestJS API     │                             │
│                          │   (Monolithic)    │                             │
│                          │                   │                             │
│                          │  ┌─────────────┐  │                             │
│                          │  │ 45+ Modules │  │                             │
│                          │  └─────────────┘  │                             │
│                          └────────┬──────────┘                             │
│                                   │                                         │
│            ┌──────────────────────┼──────────────────────┐                 │
│            │                      │                      │                 │
│   ┌────────▼────────┐   ┌────────▼────────┐   ┌────────▼────────┐        │
│   │   PostgreSQL    │   │     Redis       │   │ Python Face-AI  │        │
│   │   (60+ tables)  │   │   (Cache/Queue) │   │   (FastAPI)     │        │
│   └─────────────────┘   └─────────────────┘   └─────────────────┘        │
│                                                                             │
│   ┌─────────────────┐                                                      │
│   │  Jitsi Meet     │  (Video Conferencing - Separate Infrastructure)      │
│   └─────────────────┘                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Module Breakdown (45+ Modules)

The backend is already well-organized into feature modules:

| Domain             | Modules                                                                    | Complexity |
| ------------------ | -------------------------------------------------------------------------- | ---------- |
| **Authentication** | auth, users, security-audit                                                | High       |
| **Academic**       | subjects, grades, mediums, academic-years, batch                           | Medium     |
| **Classes**        | classes, class-rescheduling, timetable, enrollments                        | High       |
| **Examinations**   | exams, exam-exception, marking, proctoring, question-bank, result-analysis | Very High  |
| **Attendance**     | attendance, face-recognition                                               | High       |
| **Communication**  | notifications, announcements, chat                                         | Medium     |
| **Payments**       | payments, wallet, payment-reconciliation, invoice                          | High       |
| **Content**        | publications, course-materials                                             | Medium     |
| **HR/Admin**       | admin, teacher-assignments, teacher-availability, transfer                 | Medium     |
| **System**         | system, system-settings, analytics, audit-logs, error-logs, metrics        | Medium     |
| **Video**          | video                                                                      | High       |

### 1.4 Database Schema Analysis

**Key Statistics:**

- **Total Models**: 60+ entities
- **Schema Lines**: 2,937+ lines
- **Relationships**: Complex with 100+ foreign keys
- **Indexes**: 150+ performance indexes

**Domain Groupings:**

```
USER DOMAIN (10+ tables)
├── users, student_profiles, teacher_profiles
├── auth_sessions, refresh_tokens, device_sessions
├── login_attempts, account_lockouts, password_resets
└── email_verifications, security_audit_logs

ACADEMIC DOMAIN (15+ tables)
├── subjects, grades, mediums, academic_years, batches
├── classes, class_sessions, enrollments
├── timetable, timetable_changes
├── teacher_subject_assignments, grade_assignments
└── student_subjects, student_promotions

EXAMINATION DOMAIN (15+ tables)
├── exams, exam_questions, exam_attempts, exam_answers
├── exam_rankings, exam_exceptions, proctoring_logs
├── questions, question_categories, question_tags
├── exam_question_mappings, exam_templates
└── face_recognition

CONTENT DOMAIN (10+ tables)
├── publications, publication_purchases, publication_reviews
├── course_materials, recordings
├── seminars, seminar_registrations
└── announcements, announcement_reads

FINANCIAL DOMAIN (8+ tables)
├── payments, payment_reconciliations
├── wallets, wallet_transactions
├── invoices, temporary_access
└── enrollments (payment tracking)

COMMUNICATION DOMAIN (5+ tables)
├── notifications, device_tokens
├── chat_messages, feedbacks
└── transfer_messages

LOCATION/ORGANIZATION (5+ tables)
├── provinces, districts, zones
├── institutions
└── transfer_requests, transfer_acceptances
```

---

## 2. Microservices Evaluation

### 2.1 Should You Convert to Microservices?

**SHORT ANSWER: NOT YET**

**Detailed Analysis:**

| Factor                   | Assessment                        | Impact on Decision                        |
| ------------------------ | --------------------------------- | ----------------------------------------- |
| **Team Size**            | Small to medium                   | ⚠️ Microservices require dedicated DevOps |
| **Traffic Scale**        | < 10,000 concurrent users         | ⚠️ Monolith handles this easily           |
| **Release Frequency**    | Features still in development     | ⚠️ Monolith is faster to iterate          |
| **Data Coupling**        | Highly coupled (FK relationships) | 🛑 Database split is complex              |
| **Operational Maturity** | Early stage                       | 🛑 Need CI/CD, monitoring first           |
| **Budget**               | VPS-level budget                  | 🛑 Microservices = higher infra cost      |

### 2.2 When Microservices Make Sense

**Microservices are beneficial when:**

- ✅ Different parts need different scaling (e.g., video processing vs API)
- ✅ Different teams own different services
- ✅ Different technology requirements per service
- ✅ Fault isolation is critical
- ✅ High traffic with specific bottlenecks

**Your current situation:**

- ❌ Single team developing all features
- ❌ Database is tightly coupled
- ❌ Features still being built
- ❌ No traffic yet to identify bottlenecks
- ❌ Limited DevOps expertise

### 2.3 Microservices Risks for LearnUp

| Risk                            | Impact                                        | Likelihood |
| ------------------------------- | --------------------------------------------- | ---------- |
| **Distributed data management** | High - Cross-service transactions are complex | Very High  |
| **Operational complexity**      | High - Need K8s, service mesh, etc.           | High       |
| **Network latency**             | Medium - Inter-service calls add latency      | High       |
| **Debugging difficulty**        | High - Distributed tracing required           | High       |
| **Development slowdown**        | High - API contracts, versioning              | Very High  |
| **Infrastructure cost**         | High - Multiple services = multiple resources | High       |

### 2.4 What You Already Have (Good News!)

Your codebase is **already well-structured** for future microservices:

✅ **NestJS Modules**: Each feature is a self-contained module
✅ **Clean Separation**: Controllers → Services → Repositories
✅ **Shared Package**: `@learnup/shared` for common types
✅ **Separate Python Service**: Face recognition is already decoupled
✅ **WebSocket Support**: Real-time features are isolated
✅ **Docker Ready**: Docker Compose for all services

---

## 3. Recommended Architecture Strategy

### 3.1 Phase 1: Enhanced Modular Monolith (NOW - 6 months)

**Goal**: Strengthen boundaries, improve deployability

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PHASE 1: MODULAR MONOLITH                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────┐    │
│   │                         NGINX REVERSE PROXY                       │    │
│   │                    (SSL Termination, Load Balancing)              │    │
│   └───────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│        ┌───────────────────────────┼───────────────────────┐               │
│        │                          │                        │               │
│        ▼                          ▼                        ▼               │
│   ┌──────────┐            ┌──────────────┐          ┌─────────────┐       │
│   │ Next.js  │            │  NestJS API  │          │  Python AI  │       │
│   │ Frontend │            │  (Unified)   │          │   Service   │       │
│   │  :3000   │            │    :5000     │          │   :8000     │       │
│   └──────────┘            └──────┬───────┘          └─────────────┘       │
│                                  │                                         │
│                    ┌─────────────┼─────────────┐                          │
│                    │             │             │                          │
│                    ▼             ▼             ▼                          │
│              ┌──────────┐ ┌──────────┐ ┌──────────────┐                   │
│              │PostgreSQL│ │  Redis   │ │ S3/MinIO     │                   │
│              │  :5432   │ │  :6379   │ │ (Storage)    │                   │
│              └──────────┘ └──────────┘ └──────────────┘                   │
│                                                                             │
│   External:                                                                 │
│   ┌──────────────────┐                                                     │
│   │   Jitsi Meet     │  (Separate VPS recommended)                         │
│   │   (Video)        │                                                     │
│   └──────────────────┘                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Phase 1 Actions:**

1. **Deploy as-is** with proper DevOps
2. **Add health checks** and monitoring
3. **Implement CI/CD** pipeline
4. **Set up proper logging** (centralized)
5. **Configure horizontal scaling** (multiple NestJS instances)
6. **Optimize database** with read replicas

### 3.2 Phase 2: Selective Service Extraction (6-18 months)

**When to start Phase 2:**

- ✅ Stable production with real traffic data
- ✅ Clear bottleneck identification
- ✅ DevOps maturity (CI/CD, monitoring, logging)
- ✅ Team capacity for distributed systems

**Services to Extract FIRST:**

| Service                       | Reason                                   | Complexity      |
| ----------------------------- | ---------------------------------------- | --------------- |
| **Notification Service**      | High volume, async, isolated             | Low             |
| **Face Recognition**          | Already separate, different tech         | Already Done ✅ |
| **Analytics/Metrics**         | Read-heavy, can be eventually consistent | Medium          |
| **File Storage Service**      | I/O bound, scalable independently        | Medium          |
| **Video Recording Processor** | CPU intensive, async                     | Medium          |

**Services to Keep TOGETHER:**

| Service Group                         | Reason                          |
| ------------------------------------- | ------------------------------- |
| **Auth + Users**                      | Core identity, tightly coupled  |
| **Classes + Enrollments + Timetable** | Transaction-heavy, same data    |
| **Exams + Questions + Attempts**      | Complex transactions, real-time |
| **Payments + Wallet + Invoice**       | Financial integrity required    |

### 3.3 Phase 2 Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PHASE 2: SELECTIVE MICROSERVICES                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────┐    │
│   │                    API GATEWAY (Kong/Traefik)                      │    │
│   │               (Rate Limiting, Auth, Routing)                       │    │
│   └───────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│     ┌──────────┬──────────┬───────┴────────┬──────────┬──────────┐        │
│     ▼          ▼          ▼                ▼          ▼          ▼        │
│ ┌────────┐ ┌────────┐ ┌────────────┐ ┌──────────┐ ┌────────┐ ┌────────┐  │
│ │Frontend│ │Core API│ │Notification│ │Analytics │ │Face AI │ │Media   │  │
│ │Next.js │ │NestJS  │ │Service     │ │Service   │ │Python  │ │Service │  │
│ └────────┘ └───┬────┘ └──────┬─────┘ └────┬─────┘ └────────┘ └───┬────┘  │
│                │             │            │                      │        │
│                ▼             ▼            ▼                      ▼        │
│          ┌──────────┐  ┌──────────┐ ┌──────────┐         ┌──────────┐   │
│          │PostgreSQL│  │  Redis   │ │ClickHouse│         │  MinIO   │   │
│          │ (Primary)│  │ (Queue)  │ │(Analytics)│        │(Storage) │   │
│          └──────────┘  └──────────┘ └──────────┘         └──────────┘   │
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────┐    │
│   │                    MESSAGE QUEUE (Redis/RabbitMQ)                  │    │
│   │              (Event-driven communication between services)         │    │
│   └───────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Hostinger VPS Deployment Guide

### 4.1 VPS Requirements Assessment

**Minimum VPS Requirements for LearnUp:**

| Component                               | CPU    | RAM  | Storage     | Monthly Cost (Hostinger) |
| --------------------------------------- | ------ | ---- | ----------- | ------------------------ |
| **Production Server**                   | 4 vCPU | 8 GB | 200 GB NVMe | ~$15-25                  |
| **Database Server** (optional separate) | 2 vCPU | 4 GB | 100 GB NVMe | ~$10-15                  |
| **Jitsi Server** (recommended separate) | 4 vCPU | 8 GB | 50 GB NVMe  | ~$15-25                  |

**Recommended Configuration:**

| Scenario            | Configuration              | Estimated Users     |
| ------------------- | -------------------------- | ------------------- |
| **Small** (MVP)     | Single VPS (4 vCPU, 8GB)   | 100-300 concurrent  |
| **Medium** (Growth) | 2 VPS (App + DB separated) | 300-1000 concurrent |
| **Large** (Scale)   | 3+ VPS (App, DB, Video)    | 1000+ concurrent    |

### 4.2 Single VPS Deployment (Recommended for Start)

**Architecture on Single Hostinger VPS:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOSTINGER VPS (8GB RAM)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────────────────────────────────────────────┐      │
│   │                      NGINX                            │      │
│   │          (Reverse Proxy + SSL + Caching)             │      │
│   │                     Port 80/443                       │      │
│   └──────────────────────────────────────────────────────┘      │
│                              │                                   │
│     ┌────────────────────────┼────────────────────────┐         │
│     │                        │                        │         │
│     ▼                        ▼                        ▼         │
│ ┌──────────┐          ┌──────────────┐         ┌──────────┐    │
│ │ Next.js  │          │  NestJS API  │         │ Python   │    │
│ │ (Docker) │          │  (Docker)    │         │ Face-AI  │    │
│ │ Port 3000│          │  Port 5000   │         │ Port 8000│    │
│ │ RAM: 1GB │          │  RAM: 2GB    │         │ RAM: 1GB │    │
│ └──────────┘          └──────────────┘         └──────────┘    │
│                              │                                   │
│           ┌──────────────────┼──────────────────┐               │
│           │                  │                  │               │
│           ▼                  ▼                  ▼               │
│     ┌──────────┐      ┌──────────┐       ┌──────────┐          │
│     │PostgreSQL│      │  Redis   │       │ Uploads  │          │
│     │ (Docker) │      │ (Docker) │       │ (Volume) │          │
│     │ Port 5432│      │ Port 6379│       │          │          │
│     │ RAM: 2GB │      │ RAM: 512M│       │          │          │
│     └──────────┘      └──────────┘       └──────────┘          │
│                                                                  │
│   Reserved: ~1.5GB for OS + Buffer                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Step-by-Step Deployment

#### Step 1: Initial VPS Setup

```bash
# Connect to your VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y curl git nginx certbot python3-certbot-nginx

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create non-root user for deployment
adduser learnup
usermod -aG docker learnup
usermod -aG sudo learnup
```

#### Step 2: Configure Firewall

```bash
# Configure UFW firewall
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

#### Step 3: Clone and Configure Application

```bash
# Switch to deployment user
su - learnup

# Clone repository
git clone https://github.com/FAITE-TECH/learnup-platform.git
cd learnup-platform

# Create production environment file
cat > .env.production << 'EOF'
# Database
DB_NAME=learnup_prod
DB_USERNAME=learnup_admin
DB_PASSWORD=YOUR_SECURE_DB_PASSWORD_HERE
DB_PORT=5432

# Redis
REDIS_PASSWORD=YOUR_SECURE_REDIS_PASSWORD_HERE
REDIS_PORT=6379

# Application
NODE_ENV=production
PORT=5000

# JWT Secrets (generate secure random strings)
JWT_SECRET=YOUR_64_CHARACTER_RANDOM_STRING_HERE
JWT_REFRESH_SECRET=ANOTHER_64_CHARACTER_RANDOM_STRING_HERE
SESSION_SECRET=THIRD_64_CHARACTER_RANDOM_STRING_HERE

# Domain Configuration
API_URL=https://api.yourdomain.com
WEB_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Face Recognition
FRS_MYSQL_ROOT_PASSWORD=YOUR_FRS_ROOT_PASSWORD
FRS_MYSQL_PASSWORD=YOUR_FRS_USER_PASSWORD

# Email Configuration (optional)
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EOF
```

#### Step 4: Create Production Docker Compose

Create `docker-compose.production.yml`:

```yaml
version: "3.8"

services:
  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: learnup-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.production.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./uploads:/var/www/uploads:ro
    depends_on:
      - frontend
      - backend
    networks:
      - learnup-network

  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: learnup-postgres
    restart: always
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - learnup-network
    deploy:
      resources:
        limits:
          memory: 2G

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: learnup-redis
    restart: always
    command:
      [
        "redis-server",
        "--appendonly",
        "yes",
        "--requirepass",
        "${REDIS_PASSWORD}",
      ]
    volumes:
      - redis_data:/data
    networks:
      - learnup-network
    deploy:
      resources:
        limits:
          memory: 512M

  # Backend API
  backend:
    build:
      context: .
      dockerfile: ./apps/backend/Dockerfile
      target: production
    container_name: learnup-backend
    restart: always
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: "postgresql://${DB_USERNAME}:${DB_PASSWORD}@postgres:5432/${DB_NAME}?schema=public"
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      SESSION_SECRET: ${SESSION_SECRET}
      ALLOWED_ORIGINS: ${ALLOWED_ORIGINS}
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      - postgres
      - redis
    networks:
      - learnup-network
    deploy:
      resources:
        limits:
          memory: 2G

  # Frontend
  frontend:
    build:
      context: .
      dockerfile: ./apps/frontend/Dockerfile
      target: production
    container_name: learnup-frontend
    restart: always
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: ${API_URL}/api/v1
    networks:
      - learnup-network
    deploy:
      resources:
        limits:
          memory: 1G

  # Face Recognition Service
  facial-recognition:
    build:
      context: ./apps/facial_recognition_system
      dockerfile: Dockerfile
    container_name: learnup-frs
    restart: always
    environment:
      DB_HOST: frs-db
      DB_PORT: 3306
      DB_USER: frs_user
      DB_PASSWORD: ${FRS_MYSQL_PASSWORD}
      DB_NAME: class_attendance
    depends_on:
      - frs-db
    networks:
      - learnup-network
    deploy:
      resources:
        limits:
          memory: 1G

  # Face Recognition Database
  frs-db:
    image: mysql:8.0
    container_name: learnup-frs-db
    restart: always
    environment:
      MYSQL_DATABASE: class_attendance
      MYSQL_ROOT_PASSWORD: ${FRS_MYSQL_ROOT_PASSWORD}
      MYSQL_USER: frs_user
      MYSQL_PASSWORD: ${FRS_MYSQL_PASSWORD}
    volumes:
      - frs_db_data:/var/lib/mysql
    networks:
      - learnup-network
    deploy:
      resources:
        limits:
          memory: 512M

volumes:
  postgres_data:
  redis_data:
  frs_db_data:

networks:
  learnup-network:
    driver: bridge
```

#### Step 5: Create Nginx Production Config

Create `nginx/nginx.production.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;

    # Upstream definitions
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:5000;
    }

    upstream facial_recognition {
        server facial-recognition:8000;
    }

    # HTTP → HTTPS redirect
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com api.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # Main website
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        location / {
            limit_req zone=general burst=20 nodelay;
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Static files
        location /uploads {
            alias /var/www/uploads;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }

    # API server
    server {
        listen 443 ssl http2;
        server_name api.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;

        client_max_body_size 50M;

        # Security headers
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # CORS headers
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Credentials true always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With" always;

        # API routes
        location /api/ {
            limit_req zone=api burst=50 nodelay;
            proxy_pass http://backend/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket for real-time features
        location /socket.io/ {
            proxy_pass http://backend/socket.io/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_read_timeout 86400;
        }

        # Face recognition API
        location /face/ {
            limit_req zone=api burst=10 nodelay;
            proxy_pass http://facial_recognition/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_read_timeout 60;
        }

        # Health check
        location /health {
            proxy_pass http://backend/health;
        }
    }
}
```

#### Step 6: SSL Setup with Certbot

```bash
# Install SSL certificates
certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Set up auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

#### Step 7: Deploy Application

```bash
# Build and start containers
docker-compose -f docker-compose.production.yml up -d --build

# Run database migrations
docker-compose -f docker-compose.production.yml exec backend npx prisma migrate deploy

# Seed initial data (first time only)
docker-compose -f docker-compose.production.yml exec backend npx prisma db seed

# Check logs
docker-compose -f docker-compose.production.yml logs -f
```

#### Step 8: Setup Automated Backups

Create `/home/learnup/scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/learnup/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
docker exec learnup-postgres pg_dump -U learnup_admin learnup_prod | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Face recognition DB backup
docker exec learnup-frs-db mysqldump -u root -p$FRS_MYSQL_ROOT_PASSWORD class_attendance | gzip > $BACKUP_DIR/frs_db_$DATE.sql.gz

# Uploads backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /home/learnup/learnup-platform/uploads

# Clean old backups
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
```

Add to crontab:

```bash
# Daily backup at 2 AM
0 2 * * * /home/learnup/scripts/backup.sh >> /home/learnup/logs/backup.log 2>&1
```

### 4.4 DNS Configuration

Configure your domain DNS records:

| Type | Name  | Value             | TTL               |
| ---- | ----- | ----------------- | ----------------- |
| A    | @     | your-vps-ip       | 300               |
| A    | www   | your-vps-ip       | 300               |
| A    | api   | your-vps-ip       | 300               |
| A    | jitsi | your-jitsi-vps-ip | 300 (if separate) |

---

## 5. Infrastructure Requirements

### 5.1 Resource Estimation

**For 500 concurrent users:**

| Component        | CPU Usage | Memory      | Disk I/O |
| ---------------- | --------- | ----------- | -------- |
| NestJS Backend   | 30-40%    | 1.5-2 GB    | Low      |
| Next.js Frontend | 10-15%    | 512 MB-1 GB | Low      |
| PostgreSQL       | 20-30%    | 1.5-2 GB    | High     |
| Redis            | 5-10%     | 256-512 MB  | Medium   |
| Face Recognition | 10-20%    | 512 MB-1 GB | Low      |
| Nginx            | 5-10%     | 128-256 MB  | Low      |

**Total: 4 vCPU, 8 GB RAM minimum**

### 5.2 Scaling Strategy

**Vertical Scaling (Simple):**

- Upgrade VPS tier when needed
- Cost-effective for 1,000-2,000 users

**Horizontal Scaling (Complex):**

- Add load balancer
- Multiple app instances
- Database read replicas
- Required for 5,000+ users

### 5.3 Jitsi Meet Deployment

**Option A: Managed Jitsi (Recommended for Start)**

- Use meet.jit.si (free tier)
- 100 concurrent users per meeting
- No infrastructure management

**Option B: Self-Hosted Jitsi (For Scale)**
Separate VPS with 4+ vCPU, 8+ GB RAM:

```bash
# On separate VPS
curl https://download.jitsi.org/jitsi-key.gpg.key | sudo sh -c 'gpg --dearmor > /usr/share/keyrings/jitsi-keyring.gpg'
echo 'deb [signed-by=/usr/share/keyrings/jitsi-keyring.gpg] https://download.jitsi.org stable/' | sudo tee /etc/apt/sources.list.d/jitsi-stable.list > /dev/null
apt update
apt install jitsi-meet

# Configure domain
# During installation, enter your domain: jitsi.yourdomain.com
```

---

## 6. Implementation Roadmap

### 6.1 Week 1-2: Foundation

| Task                            | Priority | Duration |
| ------------------------------- | -------- | -------- |
| Set up Hostinger VPS            | Critical | 1 day    |
| Configure firewall & SSH        | Critical | 0.5 day  |
| Install Docker & Docker Compose | Critical | 0.5 day  |
| Configure domain & DNS          | Critical | 1 day    |
| Set up SSL certificates         | Critical | 0.5 day  |
| Deploy base infrastructure      | Critical | 2 days   |
| Test basic functionality        | Critical | 2 days   |

### 6.2 Week 3-4: Production Hardening

| Task                                   | Priority | Duration |
| -------------------------------------- | -------- | -------- |
| Implement automated backups            | High     | 1 day    |
| Set up monitoring (Prometheus/Grafana) | High     | 2 days   |
| Configure log aggregation              | High     | 1 day    |
| Performance testing                    | High     | 2 days   |
| Security audit                         | High     | 2 days   |
| Documentation                          | Medium   | 2 days   |

### 6.3 Week 5-8: Feature Completion

| Task                        | Priority | Duration |
| --------------------------- | -------- | -------- |
| Integrate Jitsi Meet        | High     | 3 days   |
| Test video conferencing     | High     | 2 days   |
| Mobile app deployment       | High     | 3 days   |
| Payment gateway integration | High     | 3 days   |
| User acceptance testing     | Critical | 1 week   |

### 6.4 Month 3-6: Stabilization

| Task                        | Priority | Duration |
| --------------------------- | -------- | -------- |
| Bug fixes based on feedback | Critical | Ongoing  |
| Performance optimization    | High     | Ongoing  |
| Scale testing               | High     | 1 week   |
| Database optimization       | High     | 1 week   |
| Documentation updates       | Medium   | Ongoing  |

---

## 7. Cost Analysis

### 7.1 Monthly Infrastructure Costs

| Item                        | Hostinger Plan | Cost/Month   |
| --------------------------- | -------------- | ------------ |
| **Main VPS** (4 vCPU, 8GB)  | KVM 2 or 3     | $15-25       |
| **Jitsi VPS** (4 vCPU, 8GB) | KVM 2 or 3     | $15-25       |
| **Domain**                  | .com           | ~$1 (annual) |
| **SSL**                     | Let's Encrypt  | Free         |
| **Email Service**           | Gmail/SendGrid | Free-$20     |
| **Object Storage**          | Hostinger/S3   | $5-15        |
| **CDN** (optional)          | Cloudflare     | Free-$20     |

**Total Estimated: $35-85/month**

### 7.2 Comparison: Microservices vs Monolith

| Aspect                  | Monolith  | Microservices    |
| ----------------------- | --------- | ---------------- |
| **Initial Infra Cost**  | $35-50/mo | $100-200/mo      |
| **DevOps Complexity**   | Low       | Very High        |
| **Development Speed**   | Fast      | Slower           |
| **Debugging**           | Easy      | Complex          |
| **Scaling Flexibility** | Limited   | High             |
| **Team Requirements**   | 2-3 devs  | 5+ devs + DevOps |

**Verdict: Monolith saves ~$50-150/month and significant engineering time**

---

## 8. Risk Assessment

### 8.1 Technical Risks

| Risk                | Probability | Impact   | Mitigation                              |
| ------------------- | ----------- | -------- | --------------------------------------- |
| Database corruption | Low         | Critical | Automated backups, replication          |
| Server downtime     | Medium      | High     | Health checks, alerts, restart policies |
| DDoS attack         | Low         | High     | Cloudflare protection, rate limiting    |
| Security breach     | Low         | Critical | Regular updates, security audits        |
| Scaling issues      | Medium      | High     | Performance monitoring, load testing    |

### 8.2 Operational Risks

| Risk                       | Probability | Impact | Mitigation                             |
| -------------------------- | ----------- | ------ | -------------------------------------- |
| SSL expiration             | Low         | Medium | Auto-renewal with Certbot              |
| Disk space exhaustion      | Medium      | High   | Monitoring, log rotation, cleanup jobs |
| Memory leaks               | Medium      | Medium | Container restarts, memory limits      |
| Third-party service outage | Medium      | Medium | Fallbacks, error handling              |

### 8.3 Risk Mitigation Checklist

- [ ] Automated daily backups
- [ ] Backup restore testing (monthly)
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Error tracking (Sentry)
- [ ] Security updates automated
- [ ] Firewall rules reviewed quarterly
- [ ] Penetration testing (annually)
- [ ] Disaster recovery plan documented

---

## 9. Monitoring & Operations

### 9.1 Monitoring Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                     MONITORING ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌────────────────────────────────────────────────────┐        │
│   │                   Grafana Dashboard                │        │
│   │        (Visualization, Alerts, Dashboards)         │        │
│   └────────────────────────────────────────────────────┘        │
│                              │                                   │
│                              ▼                                   │
│   ┌────────────────────────────────────────────────────┐        │
│   │                    Prometheus                      │        │
│   │           (Metrics Collection & Storage)           │        │
│   └────────────────────────────────────────────────────┘        │
│                              │                                   │
│       ┌──────────────────────┼──────────────────────┐           │
│       │                      │                      │           │
│       ▼                      ▼                      ▼           │
│  ┌──────────┐          ┌──────────┐          ┌──────────┐      │
│  │ Node     │          │ PostgreSQL│         │Container │      │
│  │ Exporter │          │ Exporter  │         │ Metrics  │      │
│  └──────────┘          └──────────┘          └──────────┘      │
│                                                                  │
│   External Monitoring:                                          │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐                   │
│   │UptimeRobot│  │ Sentry   │   │Logwatch  │                   │
│   │(Uptime)  │  │ (Errors) │   │ (Logs)   │                   │
│   └──────────┘   └──────────┘   └──────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Key Metrics to Monitor

| Metric                | Warning | Critical | Action                 |
| --------------------- | ------- | -------- | ---------------------- |
| CPU Usage             | > 70%   | > 90%    | Scale up or optimize   |
| Memory Usage          | > 75%   | > 90%    | Scale up or find leaks |
| Disk Usage            | > 70%   | > 85%    | Cleanup or expand      |
| Response Time (p95)   | > 1s    | > 3s     | Optimize queries       |
| Error Rate            | > 1%    | > 5%     | Investigate & fix      |
| Database Connections  | > 70%   | > 90%    | Optimize or increase   |
| WebSocket Connections | > 1000  | > 5000   | Scale horizontally     |

### 9.3 Alert Configuration

```yaml
# monitoring/alert_rules.yml
groups:
  - name: learnup-alerts
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High CPU usage detected

      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High memory usage detected

      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: Service is down

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected
```

### 9.4 Log Management

```bash
# Docker logging configuration in daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}

# View logs
docker-compose logs -f --tail=100 backend
docker-compose logs -f --tail=100 frontend
docker-compose logs -f --tail=100 postgres
```

---

## 10. Appendix: Technical Specifications

### 10.1 Environment Variables Reference

```bash
# ===========================================
# APPLICATION
# ===========================================
NODE_ENV=production                    # Environment mode
PORT=5000                              # Backend port
API_URL=https://api.yourdomain.com     # Public API URL
WEB_URL=https://yourdomain.com         # Public web URL
ALLOWED_ORIGINS=https://yourdomain.com # CORS origins

# ===========================================
# DATABASE
# ===========================================
DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public
DB_HOST=postgres                       # Docker service name
DB_PORT=5432
DB_USERNAME=learnup_admin
DB_PASSWORD=secure_password
DB_NAME=learnup_prod

# ===========================================
# REDIS
# ===========================================
REDIS_HOST=redis                       # Docker service name
REDIS_PORT=6379
REDIS_PASSWORD=secure_password

# ===========================================
# AUTHENTICATION
# ===========================================
JWT_SECRET=64_char_random_string       # Access token signing
JWT_REFRESH_SECRET=64_char_random_str  # Refresh token signing
JWT_EXPIRES_IN=1h                      # Access token expiry
JWT_REFRESH_EXPIRES_IN=7d              # Refresh token expiry
SESSION_SECRET=64_char_random_string   # Session encryption

# ===========================================
# SECURITY
# ===========================================
BCRYPT_SALT_ROUNDS=12                  # Password hashing rounds
RATE_LIMIT_TTL=60                      # Rate limit window (seconds)
RATE_LIMIT_MAX=100                     # Max requests per window

# ===========================================
# FILE STORAGE
# ===========================================
UPLOAD_PATH=./uploads                  # Local upload path
MAX_FILE_SIZE=10485760                 # 10MB max upload
# For S3-compatible storage:
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=learnup-storage

# ===========================================
# EMAIL
# ===========================================
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=app_password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=LearnUp Platform

# ===========================================
# FACE RECOGNITION
# ===========================================
FRS_MYSQL_ROOT_PASSWORD=secure_password
FRS_MYSQL_PASSWORD=secure_password
FACE_THRESHOLD=0.38                    # Face match threshold

# ===========================================
# VIDEO CONFERENCING (Jitsi)
# ===========================================
JITSI_DOMAIN=jitsi.yourdomain.com
JITSI_APP_ID=learnup
JITSI_SECRET=secret_key
```

### 10.2 Production Dockerfile for Backend

```dockerfile
# apps/backend/Dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
RUN npm install -g pnpm@10.19.0
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY . .
WORKDIR /app/apps/backend
RUN npx prisma generate
RUN npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/node_modules ./node_modules
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/apps/backend/package.json ./

USER nestjs
EXPOSE 5000
CMD ["node", "dist/main.js"]
```

### 10.3 Production Dockerfile for Frontend

```dockerfile
# apps/frontend/Dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/
RUN npm install -g pnpm@10.19.0
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY . .
WORKDIR /app/apps/frontend
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

### 10.4 Useful Commands Reference

```bash
# ===========================================
# DEPLOYMENT COMMANDS
# ===========================================

# Start production
docker-compose -f docker-compose.production.yml up -d

# Stop production
docker-compose -f docker-compose.production.yml down

# Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build

# View logs
docker-compose -f docker-compose.production.yml logs -f [service]

# ===========================================
# DATABASE COMMANDS
# ===========================================

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma client
docker-compose exec backend npx prisma generate

# Open Prisma Studio
docker-compose exec backend npx prisma studio

# Database backup
docker exec learnup-postgres pg_dump -U learnup_admin learnup_prod > backup.sql

# Database restore
docker exec -i learnup-postgres psql -U learnup_admin learnup_prod < backup.sql

# ===========================================
# MAINTENANCE COMMANDS
# ===========================================

# Clean up Docker resources
docker system prune -a

# Check disk usage
df -h

# Check memory usage
free -m

# Check running processes
htop

# Check Docker stats
docker stats

# ===========================================
# TROUBLESHOOTING
# ===========================================

# Check container status
docker-compose ps

# Check container logs
docker logs learnup-backend --tail 100

# Enter container shell
docker exec -it learnup-backend sh

# Check network connectivity
docker exec learnup-backend ping postgres

# Check PostgreSQL connections
docker exec learnup-postgres psql -U learnup_admin -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## Summary & Recommendations

### Key Takeaways

1. **Don't rush to microservices** - Your monolith is well-structured and appropriate for your scale
2. **Hostinger VPS is viable** - Start with a single 8GB VPS, scale later
3. **Deploy first, optimize later** - Get to production, then iterate
4. **Invest in monitoring** - Know your system before scaling
5. **Automate operations** - Backups, SSL renewal, health checks

### Immediate Next Steps

1. ✅ Purchase Hostinger VPS (KVM 2 or KVM 3)
2. ✅ Configure domain DNS
3. ✅ Deploy using this guide
4. ✅ Set up monitoring and backups
5. ✅ Perform load testing
6. ✅ Launch MVP to users

### When to Reconsider Microservices

Consider microservices extraction when:

- ✅ You have 5,000+ concurrent users
- ✅ Specific services have different scaling needs
- ✅ You have a dedicated DevOps team
- ✅ Clear bottlenecks identified through monitoring
- ✅ Budget allows 3x infrastructure cost
