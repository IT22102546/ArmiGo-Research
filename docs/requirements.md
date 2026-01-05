### Primary Development Focus

The current development cycle prioritizes:

1. **Web Application (HIGH PRIORITY)**: Comprehensive administrative control panel and teacher management portal for system administrators, site administrators, and internal teachers to manage classes, exams, content, and the Mutual Transfer portal.

2. **Mobile Application (HIGH PRIORITY)**: Student-facing mobile app for internal and external students, plus mobile functionality for internal teachers (limited to starting/monitoring classes and exams) and external teachers (access to Mutual Transfer features).

3. **Secondary Systems (MEDIUM/LOW PRIORITY)**: Desktop application, advanced analytics, and secondary integrations remain on the long-term roadmap.

### Key Stakeholders
- **Administrators**: Super Admin and Admin users managing platform operations
- **Internal Students**: Students enrolled through institution (Grade 01-11) with monthly fees
- **External Students**: Individual students with pay-per-exam or wallet-based access
- **Internal Teachers**: Institution-employed teachers with full teaching capabilities
- **External Teachers**: Teachers using only the Mutual Transfer portal

## Table of Contents

### 1. Introduction
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Scope](#12-scope)
   - 1.3 [Definitions and Acronyms](#13-definitions-and-acronyms)
   - 1.4 [Document Conventions](#14-document-conventions)

### 2. Overall Description
   - 2.1 [Product Perspective](#21-product-perspective)
   - 2.2 [User Characteristics](#22-user-characteristics)
   - 2.3 [Operating Environment](#23-operating-environment)
   - 2.4 [Design and Implementation Constraints](#24-design-and-implementation-constraints)
   - 2.5 [Assumptions and Dependencies](#25-assumptions-and-dependencies)

### 3. System Architecture
   - 3.1 [High-Level Architecture](#31-high-level-architecture)
   - 3.2 [User Roles and Access Control](#32-user-roles-and-access-control)
   - 3.3 [Platform Distribution](#33-platform-distribution)

### 4. Functional Requirements
   - 4.1 [Common Requirements (All Users)](#41-common-requirements-all-users)
   - 4.2 [Internal Student Requirements](#42-internal-student-requirements)
   - 4.3 [External Student Requirements](#43-external-student-requirements)
   - 4.4 [Internal Teacher Requirements](#44-internal-teacher-requirements)
   - 4.5 [External Teacher Requirements](#45-external-teacher-requirements)
   - 4.6 [Administrator Requirements](#46-administrator-requirements)

### 5. Non-Functional Requirements
   - 5.1 [Security Requirements](#51-security-requirements)
   - 5.2 [Performance Requirements](#52-performance-requirements)
   - 5.3 [Usability Requirements](#53-usability-requirements)
   - 5.4 [Reliability and Availability](#54-reliability-and-availability)
   - 5.5 [Scalability and Maintainability](#55-scalability-and-maintainability)
   - 5.6 [Legal and Compliance](#56-legal-and-compliance)

### 6. Data Model
   - 6.1 [Core Entities](#61-core-entities)
   - 6.2 [Entity Relationship Diagram](#62-entity-relationship-diagram)
   - 6.3 [Data Security and Privacy](#63-data-security-and-privacy)

### 7. System Workflows
   - 7.1 [External Student Onboarding](#71-external-student-onboarding)
   - 7.2 [Internal Student Class Attendance](#72-internal-student-class-attendance)
   - 7.3 [Exam Creation and Monitoring](#73-exam-creation-and-monitoring)
   - 7.4 [Mutual Transfer Request Flow](#74-mutual-transfer-request-flow)
   - 7.5 [Payment Processing](#75-payment-processing)

### 8. Integration Requirements
   - 8.1 [Payment Integration (Tracker Plus)](#81-payment-integration-tracker-plus)
   - 8.2 [Video Conferencing](#82-video-conferencing)
   - 8.3 [Notification Services](#83-notification-services)
   - 8.4 [AI and Face Recognition](#84-ai-and-face-recognition)

### 9. Technical Specifications
   - 9.1 [Technology Stack](#91-technology-stack)
   - 9.2 [API Design](#92-api-design)
   - 9.3 [Database Design](#93-database-design)
   - 9.4 [Security Architecture](#94-security-architecture)

### 10. Implementation Plan
   - 10.1 [Development Phases](#101-development-phases)
   - 10.2 [Testing Strategy](#102-testing-strategy)
   - 10.3 [Deployment Strategy](#103-deployment-strategy)

### 11. Appendices
   - 11.1 [UI/UX Design Guidelines](#111-uiux-design-guidelines)
   - 11.2 [Error Handling](#112-error-handling)
   - 11.3 [Edge Cases and Guardrails](#113-edge-cases-and-guardrails)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) document provides a complete description of the Pulamai Viththakan (LearnApp) learning platform. The platform is designed to:

- Manage internal and external students, teachers, and administrators
- Facilitate online and hybrid classes with video conferencing
- Provide comprehensive examination systems with AI monitoring
- Enable secure payment processing and wallet management
- Support mutual teacher-transfer functionality
- Deliver publications and seminar content
- Facilitate moderated communication between stakeholders

This document is intended for:
- Development teams (frontend, backend, mobile, QA)
- Project managers and product owners
- UI/UX designers
- System administrators and DevOps engineers
- Stakeholders and decision-makers

### 1.2 Scope

The LearnApp platform consists of:

#### **In Scope:**
1. **Mobile Application** (Android & iOS)
   - Student interface (internal and external)
   - Teacher interface (limited functionality)
   - Face ID capture and verification
   - Video conferencing participation
   - Exam taking with AI monitoring
   - Publications browsing and purchase
   - Wallet and payment management
   - Mutual transfer portal for external teachers

2. **Web Application**
   - Administrator dashboard (Super Admin and Admin)
   - Internal teacher control panel
   - Mutual transfer portal
   - Timetable and class management
   - Exam creation and marking
   - User management
   - Payment oversight
   - Chat moderation

3. **Backend Services**
   - RESTful API
   - WebSocket server for real-time features
   - Authentication and authorization
   - Database management (PostgreSQL)
   - File storage (recordings, uploads, publications)
   - Background job processing
   - AI integration for face recognition and exam monitoring

4. **Third-Party Integrations**
   - Tracker Plus (payment gateway)
   - Video conferencing (Jitsi/Agora)
   - Push notifications (FCM)
   - SMS and email services
   - Face recognition AI service

#### **Out of Scope:**
- Desktop application (future roadmap)
- Advanced analytics and reporting dashboards
- Parent portal
- Alumni management
- Library management system
- Mobile app for administrators

### 1.3 Definitions and Acronyms

| Term | Definition |
|------|------------|
| **Admin / Super Admin** | Privileged users who manage all platform operations including users, timetables, payments, exams, transfer requests, chat approvals, and system configurations |
| **Internal Student** | Student enrolled through Pulamai Viththakan institution with monthly fee payment; accesses classes, exams, publications, seminars, and class materials |
| **External Student** | Student who signs up individually and pays per exam or via wallet credits; can purchase publications and attend free seminars |
| **Internal Teacher** | Teacher employed by the institution; creates exams, conducts classes, views attendance for their assigned subjects and grades only |
| **External Teacher** | Teacher participating in mutual-transfer feature; can search and request transfers |
| **Mutual Transfer** | Process where teachers request to swap teaching zones; includes filters for school type, specialization, subject, medium, zone, district, province, with unique request identifier |
| **Face ID** | Video capture of student's face (front, left, right) used for biometric registration during first login and AI monitoring during exams |
| **AI Monitoring** | Automatic detection of unusual behavior during exams (looking away, multiple faces, no face detected) |
| **Wallet** | Credit balance for external students (and optionally internal students) from which exam fees and publication purchases are deducted |
| **Tracker Plus** | External payment application integrated for payment processing, history, and verification |
| **SRS** | Software Requirements Specification |
| **API** | Application Programming Interface |
| **JWT** | JSON Web Token |
| **FCM** | Firebase Cloud Messaging |
| **WebRTC** | Web Real-Time Communication |
| **MCQ** | Multiple Choice Question |
| **NIC** | National Identity Card |
| **DOB** | Date of Birth |
| **PCI** | Payment Card Industry (compliance standard) |

### 1.4 Document Conventions

- **SHALL/MUST**: Indicates mandatory requirements
- **SHOULD**: Indicates recommended requirements
- **MAY**: Indicates optional requirements
- **FR-XXX**: Functional Requirement identifier
- **NFR-XXX**: Non-Functional Requirement identifier
- **UC-XXX**: Use Case identifier

---

## 2. Overall Description

### 2.1 Product Perspective

The LearnApp platform is a comprehensive educational management system that integrates multiple subsystems:

#### **Authentication and User Management**
- Admin-issued logins for internal users (students and teachers)
- Self-registration for external students and external teachers
- Face ID capture during first login for internal students
- Secure storage of biometric data and face embeddings
- Multi-session support (multiple logins on same device)
- Role-based access control (RBAC)

#### **Class Management**
- One-year timetable creation and management by admins
- Class links valid for one year, visible to students only on class day
- Teachers start classes before students can join
- Automatic attendance recording for students and teachers
- Attendance review capabilities for teachers and admins
- Video conferencing with screen sharing, whiteboard, and breakout rooms
- Recording with automatic deletion after 30 days

#### **Exam Management**
- Multiple question types: MCQ, matching, fill-in-the-blank, arrange, structured, essay, and upload questions
- Three exam formats:
  - **Full Online**: Part I only (MCQ, matching, etc.)
  - **Half Online/Half Upload**: Part I (auto-marked) + Part II (upload)
  - **Full Upload**: All questions require file uploads
- AI monitoring toggle for upload sections
- Scheduled exam windows with start/end times
- Face verification before exam access
- Real-time monitoring by teachers during exams
- Auto-marking for online questions, manual marking for uploads
- Question-wise marking workflow for teachers
- Island-wide, district-wide, and zone-wide rankings
- Differentiation between internal and external students in rankings

#### **Publications and Seminars**
- Publications listing with images, descriptions, and prices
- Purchase via wallet credits or direct payment
- Seminars open to all users without signup
- Minimum seminar details: title, description, speaker, date/time

#### **Mutual Transfer Portal**
- External teacher registration with registration ID, NIC, current zone, desired zones
- Search filters: From Zone, To Zone, subject, medium, school type, level
- Limited information display before request
- Unique request ID generation
- Progressive information disclosure:
  - Before request: Limited receiver info
  - After request sent: Receiver sees full sender details
  - After acceptance: Sender sees full receiver details (except NIC)
- Admin approval required before request publication
- In-app chat between matched teachers

#### **Payment and Wallet**
- Tracker Plus integration for payment verification
- Internal students: Monthly fee payments
- External students: Wallet top-up or pay-per-exam
- Multiple payment methods: online (card/bank), slip upload
- Unpaid internal students blocked from classes/exams
- Admin can grant temporary access for specific duration
- Payment history and due date tracking

#### **Notification and Chat**
- Notifications for class changes, exam schedules, payment reminders, seminars
- 5-minute advance notifications for classes, exams, seminars
- Push notifications via FCM, optional SMS/email
- Moderated chat between internal teachers and students
- Admin approval required before message delivery
- Chat focused on class materials and modules

### 2.2 User Characteristics

| User Type | Characteristics | Technical Proficiency | Special Needs |
|-----------|----------------|----------------------|---------------|
| **Super Admin / Admin** | Experienced office staff familiar with educational administration | High - comfortable with web interfaces, data management | Multi-language support (Tamil, Sinhala, English); comprehensive dashboard |
| **Internal Students** | Students aged 5-16 years (Grade 01-11) enrolled in Pulamai Viththakan | Low to Medium - basic mobile device usage | Age-appropriate UI, parental involvement possible, DOB validation (minimum age 5) |
| **External Students** | General students from other institutions | Medium - comfortable with mobile apps and online payments | Clear instructions, locked feature indicators, wallet management |
| **Internal Teachers** | Professional educators employed by institution | Medium to High - web proficiency, may need mobile tool training | Streamlined mobile tools, comprehensive web interface |
| **External Teachers** | Teachers seeking zone transfers | Medium - comfortable with web forms and search interfaces | Simple registration, clear request tracking |

**Common Requirements:**
- Multi-language support mandatory: Tamil, Sinhala, English
- Accessibility for different age groups (5-16 years for students)
- Mobile-first design for students and external teachers
- Web-optimized design for admins and internal teachers

### 2.3 Operating Environment

#### **Mobile Application**
- **Platforms**: Android 8.0+, iOS 13.0+
- **Requirements**:
  - Stable internet connection (minimum 2 Mbps for video)
  - Camera access (for Face ID and exam monitoring)
  - Microphone access (for classes)
  - Storage: Minimum 100MB free space
  - Screen resolution: 720p minimum

#### **Web Application**
- **Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Requirements**:
  - Stable internet connection (minimum 5 Mbps for video)
  - Screen resolution: 1366x768 minimum (1920x1080 recommended)
  - Camera/microphone for video conferencing

#### **Backend Infrastructure**
- **Server**: Cloud-based (AWS, Azure, or DigitalOcean)
- **Database**: PostgreSQL 14+ with read replicas
- **Cache**: Redis 6+ for session management and rate limiting
- **Storage**: S3-compatible object storage
- **Video Server**: Jitsi Meet or Agora (self-hosted or managed)

#### **Network Requirements**
- HTTPS (TLS 1.2+) for all communications
- WebSocket support for real-time features
- WebRTC support for video conferencing

### 2.4 Design and Implementation Constraints

#### **Regulatory and Compliance**
- **CONS-001**: MUST comply with Sri Lankan Data Protection Act
- **CONS-002**: MUST implement PCI-DSS compliance for payment data handling
- **CONS-003**: MUST obtain parental consent for students under 18 (to be implemented in future phase)
- **CONS-004**: MUST comply with Sri Lankan Central Bank regulations for payment processing

#### **Performance Constraints**
- **CONS-005**: MUST support up to 1,000 concurrent video conference participants per session
- **CONS-006**: MUST support 500+ concurrent users across the platform
- **CONS-007**: API response time MUST be under 1 second for 95% of requests under normal load
- **CONS-008**: Database queries MUST complete within 500ms for 99% of operations

#### **Data Retention**
- **CONS-009**: Video recordings MUST be auto-deleted after 30 days
- **CONS-010**: Exam content MUST remain visible to students for 7 days after completion
- **CONS-011**: Class links MUST be valid for one year but displayed only on class day

#### **Access Control**
- **CONS-012**: Multi-login on same device MUST be supported
- **CONS-013**: Multiple sessions with same credentials MUST be supported (for family sharing)
- **CONS-014**: Teachers MUST access only their assigned subjects and grades
- **CONS-015**: Students' personal information (phone, address) MUST NOT be visible to teachers

#### **Technical Constraints**
- **CONS-016**: MUST use TypeScript for type safety
- **CONS-017**: MUST implement end-to-end encryption for video sessions
- **CONS-018**: MUST use UUID for all primary keys
- **CONS-019**: MUST implement proper rate limiting (per SRS: API throttling)
- **CONS-020**: MUST support offline exam submission queue (auto-submit when connection restored)

### 2.5 Assumptions and Dependencies

#### **Assumptions**
- **ASM-001**: Users possess smartphones with functional cameras (Android 8.0+ or iOS 13.0+)
- **ASM-002**: Users have stable internet connectivity (minimum 2 Mbps for mobile, 5 Mbps for web)
- **ASM-003**: Students have basic mobile device operation skills
- **ASM-004**: Teachers have basic web browser proficiency
- **ASM-005**: Admins are trained on platform operations
- **ASM-006**: Third-party AI services maintain 99% uptime
- **ASM-007**: Payment gateway (Tracker Plus) maintains 99.5% uptime

#### **Dependencies**
- **DEP-001**: **Tracker Plus** payment gateway for all payment processing and verification
- **DEP-002**: **Jitsi Meet** or equivalent video conferencing with self-hosting capability
- **DEP-003**: **Face recognition AI service** for biometric verification and exam monitoring
- **DEP-004**: **SMS provider** (QuickSend/Dialog Ideamart) for OTP and notifications
- **DEP-005**: **Email service** (SendGrid/AWS SES) for notifications
- **DEP-006**: **FCM** (Firebase Cloud Messaging) for push notifications
- **DEP-007**: **S3-compatible storage** (AWS S3/Wasabi/MinIO) for files and recordings
- **DEP-008**: **PostgreSQL 14+** for primary data storage
- **DEP-009**: **Redis 6+** for caching and session management

**Risk Mitigation:**
- All third-party dependencies SHOULD have fallback mechanisms
- Critical services SHOULD have 99.5% uptime SLA
- Payment failures SHOULD have retry mechanisms
- Video conferencing SHOULD have alternative providers configured
- AI monitoring failures SHOULD NOT block exam access (manual review option)

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                        CLIENT LAYER                              â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  Mobile App      â”‚   Web App        â”‚   Future: Desktop App    â”‚
â”‚  (React Native)  â”‚   (Next.js)      â”‚   (Electron)             â”‚
â”‚                  â”‚                  â”‚                          â”‚
â”‚  - Internal/     â”‚  - Admin Panel   â”‚  - Planned for          â”‚
â”‚    External      â”‚  - Teacher Panel â”‚    Phase 2              â”‚
â”‚    Students      â”‚  - Mutual        â”‚                          â”‚
â”‚  - Teachers      â”‚    Transfer      â”‚                          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚
                              â”‚ HTTPS/WSS
                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                      API GATEWAY / LOAD BALANCER                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚
                â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                â–¼                            â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   REST API Server         â”‚   â”‚  WebSocket Server          â”‚
â”‚   (NestJS)                â”‚   â”‚  (Real-time)               â”‚
â”‚                           â”‚   â”‚                            â”‚
â”‚   - Authentication        â”‚   â”‚  - Live Classes            â”‚
â”‚   - User Management       â”‚   â”‚  - Exam Monitoring         â”‚
â”‚   - Class Management      â”‚   â”‚  - Notifications           â”‚
â”‚   - Exam Engine           â”‚   â”‚  - Chat                    â”‚
â”‚   - Payment Processing    â”‚   â”‚                            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                â”‚                            â”‚
                â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                      DATA & SERVICES LAYER                       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  PostgreSQL DB   â”‚   Redis Cache    â”‚   S3 Storage            â”‚
â”‚  - User Data     â”‚   - Sessions     â”‚   - Recordings          â”‚
â”‚  - Classes       â”‚   - Rate Limit   â”‚   - Uploads             â”‚
â”‚  - Exams         â”‚   - Leaderboards â”‚   - Publications        â”‚
â”‚  - Payments      â”‚                  â”‚   - Profile Images      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚
                â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                â–¼                            â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  EXTERNAL SERVICES        â”‚   â”‚  BACKGROUND JOBS           â”‚
â”‚                           â”‚   â”‚  (BullMQ)                  â”‚
â”‚  - Tracker Plus (Payment) â”‚   â”‚                            â”‚
â”‚  - Jitsi (Video)          â”‚   â”‚  - Ranking Calculation     â”‚
â”‚  - AI Face Recognition    â”‚   â”‚  - Recording Cleanup       â”‚
â”‚  - FCM (Notifications)    â”‚   â”‚  - Payment Verification    â”‚
â”‚  - SMS/Email Services     â”‚   â”‚  - Notification Dispatch   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 3.2 User Roles and Access Control

| Role | Code | Platform Access | Key Responsibilities | Permissions Level |
|------|------|----------------|---------------------|-------------------|
| **Super Admin** | `SUPER_ADMIN` | Web Only | Full platform control, infrastructure management, global settings, emergency overrides | FULL ACCESS |
| **Admin** | `ADMIN` | Web Only | User provisioning, approvals, payments, timetables, content moderation, chat approvals | ADMINISTRATIVE |
| **Internal Student** | `INTERNAL_STUDENT` | Mobile Only | Attend classes, take exams, access materials, view grades, manage payments | USER - READ/WRITE (Own Data) |
| **External Student** | `EXTERNAL_STUDENT` | Mobile Only | Take exams, purchase publications, attend seminars, manage wallet | USER - LIMITED |
| **Internal Teacher** | `INTERNAL_TEACHER` | Web (Full) + Mobile (Limited) | Create exams, conduct classes, mark submissions, upload materials, view assigned student attendance | TEACHER - RESTRICTED TO ASSIGNED SUBJECTS/GRADES |
| **External Teacher** | `EXTERNAL_TEACHER` | Web + Mobile (Transfer Portal Only) | Search transfers, send/receive requests, communicate with matches | USER - MUTUAL TRANSFER ONLY |

**Access Control Rules:**
- **ACR-001**: Teachers SHALL NOT access student personal information (phone numbers, addresses)
- **ACR-002**: Teachers SHALL only view data for their assigned subjects and grades
- **ACR-003**: External teachers SHALL NOT access any educational content until validated by admin
- **ACR-004**: Multiple concurrent sessions SHALL be supported for the same account
- **ACR-005**: Multi-device login SHALL be supported (e.g., parent and child using same account)
- **ACR-006**: Admin SHALL have view-only access to all live classes for monitoring
- **ACR-007**: Super Admin SHALL have emergency override capabilities for all system functions

### 3.3 Platform Distribution

#### **Priority 1: Web Application (HIGH PRIORITY)**

**Purpose**: Comprehensive administrative control and teacher management portal

**Target Users**: 
- Super Admin
- Admin
- Internal Teachers (full access)
- External Teachers (mutual transfer only)

**Key Capabilities**:
- Full administrative panel for system and site administration
- Teacher control panel (exam builder, marking, scheduling, content management)
- Mutual Transfer Portal (searching, requesting, managing transfer requests)
- Payment dashboard and oversight
- User provisioning and management
- Timetable builder and class scheduling
- Rankings and reporting
- Chat moderation interface

**Technology**: Next.js (TypeScript), shadcn/ui, TanStack Query, React Hook Form

---

#### **Priority 1: Mobile Application (HIGH PRIORITY)**

**Purpose**: Student learning experience and lightweight teacher controls

**Target Users**:
- Internal Students
- External Students
- Internal Teachers (limited functionality)
- External Teachers (mutual transfer only)

**Key Capabilities**:

**For Students:**
- Exams (online, hybrid, upload-based)
- Live classes with video conferencing
- Publications browsing and purchase
- Notifications and reminders
- Wallet and payment management
- Notes and recordings access
- Seminar viewing

**For Internal Teachers (Mobile):**
- Start and stop classes
- Start exams
- View today's schedule
- Limited proctoring controls
- Quick notifications

**For External Teachers (Mobile):**
- Mutual Transfer portal access
- Search and filter transfers
- Send/receive transfer requests
- In-app messaging with matches

**Technology**: React Native (TypeScript), Expo, React Query, Zustand

---

#### **Priority 2: Desktop Application (MEDIUM/LOW PRIORITY - Future Roadmap)**

**Purpose**: Desktop-optimized experience for admins and teachers

**Status**: Planned for Phase 2 after Web + Mobile stability

**Technology**: Electron (shared codebase with web app)

---

#### **Payment System Overview**

**Integration**: Tracker Plus (Primary Payment Gateway)

**Payment Methods**:
1. **Online Payment**:
   - Credit/Debit card
   - Online banking
   - Instant credit upon successful transaction
   
2. **Bank Slip Upload**:
   - Student uploads payment proof
   - Admin reviews and approves
   - Approval typically within 24 hours
   - Notification sent upon approval/rejection

**Credit System**:
- **External Students**: Wallet-based credits
  - Pay-per-exam model
  - Credit bundles (e.g., LKR 1000 = 10 exams)
  - Credits deducted for exams and publications
  
- **Internal Students**: Institutional monthly fees
  - Fixed monthly payment
  - Due date tracking
  - Access restrictions if unpaid
  - Admin can grant temporary access


---

## 4. Functional Requirements

This section groups functional requirements by user role. Each requirement is identified with a unique label (FR-XXX) for traceability.

### 4.1 Common Requirements (All Users)

#### FR-001: User Registration and Authentication

**FR-001.1 External Student Registration** (Mobile Only)
- **Priority**: HIGH
- **Description**: The system SHALL allow external students to self-register using their mobile device
- **Requirements**:
  - Primary identifier: Phone number (MUST be unique)
  - Optional email (MUST be unique if provided)
  - Required fields: Grade, medium, school name, full name, date of birth
  - DOB validation: MUST not allow age below 5 years
  - No institution code required
  - No Face ID capture for external students
- **Acceptance Criteria**:
  - Student can complete registration without admin approval
  - Phone number format validated (Sri Lankan format)
  - Grade options: Grade 01 through Grade 11
  - Medium options: Tamil, Sinhala, English
  - Unique phone number enforced at database level

**FR-001.2 Internal Student Login** (Mobile Only)
- **Priority**: HIGH
- **Description**: Internal students SHALL log in using admin-provided credentials with mandatory Face ID capture
- **Requirements**:
  - User ID and password provided by admin
  - Mandatory institution code: "Pulamai Viththakan"
  - **Face ID Capture** (First Login):
    - Record 3-angle facial video: front, left side, right side
    - Video submitted to admin for verification
    - Student can proceed WITHOUT waiting for admin approval
    - Face data stored securely with encryption
    - Used for ongoing verification in classes and exams
  - **Face Verification** (Subsequent Access):
    - Verify face before allowing class entry
    - Verify face before starting exams
    - If face does not match: deny access or hide exam paper
- **Acceptance Criteria**:
  - Face capture completed before accessing platform features
  - Video quality check (minimum resolution, lighting check)
  - Admin receives notification for face verification review
  - Face verification completes within 2 seconds
  - Failed verification shows clear error message

**FR-001.3 Internal Teacher Login** (Web + Mobile)
- **Priority**: HIGH
- **Description**: Internal teachers SHALL log in using admin-issued credentials
- **Requirements**:
  - Admin-provided user ID and password
  - **Web Access**: Full functionality (exam creation, marking, content management)
  - **Mobile Access**: Limited to starting classes and exams only
  - Multi-session support (can be logged in on web and mobile simultaneously)
  - Role-based access control restricts to assigned subjects and grades
- **Acceptance Criteria**:
  - Teacher can log in to web and mobile simultaneously
  - Mobile app shows limited interface
  - Access to only assigned grades/subjects enforced

**FR-001.4 External Teacher Registration** (Web + Mobile - Mutual Transfer Only)
- **Priority**: MEDIUM
- **Description**: External teachers SHALL register for Mutual Transfer portal access
- **Requirements**:
  - Registration ID (teacher registration number)
  - NIC (National Identity Card) - not displayed to other teachers
  - Current school name and zone
  - Subject and medium of teaching
  - Desired transfer zones (multi-select)
  - School type preference
  - Admin validation required before posting requests
- **Acceptance Criteria**:
  - Registration form validates required fields
  - Admin receives notification for validation
  - Teacher account remains restricted until admin approval
  - Clear status indicator shows "Pending Validation"

**FR-001.5 Multi-Login Support**
- **Priority**: HIGH
- **Description**: The system SHALL support multiple logins on the same device and multiple concurrent sessions
- **Requirements**:
  - Same device can have multiple accounts logged in (like Facebook app)
  - Same credentials can be used on multiple devices simultaneously
  - Each session tracked independently
  - Session management via JWT tokens with refresh mechanism
- **Acceptance Criteria**:
  - User can switch between accounts on mobile without logging out
  - Multiple family members can use same student account
  - No session conflict errors
  - Each session has independent state

---

#### FR-002: Profile Management

**FR-002.1 Profile View and Edit**
- **Priority**: MEDIUM
- **Description**: Users SHALL view and edit their personal profile information
- **Requirements**:
  - View personal details (name, grade, medium, school, contact)
  - Edit allowed fields based on user type
  - Upload/change profile picture (max 5MB, JPG/PNG)
  - Internal students: Cannot change institution code
  - External students: Can update grade, medium, school
  - Teachers: Can update contact information only
  - Password change functionality
- **Acceptance Criteria**:
  - Changes save successfully with confirmation message
  - Profile picture displays immediately after upload
  - Invalid file types rejected with clear error
  - Password change requires current password verification

**FR-002.2 Admin Profile Management**
- **Priority**: HIGH
- **Description**: Admins SHALL modify any user's profile details and manage account status
- **Requirements**:
  - View all user profiles
  - Edit any user field (except system-generated IDs)
  - Deactivate user accounts (soft delete)
  - Reactivate deactivated accounts
  - Delete users completely (hard delete - use with caution)
  - Reset user passwords
  - Deactivated students hidden from payment records
- **Acceptance Criteria**:
  - Admin actions logged in audit trail
  - Deactivated users cannot log in
  - Reactivation restores full access
  - Password reset triggers notification to user
  - Deleted users removed from all active records but retained in audit logs

---

#### FR-003: Notification System

**FR-003.1 Notification Types and Delivery**
- **Priority**: HIGH
- **Description**: The system SHALL send notifications for key events via multiple channels
- **Notification Types**:
  - Class schedule changes (cancellation, subject swap, time change)
  - Exam schedules (5 minutes before exam start)
  - Payment reminders (2 days before due date, on due date)
  - Seminar announcements (when published, 5 minutes before start)
  - Class reminders (5 minutes before class start)
  - Chat message approvals
  - Mutual transfer request updates
  - Temporary access granted
- **Delivery Channels**:
  - **Push Notifications** (FCM) - Primary channel for mobile
  - **In-App Notifications** - Stored in dedicated Notifications page
  - **SMS** - Optional, for critical notifications (payment due, exam starting)
  - **Email** - Optional, for summary notifications
- **Requirements**:
  - Notifications persist in dedicated page for 30 days
  - Mark as read/unread functionality
  - Clear all notifications option
  - Badge counter on app icon
  - Notification preferences (user can toggle types)
- **Acceptance Criteria**:
  - Notifications delivered within 30 seconds of event
  - Failed delivery retried up to 3 times
  - Notification history accessible for 30 days
  - User can mute specific notification types

**FR-003.2 Targeted Notifications**
- **Priority**: HIGH
- **Description**: Notifications SHALL be sent to specific audiences based on event type
- **Targeting Rules**:
  - Class changes: All students enrolled in that class + teacher
  - Exam schedules: All eligible students (internal/external based on exam visibility)
  - Payment reminders: Individual students with pending payments
  - Seminar announcements: All users (internal and external)
  - Admin messages: Can be broadcast or targeted to specific user groups
- **Acceptance Criteria**:
  - Correct audience receives notifications (no over-delivery)
  - Broadcast notifications delivered to all within 60 seconds
  - Targeted notifications respect user preferences

---

#### FR-004: Chat and Messaging System

**FR-004.1 Moderated Chat Between Teachers and Students**
- **Priority**: MEDIUM
- **Description**: Internal teachers and internal students SHALL communicate via moderated chat for module-related discussions
- **Requirements**:
  - Chat limited to internal teachers and internal students
  - All messages require admin approval before delivery
  - Chat focused on class materials and module clarifications
  - Rich text support (bold, italic, links)
  - File attachment support (max 10MB, PDF/DOCX/images)
  - Message status indicators: Sending, Pending Approval, Approved, Rejected
  - Admin moderation queue with approve/reject actions
  - Rejected messages notify sender with reason
- **Acceptance Criteria**:
  - Messages queue for admin review
  - Admin can approve/reject within moderation interface
  - Approved messages delivered instantly
  - Rejected messages show reason to sender
  - Chat history preserved for academic year
  - File attachments scanned for viruses

**FR-004.2 Chat Between Matched Teachers (Mutual Transfer)**
- **Priority**: MEDIUM
- **Description**: External teachers SHALL communicate via in-app chat after mutual transfer request acceptance
- **Requirements**:
  - Chat enabled only after request acceptance
  - No admin moderation required (peer-to-peer)
  - Real-time messaging via WebSocket
  - Message history preserved until transfer completion
  - Text-only messages (no file attachments)
  - Block/report functionality for inappropriate content
- **Acceptance Criteria**:
  - Messages delivered in real-time (< 1 second)
  - Chat accessible from transfer request details
  - Blocked users cannot send further messages
  - Reported messages flagged for admin review

---

### 4.2 Internal Student Requirements

#### FR-005: Home Screen and Navigation

**FR-005.1 Home Screen Layout** (Mobile)
- **Priority**: HIGH
- **Description**: Internal student home screen SHALL display relevant information and quick access navigation
- **Top Bar Elements**:
  - Side menu icon (hamburger menu)
  - Institution logo
  - Notifications bell with badge counter
  - Profile icon
  - Search icon (for notes, recordings, exams)
- **Banner Section**:
  - Timetable display per grade (admin-managed)
  - Swipeable banner for multiple announcements
- **Main Content**:
  - Today's Classes section with join buttons
  - Upcoming Exams (next 7 days)
  - Recent Notifications (top 5)
  - Payment Due Reminder (if due within 2 days)
- **Footer Navigation**:
  - Home
  - Exams
  - Video Conference (Classes)
  - Payment
  - Notes
- **Acceptance Criteria**:
  - All elements load within 2 seconds
  - Timetable banner updates automatically from admin panel
  - Notification badge updates in real-time
  - Footer navigation always visible

**FR-005.2 Side Menu**
- **Priority**: MEDIUM
- **Description**: Side menu SHALL provide access to secondary features
- **Menu Items**:
  - Teachers (list of assigned teachers)
  - Payments (history and current status)
  - Subjects (list of enrolled subjects)
  - Recordings (available for 7 days)
  - Instructions (platform usage guide)
  - Publications (book store)
  - Exams (full exam list)
  - Class Links (today's links)
  - Admin Chat (contact admin)
  - Settings
  - Logout
- **Acceptance Criteria**:
  - Menu slides in from left with smooth animation
  - Each item navigates to correct screen
  - Badge counters show unread notifications per section

---

#### FR-006: Class Attendance and Live Classes

**FR-006.1 Class Link Access Rules**
- **Priority**: HIGH
- **Description**: Internal students SHALL see today's class links only and join only after teacher starts
- **Requirements**:
  - Class links valid for one year (recurring schedule)
  - Links appear on home screen only on scheduled day
  - "Join" button disabled until teacher starts class
  - Button changes to "Join Now" when class is live
  - Camera and microphone MUST be enabled during class
  - Background app usage blocked during class
  - Attendance automatically recorded upon joining
  - Student can rejoin if disconnected
- **Acceptance Criteria**:
  - Links visible only on correct day (timezone-aware)
  - Join button enabled within 5 seconds of teacher starting class
  - Camera/microphone permissions requested on first join
  - Attendance recorded with join timestamp
  - Disconnection and rejoin tracked

**FR-006.2 Live Class Experience**
- **Priority**: HIGH
- **Description**: Students SHALL participate in live video classes with required video/audio enabled
- **Requirements**:
  - Video conference powered by Jitsi or equivalent
  - Students see teacher video (large view)
  - Students see other students (grid view, optional)
  - Teacher can control student audio/video (mute/unmute, hide video)
  - Screen sharing view when teacher shares screen
  - Whiteboard access (view-only for students, unless granted access)
  - Chat panel for questions
  - Raise hand functionality
  - Exit class button
- **Acceptance Criteria**:
  - Video loads within 5 seconds
  - Audio/video quality maintained at network conditions
  - Teacher controls apply immediately
  - Screen share displays full-screen option
  - Student can exit and rejoin without issues

**FR-006.3 Attendance Tracking**
- **Priority**: HIGH
- **Description**: The system SHALL automatically track student attendance for classes
- **Requirements**:
  - Attendance marked upon joining class
  - Duration tracked (join time to leave time)
  - Minimum attendance threshold: 75% of class duration for "Present" status
  - Below 75%: marked as "Partial Attendance"
  - No join: marked as "Absent"
  - Students can view their own attendance records
  - Monthly attendance percentage calculated
  - Attendance visible on profile
- **Acceptance Criteria**:
  - Attendance records stored accurately
  - Students see attendance history in calendar view
  - Monthly percentage calculation correct
  - Teachers and admins can view student attendance

**FR-006.4 Admin Monitoring**
- **Priority**: MEDIUM
- **Description**: Admins SHALL join any live class for monitoring purposes
- **Requirements**:
  - Admin has view-only access by default
  - Can enable audio/video if needed
  - Cannot disrupt teacher controls
  - Presence indicator shows "Admin Observing"
  - Can view attendance roster during class
- **Acceptance Criteria**:
  - Admin can join any class without prior approval
  - Presence does not disrupt class flow
  - Admin actions logged for audit

---

#### FR-007: Examinations for Internal Students

**FR-007.1 Exam Discovery and Filtering**
- **Priority**: HIGH
- **Description**: Internal students SHALL view and filter available exams
- **Requirements**:
  - View upcoming exams (next 30 days)
  - View past exams with results
  - Filter by:
    - Subject
    - Grade
    - Medium
    - Unit/Term
    - Exam Type (Online, Hybrid, Upload)
  - Exam cards display:
    - Title
    - Subject and Grade
    - Teacher name
    - Start date/time
    - Duration
    - Exam type
    - "Start Exam" button (disabled until exam window)
- **Acceptance Criteria**:
  - Filters apply instantly
  - Exam cards show accurate information
  - Start button enables at exact exam start time
  - Timezone-aware scheduling

**FR-007.2 Exam Access and Windowing**
- **Priority**: HIGH
- **Description**: Exams SHALL be accessible only within scheduled time windows
- **Requirements**:
  - Exams have start time and end time
  - "Start Exam" button enabled only during window
  - Warning if less than 10 minutes remaining
  - Auto-submit at end time if student hasn't submitted
  - Cannot access exam before start time
  - Cannot start new attempt after end time
- **Acceptance Criteria**:
  - Time window enforced strictly
  - Auto-submit triggers at end time
  - Student receives countdown warnings (10 min, 5 min, 1 min)

**FR-007.3 Exam Types**
- **Priority**: HIGH
- **Description**: The system SHALL support three exam formats with different question types

**Type 1: Full Online (Part I Only)**
- Auto-marked questions only:
  - Multiple Choice Questions (MCQ)
  - Matching questions
  - Fill-in-the-blank
  - Arrange in order
- Face monitoring active throughout
- Results available immediately after submission

**Type 2: Half Online + Half Upload (Part I + Part II)**
- Part I: Auto-marked questions (as above)
- Part II: Upload-based questions
  - Structured questions
  - Essay questions
  - Upload answer sheets (PDF/images)
- Face monitoring configurable per part (AI toggle)
- Part I results immediate, Part II after teacher marking

**Type 3: Full Upload**
- All questions require file uploads
- AI face monitoring can be disabled (teacher's choice during creation)
- Results available after teacher marking

**Acceptance Criteria**:
- Each type renders correctly
- Auto-marking accurate for online parts
- Upload accepts PDF/JPG/PNG (max 10MB per file)
- Face monitoring behavior matches exam configuration

**FR-007.4 Exam Instructions and Rules**
- **Priority**: HIGH
- **Description**: Students SHALL view and acknowledge exam instructions before starting
- **Requirements**:
  - Instructions displayed in modal/screen before exam
  - Rules include:
    - Face must be visible throughout (if AI enabled)
    - Camera/mic required
    - No switching tabs or apps
    - Time limits
    - Submission process
  - "I Understand" checkbox required
  - "Start Exam" button enabled after acknowledgment
- **Acceptance Criteria**:
  - Instructions clearly displayed
  - Cannot start without acknowledgment
  - Rules specific to exam type shown

**FR-007.5 Face Verification Before Exam**
- **Priority**: HIGH
- **Description**: Internal students MUST pass face verification before starting exams
- **Requirements**:
  - Face recognition check before exam access
  - Compare with stored Face ID from registration
  - If face not recognized:
    - Display error message
    - Provide retry option (max 3 attempts)
    - Offer "Contact Teacher" option after failed attempts
  - If face recognized:
    - Grant exam access immediately
- **Acceptance Criteria**:
  - Face verification completes within 3 seconds
  - Clear error messages for failed attempts
  - Teacher/admin notification after 3 failed attempts
  - Manual override option available to admin

**FR-007.6 AI Monitoring During Exam**
- **Priority**: HIGH
- **Description**: The system SHALL monitor students during exams using AI face recognition
- **Requirements**:
  - Continuous face monitoring via front camera
  - Detection triggers:
    - Face not visible
    - Looking away from screen (> 5 seconds)
    - Multiple faces detected
    - No face detected
  - **Behavior on Trigger**:
    - Exam paper hidden immediately
    - Warning message displayed
    - Video recording continues
    - Student can request teacher/admin to restore access
  - Teacher receives real-time alert
  - AI can be disabled for upload sections (configured during exam creation)
  - Video feed visible to teacher during exam (live proctoring)
- **Acceptance Criteria**:
  - Face detection accuracy > 95%
  - Warnings trigger within 2 seconds of violation
  - Teacher alerted in real-time
  - Student can resume after teacher approval
  - False positives minimized (lighting adjustments grace period)

**FR-007.7 Exam Submission and Results**
- **Priority**: HIGH
- **Description**: Students SHALL submit exams and view results based on exam type
- **Requirements**:
  - "Submit" button available after answering all required questions
  - Confirmation dialog before submission
  - Auto-submit at end time
  - **Results Display**:
    - **Part I (Auto-marked)**: Results immediate after submission
    - **Part II (Uploads)**: Results after teacher correction (within 7 days)
  - Results screen shows:
    - Total marks
    - Marks per question
    - Correct answers (for auto-marked)
    - Teacher feedback (for uploads)
  - Result remains visible for 7 days after release
- **Acceptance Criteria**:
  - Submission confirmation prevents accidental submit
  - Auto-submit saves all answered questions
  - Results calculation accurate
  - Results visible for exactly 7 days

**FR-007.8 Rankings Display**
- **Priority**: MEDIUM
- **Description**: Students SHALL view exam rankings at multiple levels
- **Requirements**:
  - Rankings calculated after all submissions and marking complete
  - **Ranking Levels**:
    - Island-wide (all students)
    - District-wise
    - Zone-wise
  - **Differentiation**:
    - Internal students displayed with institution badge
    - External students displayed with "External" badge
  - Display:
    - Rank position
    - Student name (anonymized option for external)
    - Total marks
    - Percentile
- **Acceptance Criteria**:
  - Rankings update within 1 hour of final mark release
  - Internal/external clearly differentiated
  - Student's own rank highlighted
  - Accurate percentile calculation

---

#### FR-008: Payments for Internal Students

**FR-008.1 Payment Status and Reminders**
- **Priority**: HIGH
- **Description**: Internal students SHALL view payment status and receive reminders for due payments
- **Requirements**:
  - Payment page displays:
    - Current payment status (Paid/Pending/Overdue)
    - Monthly fee amount
    - Due date
    - Payment history (last 6 months)
    - Admin contact details
  - Reminders:
    - Notification 2 days before due date
    - Notification on due date
    - Banner on home screen if overdue
- **Acceptance Criteria**:
  - Payment status accurate and real-time
  - History shows all transactions
  - Reminders sent at correct times

**FR-008.2 Payment Methods**
- **Priority**: HIGH
- **Description**: Internal students SHALL pay monthly fees via online payment or bank slip upload
- **Payment Options**:
  
  **Option 1: Online Payment**
  - Integrated with Tracker Plus gateway
  - Payment methods: Credit/Debit card, Online banking
  - Process:
    1. Select "Pay Online"
    2. Enter amount (pre-filled with monthly fee)
    3. Redirect to payment gateway
    4. Complete payment
    5. Return to app with success/failure status
  - Auto-credit immediately on success
  - Webhook verification from Tracker Plus
  
  **Option 2: Bank Slip Upload**
  - Student uploads payment proof (JPG/PNG/PDF, max 5MB)
  - Add payment details:
    - Date of payment
    - Bank and branch
    - Reference number
    - Amount
  - Submit for admin approval
  - Status: "Pending Approval"
  - Notification sent after admin review (typically 24 hours)
  - Approved: Account credited, access restored
  - Rejected: Reason provided, student can re-upload

- **Requirements**:
  - Terms & conditions checkbox required
  - Payment instructions clearly displayed
  - Payment history updated immediately
  - Receipts downloadable

- **Acceptance Criteria**:
  - Online payment completes within 60 seconds
  - Bank slip upload successful with confirmation
  - Admin approval workflow functional
  - Status updates sent via notification

**FR-008.3 Access Restrictions for Unpaid Students**
- **Priority**: HIGH
- **Description**: Unpaid internal students SHALL be restricted from accessing platform features until payment
- **Requirements**:
  - **Restrictions Applied**:
    - Cannot join live classes
    - Cannot start exams
    - Cannot access notes and recordings
  - **Payment Prompt**:
    - Modal displayed when attempting restricted action
    - Shows outstanding amount and due date
    - "Pay Now" button redirects to payment page
    - "Contact Admin" option available
  - **Temporary Access Override**:
    - Admin can grant temporary access
    - Duration specified by admin (e.g., 3 days, 7 days)
    - Access restored immediately
    - Countdown visible to student
    - Restrictions reapplied after expiry
- **Acceptance Criteria**:
  - Restrictions enforce immediately after due date
  - Clear messaging explains restriction reason
  - Temporary access activates instantly
  - Access revoked after temporary period expires

---

#### FR-009: Notes and Recordings

**FR-009.1 Notes Access**
- **Priority**: MEDIUM
- **Description**: Internal students SHALL view and download notes uploaded by teachers
- **Requirements**:
  - Notes organized by:
    - Subject
    - Grade
    - Date uploaded
  - Notes display:
    - Title
    - Teacher name
    - Upload date
    - File size
    - Description
  - Download functionality (PDF/DOCX)
  - View count tracking
- **Acceptance Criteria**:
  - Notes load within 2 seconds
  - Download completes successfully
  - Files open correctly on device

**FR-009.2 Recordings Access**
- **Priority**: MEDIUM
- **Description**: Internal students SHALL access class recordings with time-limited availability
- **Requirements**:
  - Recordings available for 7 days after class
  - Organized by subject and date
  - Recording displays:
    - Class title
    - Teacher name
    - Date and duration
    - Remaining days available
  - Streaming playback (no download)
  - Playback controls: play, pause, seek, 1.5x/2x speed
  - Auto-deletion after 30 days (admin-side)
  - Students see "Recording Expired" after 7 days
- **Acceptance Criteria**:
  - Recordings stream smoothly
  - 7-day availability enforced
  - Expired message displayed after period

---

#### FR-010: Publications and Seminars

**FR-010.1 Publications Browsing (Internal Students)**
- **Priority**: MEDIUM
- **Description**: Internal students MAY browse and purchase publications using wallet credits
- **Requirements**:
  - Publications page displays books/materials
  - Grid or list view toggle
  - Each publication shows:
    - Cover image
    - Title
    - Short description
    - Price (LKR)
    - Grade/Subject tags
  - Filter by:
    - Subject
    - Grade
    - Publication type
  - Search functionality
  - "Buy Now" button
- **Acceptance Criteria**:
  - Publications load with images
  - Filters apply correctly
  - Search returns relevant results

**FR-010.2 Publication Purchase (Internal Students)**
- **Priority**: MEDIUM
- **Description**: Internal students SHALL purchase publications using wallet credits or direct payment
- **Requirements**:
  - Purchase flow:
    1. Tap "Buy Now"
    2. Confirm purchase dialog (shows price)
    3. Select payment method:
       - Wallet credits (if sufficient balance)
       - Direct payment (card/online banking)
    4. Process payment
    5. Download link provided upon success
  - Purchase history tracked
  - Digital publications delivered as PDF
  - Physical publications: order placed (delivery via institution)
- **Acceptance Criteria**:
  - Payment processed successfully
  - Download link valid for 1 year
  - Purchase recorded in history

**FR-010.3 Seminars**
- **Priority**: LOW
- **Description**: All users (including internal students) SHALL view and join seminars without signup
- **Requirements**:
  - Seminars displayed on home screen
  - Open to all users (no authentication required for viewing)
  - Seminar details:
    - Title
    - Description
    - Speaker name and photo
    - Date and time
    - Duration
    - Join URL or in-app link
  - No signup or payment required
  - "Join Seminar" button available 5 minutes before start
  - Optional: Notification 5 minutes before start (for logged-in users)
- **Acceptance Criteria**:
  - Seminars visible to all users
  - Join link works without authentication
  - Notifications sent to opted-in users

---

### 4.3 External Student Requirements

#### FR-011: External Student Onboarding and Role Selection

**FR-011.1 Role Selection Screen**
- **Priority**: HIGH
- **Description**: The mobile app SHALL present a role selection screen on first launch for unauthenticated users
- **Requirements**:
  - Display two options: "Student" or "Teacher"
  - Show feature preview with locked content
  - Lock icons visible on restricted features
  - Clicking locked features prompts signup/login
  - **Seminars Section**: Accessible without signup/login
- **Acceptance Criteria**:
  - Role selection appears on first app launch
  - Locked features clearly indicated
  - Seminar section accessible without authentication
  - Smooth navigation to signup flow

**FR-011.2 External Student Registration**
- **Priority**: HIGH
- **Description**: External students SHALL complete registration via mobile app without institution code
- **Requirements**:
  - Access from Profile section
  - Required fields:
    - Phone number (used as User ID, must be unique)
    - Email (optional, must be unique if provided)
    - Full name
    - Date of birth (validated: minimum age 5 years)
    - Grade level (Grade 01-11)
    - Medium of instruction (Tamil/Sinhala/English)
    - School name
  - No institution code required
  - No Face ID capture for external students
  - Password creation (minimum 8 characters)
  - Terms and conditions acceptance
- **Acceptance Criteria**:
  - Phone number format validated (Sri Lankan format +94XXXXXXXXX)
  - DOB validation enforces minimum age 5
  - Registration completes without admin approval
  - Email validation if provided
  - Duplicate phone number rejected

---

#### FR-012: Wallet Management and Payment

**FR-012.1 Wallet Display**
- **Priority**: HIGH
- **Description**: External students SHALL view wallet balance prominently in the app
- **Requirements**:
  - Wallet amount displayed in header next to profile icon
  - Color-coded balance indicator:
    - Green: Sufficient credits (>5 exams)
    - Yellow: Low credits (1-5 exams)
    - Red: Insufficient credits (0 exams)
  - Tap wallet icon to view detailed transaction history
  - "Top Up" button readily accessible
- **Acceptance Criteria**:
  - Balance updates in real-time after payment
  - Transaction history shows all credits and debits
  - Clear indication of credits required per exam

**FR-012.2 Exam Access with Credits**
- **Priority**: HIGH
- **Description**: External students SHALL access exams using wallet credits or pay-per-exam
- **Requirements**:
  - Each exam displays credit cost (e.g., "1 Credit" or "LKR 100")
  - Before starting exam, check sufficient credits
  - If insufficient:
    - Show modal: "Insufficient Credits"
    - Display current balance and required amount
    - Offer options:
      1. Top up wallet
      2. Pay for this exam only (direct payment)
  - Credits deducted upon exam start (not submission)
  - No refund if exam abandoned
- **Acceptance Criteria**:
  - Credit check performed before exam access
  - Clear messaging for insufficient credits
  - Both payment options functional
  - Credit deduction immediate and accurate

**FR-012.3 Wallet Top-Up**
- **Priority**: HIGH
- **Description**: External students SHALL top up wallet using online payment or bank slip
- **Requirements**:
  - **Credit Bundles** (recommended):
    - LKR 1,000 = 10 exam credits
    - LKR 2,000 = 20 exam credits + 2 bonus
    - LKR 5,000 = 50 exam credits + 5 bonus
    - Custom amount (minimum LKR 100)
  - **Payment Methods**:
    - Online payment (card/banking) â†’ Instant credit via Tracker Plus
    - Bank slip upload â†’ Admin approval within ~24 hours
  - Payment instructions displayed clearly
  - Transaction reference saved
  - Email/SMS receipt sent
- **Acceptance Criteria**:
  - Bundles display savings percentage
  - Online payment credits wallet immediately
  - Bank slip uploads successfully with status tracking
  - Receipt downloadable

**FR-012.4 Publication Purchase (External Students)**
- **Priority**: MEDIUM
- **Description**: External students SHALL purchase publications using wallet credits or direct payment
- **Requirements**:
  - Publications browseable without authentication
  - "Buy Now" locked until registered
  - Purchase options:
    - Use wallet credits (if sufficient)
    - Direct payment (card/online banking)
  - Digital publications: Immediate PDF download
  - Physical publications: Not available for external students (institution delivery only)
  - Purchase confirmation with download link
  - Download link valid for 1 year
- **Acceptance Criteria**:
  - Credits deducted accurately
  - Direct payment processes successfully
  - Download link accessible immediately
  - Purchase recorded in history

---

#### FR-013: Internal Enrollment Inquiry

**FR-013.1 WhatsApp Contact for Internal Enrollment**
- **Priority**: LOW
- **Description**: External students wishing to enroll internally SHALL contact admin via WhatsApp
- **Requirements**:
  - WhatsApp call-to-action (CTA) button visible on home screen
  - Icon: WhatsApp logo with "Join Internal Classes" label
  - Tap opens WhatsApp with pre-filled message:
    - "Hi, I'm interested in enrolling as an internal student. My registered phone number is [PHONE]. Please provide details."
  - Links to institution's WhatsApp business number
  - Available for both logged-in and guest users
- **Acceptance Criteria**:
  - CTA button prominently placed
  - WhatsApp opens with correct number and message
  - Works on both Android and iOS
  - Pre-filled message includes user's phone if logged in

---

### 4.4 Internal Teacher Requirements

#### FR-014: Teacher Dashboard

**FR-014.1 Dashboard Overview**
- **Priority**: HIGH
- **Description**: Internal teachers SHALL view a comprehensive dashboard with class schedule, exam overview, and student statistics
- **Requirements**:
  - **Today's Schedule**: List of today's classes with:
    - Time, Subject, Grade, Join button (enabled only during class time)
    - Student attendance count (live update)
  - **Upcoming Exams**: List of exams in next 7 days with:
    - Exam name, Date/Time, Enrolled students count, Status (Draft/Published)
  - **Quick Stats Cards**:
    - Total Students (across all classes)
    - Active Classes (this week)
    - Pending Marking (exams awaiting results)
    - Mutual Transfer Requests (received count)
  - **Recent Activity Feed**: Last 10 actions (student enrollments, exam submissions, chat messages)
  - **Notifications Badge**: Unread count on notification icon
- **Acceptance Criteria**:
  - Dashboard loads within 3 seconds
  - Live attendance updates every 30 seconds during class
  - Quick stats update in real-time
  - Navigate to detail screens from each card

**FR-014.2 Profile and Settings**
- **Priority**: MEDIUM
- **Description**: Internal teachers SHALL manage their profile, qualifications, and notification preferences
- **Requirements**:
  - **Profile Information**:
    - Name, Employee ID, Phone, Email, Photo
    - Subjects taught, Grades handled
    - Bio (max 500 characters)
    - Edit button for non-ID fields
  - **Qualifications**:
    - Add/edit qualifications: Degree, Institution, Year
    - Upload certificates (PDF/images)
  - **Notification Preferences**:
    - Push notifications (ON/OFF)
    - Email notifications (ON/OFF)
    - SMS notifications (ON/OFF)
    - Notification types: Student messages, Exam submissions, Admin announcements
  - **Change Password**: Old password + new password + confirm
  - **Logout**: Confirm dialog before logout
- **Acceptance Criteria**:
  - Profile updates save within 2 seconds
  - Certificate uploads support PDF, JPG, PNG up to 5MB
  - Password change requires old password verification
  - Logout clears session data

---

#### FR-015: Student and Attendance Management

**FR-015.1 Student List View**
- **Priority**: HIGH
- **Description**: Internal teachers SHALL view and manage students enrolled in their classes
- **Requirements**:
  - **Student List** grouped by Grade/Class:
    - Student Name, Photo, Student ID, Phone, Email
    - Enrollment Status: Active, Inactive, Suspended
    - Payment Status: Paid, Unpaid, Partial (visual indicator: green/red/yellow)
    - Filter by: Grade, Class, Payment Status, Enrollment Status
    - Search by: Name, Student ID, Phone
    - Sort by: Name (A-Z), Enrollment Date, Payment Status
  - **Student Detail View**:
    - Tap student to view: Full profile, Attendance history, Exam scores, Payment history, Face ID verification status
    - Actions: Send message, View attendance, View exam results
  - **Bulk Actions**:
    - Select multiple students
    - Send bulk notification
    - Export to CSV/Excel
- **Acceptance Criteria**:
  - List loads within 3 seconds for up to 500 students
  - Filters and search return results within 1 second
  - Export generates file within 10 seconds
  - Student detail view shows complete history

**FR-015.2 Attendance Tracking**
- **Priority**: HIGH
- **Description**: Internal teachers SHALL track student attendance during live classes with participation scoring
- **Requirements**:
  - **During Live Class**:
    - Attendance auto-marked when student joins (Present)
    - Manual override: Mark Present/Absent/Late
    - Late threshold: Joining >15 minutes after start
    - Attendance list shows: Student name, Join time, Status
  - **Participation Tracking**:
    - Teacher can "Ask Question" button during class
    - System selects random student and displays name/photo to teacher
    - Teacher marks: Answered Correctly (+5 points), Answered Incorrectly (+2 points for trying), No Response (0 points)
    - **Skip Rule**: If student gives "No Response" 2 consecutive times, system skips them for rest of class
    - Participation points accumulate throughout session
  - **Monthly Awards**:
    - At month-end, system calculates top 3 students by participation points per class
    - Teacher reviews and confirms awards
    - Awards displayed on student home screen: Gold (1st), Silver (2nd), Bronze (3rd) badges
    - Push notification sent to award winners
  - **Post-Class**:
    - Attendance summary: Total Present, Absent, Late
    - Edit attendance within 24 hours of class end
    - Participation points visible in student detail view
  - **Attendance Reports**:
    - Generate attendance report by: Date range, Class, Student
    - Export to PDF/Excel
    - Include: Student name, Total classes, Present, Absent, Late, Attendance %
- **Acceptance Criteria**:
  - Attendance auto-marks within 5 seconds of student join
  - Participation points update in real-time
  - "Skip" rule applied correctly after 2 no-responses
  - Monthly awards calculated accurately on 1st of each month
  - Attendance editable for 24 hours post-class
  - Reports generate within 10 seconds

---

#### FR-016: Exam Creation and Management

**FR-016.1 Exam Setup**
- **Priority**: HIGH
- **Description**: Internal teachers SHALL create comprehensive exams with multiple question types and flexible configurations
- **Requirements**:
  - **Exam Basic Info**:
    - Exam Name, Subject, Grade, Total Marks
    - Exam Type: Full Online, Half Online/Half Upload, Full Upload (FR-007.3)
    - Start Date/Time, End Date/Time (window)
    - Duration: Exam time limit in minutes
    - Passing Marks (percentage or absolute)
  - **Question Types Supported**:
    - Multiple Choice (single answer)
    - Multiple Select (multiple correct answers)
    - True/False
    - Fill in the Blanks
    - Short Answer (text input, max 500 characters)
    - Essay (text input, max 5000 characters)
    - **Arrange in Order**: Students drag-drop items to correct sequence
    - **Structure Questions**: Students organize elements (e.g., essay structure, code structure)
    - File Upload (images, PDFs for diagrams/calculations)
  - **Question Configuration**:
    - Question Text (rich text editor supporting images, formulas)
    - Marks per question
    - Options (for MCQ/Multiple Select): Add/Remove options, Mark correct answer(s)
    - Correct Answer (for Fill in Blanks, Short Answer) - Optional for manual marking
    - Explanation: Post-exam explanation text (shown with results)
    - Attachments: Upload images, diagrams, PDFs with question
  - **Exam Settings**:
    - Randomize Questions: YES/NO
    - Randomize Options: YES/NO (for MCQ)
    - Allow Review: Students can review answers before submit
    - Show Results Immediately: YES/NO (if NO, teacher publishes manually)
    - Negative Marking: Enable/Disable, Marks to deduct per wrong answer
    - Calculator Allowed: YES/NO
    - Formula Sheet Allowed: Upload PDF formula sheet accessible during exam
  - **Save Options**:
    - Save as Draft: Not visible to students
    - Publish: Visible to students, admin approval required (FR-007.1)
- **Acceptance Criteria**:
  - Exam creation wizard completes in <10 steps
  - All 9 question types supported
  - Rich text editor supports images (<5MB) and KaTeX formulas
  - Draft saved every 30 seconds auto-save
  - Published exam sent to admin approval queue
  - Cannot edit published exam (must create new version)

**FR-016.2 Question Bank**
- **Priority**: MEDIUM
- **Description**: Internal teachers SHALL maintain reusable question banks organized by subject and topic
- **Requirements**:
  - **Question Bank Structure**:
    - Organized by: Subject â†’ Grade â†’ Topic â†’ Difficulty (Easy/Medium/Hard)
  - **Add to Bank**:
    - Save questions from exam creation to bank
    - Bulk import from Excel template
    - Tag questions: Topic, Difficulty, Keywords
  - **Reuse Questions**:
    - Browse bank by filters during exam creation
    - Preview question before adding
    - "Add to Exam" button
    - Modify question before adding (creates copy, doesn't alter bank original)
  - **Bank Management**:
    - Edit questions in bank
    - Delete questions (confirmation required)
    - Duplicate questions
    - Export bank to Excel
- **Acceptance Criteria**:
  - Bank supports 10,000+ questions per teacher
  - Search returns results within 2 seconds
  - Excel import validates format and shows errors
  - Modifying bank question doesn't affect existing exams

---

#### FR-017: Live Exam Monitoring

**FR-017.1 Real-Time Monitoring Dashboard**
- **Priority**: HIGH
- **Description**: Internal teachers SHALL monitor ongoing exams in real-time with student status tracking and AI alerts
- **Requirements**:
  - **Monitoring Dashboard** (during exam window):
    - **Student List** with columns:
      - Student Name, Photo
      - Status: Not Started, In Progress, Submitted, Time Out
      - Start Time, Time Remaining
      - Questions Answered / Total Questions
      - AI Alert Count (malpractice flags from FR-007.6)
    - **Filters**: All Students, In Progress, Not Started, Submitted, Flagged by AI
    - **Sort**: By Name, Time Remaining, Alert Count
  - **Live Updates**:
    - Dashboard refreshes every 10 seconds
    - Visual/sound alert when student flagged by AI
    - Alert types: Multiple faces, No face, Looking away, Tab switch, Screenshot attempt
  - **Individual Student View**:
    - Tap student to see:
      - Live camera feed (if face verification enabled for internal students)
      - Current question number
      - Time spent per question
      - AI alert history with timestamps and snapshots
      - Option to send warning message to student
  - **Actions**:
    - **Broadcast Message**: Send message to all students during exam
    - **Extend Time**: Add extra time for specific student (e.g., technical issue)
    - **Force Submit**: Manually submit exam for student (with confirmation)
    - **Flag for Review**: Mark student for post-exam investigation
  - **Export Report**:
    - Post-exam monitoring report: Student name, Start time, End time, Duration, AI alerts, Status
    - PDF export
- **Acceptance Criteria**:
  - Dashboard loads within 3 seconds for up to 500 concurrent students
  - AI alerts appear within 15 seconds of detection
  - Live camera feed (if enabled) streams with <2 second latency
  - Broadcast message delivered to all students within 10 seconds
  - Time extensions apply immediately

---

#### FR-018: Exam Marking and Results

**FR-018.1 Question-Wise Marking Workflow**
- **Priority**: HIGH
- **Description**: Internal teachers SHALL mark exams question-by-question across all students for consistency and efficiency
- **Requirements**:
  - **Marking Interface**:
    - After exam window closes, teacher sees "Mark Exam" button
    - Marking organized by **Question Number** (not by student):
      - Select Question 1 â†’ See all students' answers to Question 1
      - Select Question 2 â†’ See all students' answers to Question 2
      - Continue until all questions marked
  - **Question-Wise View**:
    - Display: Question text, Marks allocated, Question type
    - **Student Answer List**:
      - Student Name, Answer (text/file/selection), Marks input field, Save button
      - For auto-gradable questions (MCQ, True/False, Arrange in Order): Marks auto-calculated, display "Auto-Graded" badge
      - For manual questions (Essay, Short Answer, Structure Questions, File Upload): Empty marks field for teacher input
    - **Bulk Marking** (optional):
      - Assign same marks to multiple students (e.g., all correct essays get 10/10)
  - **Marking Features**:
    - Add feedback comments per student answer (optional)
    - Flag answer for review (bookmark)
    - Skip answer (mark as "To Review Later")
    - Progress indicator: X / Y students marked for this question
  - **Marking Status**:
    - Saved as draft (partial marking)
    - Complete marking (all questions, all students marked)
    - Publish results (triggers FR-018.2)
  - **Navigation**:
    - Previous/Next Question buttons
    - Jump to specific question number
    - Filter: All Students, Marked, Unmarked, Flagged
- **Acceptance Criteria**:
  - Question-wise view groups all student answers correctly
  - Auto-grading calculates marks accurately for MCQ/True-False/Arrange
  - Manual marks save within 1 second per student
  - Progress indicator updates in real-time
  - Cannot publish results until all students marked for all questions
  - Feedback comments display in student result view

**FR-018.2 Result Publication**
- **Priority**: HIGH
- **Description**: Internal teachers SHALL publish exam results with detailed breakdowns and analytics
- **Requirements**:
  - **Result Summary**:
    - Total students appeared, Average score, Highest score, Lowest score
    - Pass percentage, Grade distribution (A/B/C/D/F)
    - Question-wise analytics: Average marks per question, Difficulty assessment (if <50% correct, flag as hard)
  - **Publish Action**:
    - After completing FR-018.1, teacher clicks "Publish Results"
    - Confirmation dialog: "Publish results for [EXAM NAME]? This will notify all students."
    - Upon publish:
      - Results visible to students (FR-007.7)
      - Push notification sent: "Results published for [EXAM NAME]"
      - Email sent with result summary
      - Results appear in student home screen
  - **Result Visibility Window**: 7 days (FR-007.7)
  - **Post-Publication**:
    - Teacher can view result analytics dashboard
    - Cannot edit marks after publication (must unpublish, edit, republish)
  - **Rank Calculation**:
    - Auto-calculate ranks: Rank 1, Rank 2, etc. based on total marks
    - Tied students get same rank (e.g., two students at Rank 1, next is Rank 3)
    - Ranks displayed in student result view (FR-007.7)
- **Acceptance Criteria**:
  - Publish triggers within 5 seconds
  - All students receive notification within 2 minutes
  - Result analytics dashboard shows accurate statistics
  - Ranks calculated correctly with tie-handling
  - Results visible to students immediately after publication
  - 7-day auto-hide implemented

---

#### FR-019: Content Management

**FR-019.1 Study Materials Upload**
- **Priority**: MEDIUM
- **Description**: Internal teachers SHALL upload and organize study materials (notes, recordings, publications) for students
- **Requirements**:
  - **Notes Upload** (FR-009.1):
    - Upload PDF, DOCX, images (up to 50MB)
    - Assign to: Class, Subject, Topic
    - Set visibility: All students, Specific grade, Specific class
    - Optional: Set download start date
    - Visible to students for 7 days, then hidden (FR-009.1)
  - **Class Recordings Upload** (FR-009.2):
    - Auto-recorded during live class (if enabled)
    - Manual upload option (MP4, MKV up to 500MB)
    - Assign to class, subject
    - Visible for 7 days
    - Auto-delete after 30 days (FR-009.2)
  - **Publications** (FR-010):
    - Upload PDF, DOCX (up to 100MB)
    - Publication details: Title, Description, Cover image, Author(s), Price (Free or Paid)
    - Set visibility: All users (public seminar) OR Internal students only
    - Admin approval required for publication (FR-010.2)
  - **Content Library**:
    - View all uploaded content: Notes, Recordings, Publications
    - Filter by: Type, Subject, Grade, Date uploaded
    - Edit metadata (title, description, visibility)
    - Delete content (confirmation required, logs action)
    - Download analytics: View count, Download count per material
- **Acceptance Criteria**:
  - File uploads complete within 2 minutes for 50MB files
  - Visibility rules applied correctly (7-day notes, 30-day recordings)
  - Admin approval queue triggered for publications
  - Download analytics update in real-time
  - Deleted content removed from student view immediately

**FR-019.2 Announcement Posting**
- **Priority**: MEDIUM
- **Description**: Internal teachers SHALL post announcements to students with priority levels and scheduling
- **Requirements**:
  - **Announcement Creation**:
    - Title (max 100 characters)
    - Message (rich text, max 2000 characters)
    - Attachments: Images, PDFs (up to 10MB)
    - Target Audience: All students, Specific grade, Specific class, Individual students
    - Priority: High (red banner), Medium (yellow banner), Low (default)
    - Schedule: Post immediately OR Schedule for future date/time
  - **Announcement Display**:
    - High priority: Top of student home screen with red banner, push notification
    - Medium priority: Announcement section, push notification
    - Low priority: Announcement section, no push
  - **Announcement Management**:
    - View all posted announcements
    - Edit scheduled announcements (before posting)
    - Delete announcements (confirmation required)
    - View read receipts: Who read, who didn't read
  - **Expiration**:
    - Announcements auto-hide after 30 days
    - Teacher can manually set expiration date (e.g., "Valid until exam date")
- **Acceptance Criteria**:
  - High-priority announcements trigger push notification within 1 minute
  - Scheduled announcements post at exact scheduled time
  - Read receipts update within 30 seconds of student viewing
  - Expired announcements hidden from student view but accessible in teacher archive

---

### 4.5 External Teacher Requirements (Mutual Transfer)

#### FR-020: External Teacher Registration and Validation

**FR-020.1 Profile Creation**
- **Priority**: HIGH
- **Description**: External teachers SHALL register with comprehensive profile information for mutual transfer system
- **Requirements**:
  - **Registration Form**:
    - Personal: Name, Phone, Email, Photo
    - Professional: Current School, Teaching Subjects, Grades taught, Years of experience
    - Qualifications: Degrees, Certifications (upload PDFs)
    - Desired Transfer: Preferred schools (up to 5), Preferred districts, Reason for transfer (optional, max 500 characters)
  - **Verification**:
    - Email verification (OTP)
    - Phone verification (SMS OTP)
    - Upload: Government ID (NIC), Teaching License, Latest employment letter
  - **Admin Approval Required** (FR-020.2)
  - **Status**:
    - Pending Verification (after registration)
    - Verified (after admin approves documents)
    - Rejected (if documents invalid, with reason)
- **Acceptance Criteria**:
  - Registration form validates all required fields
  - Email/Phone OTP sent within 30 seconds
  - Documents upload successfully (PDF/images, up to 5MB each)
  - Status changes notify teacher via email and push notification
  - Rejected teachers can edit and resubmit

**FR-020.2 Admin Approval for External Teachers**
- **Priority**: HIGH
- **Description**: Administrators SHALL review and approve external teacher registrations before allowing access to mutual transfer features
- **Requirements**:
  - Admin sees "Pending External Teacher Approvals" queue
  - Review interface shows: Teacher profile, Uploaded documents (NIC, license, employment letter), Verification status
  - Actions: Approve, Reject (with reason), Request More Info
  - Upon approval:
    - Teacher status changes to "Verified"
    - Teacher gains access to mutual transfer features (FR-021 onwards)
    - Push notification sent: "Your profile has been approved"
  - Upon rejection:
    - Teacher notified with rejection reason
    - Profile locked until resubmission
- **Acceptance Criteria**:
  - Approval queue updates in real-time
  - Approved teachers gain access within 1 minute
  - Rejection reasons delivered immediately
  - Audit log records admin decision

---

#### FR-021: Transfer Request Publication

**FR-021.1 Create Transfer Request**
- **Priority**: HIGH
- **Description**: Verified external teachers SHALL publish transfer requests with limited initial information, requiring admin approval before becoming searchable
- **Requirements**:
  - **Request Form**:
    - Current School District
    - Desired School District
    - Teaching Subjects
    - Grades willing to teach
    - Preferred transfer reasons (dropdown + optional text)
    - **Initially Hidden Info** (revealed in stages per FR-023):
      - Teacher name
      - Current school name
      - Contact details
  - **Draft/Publish**:
    - Save as draft (editable, not visible to others)
    - Publish request (requires admin approval per FR-021.2)
  - **Request Status**:
    - Draft (editable)
    - Pending Approval (submitted to admin, not searchable yet)
    - Active (approved by admin, searchable by other teachers per FR-022)
    - Paused (teacher temporarily hides request)
    - Closed (transfer completed or cancelled)
- **Acceptance Criteria**:
  - Request form validates required fields
  - Draft auto-saves every 30 seconds
  - Published request enters admin approval queue
  - Cannot be searchable until admin approves
  - Status changes notify teacher

**FR-021.2 Admin Approval for Transfer Request Publication**
- **Priority**: HIGH
- **Description**: Administrators SHALL review and approve transfer requests before they become searchable to prevent spam or inappropriate content
- **Requirements**:
  - Admin sees "Pending Transfer Request Approvals" queue
  - Review shows: Teacher profile, Request details, Verification status
  - Actions: Approve (request becomes Active and searchable), Reject (with reason), Request Edit
  - Upon approval:
    - Request status changes to "Active"
    - Becomes searchable in FR-022
    - Push notification sent to teacher: "Your transfer request is now active"
  - Upon rejection:
    - Request remains Pending
    - Teacher notified with reason
    - Teacher can edit and resubmit
- **Acceptance Criteria**:
  - Approval queue updates in real-time
  - Approved requests become searchable within 1 minute
  - Rejection reasons sent immediately
  - Audit log records approval/rejection

---

#### FR-022: Transfer Request Search and Discovery

**FR-022.1 Browse Transfer Requests**
- **Priority**: HIGH
- **Description**: Verified external teachers SHALL search for mutual transfer opportunities with advanced filters
- **Requirements**:
  - **Search Interface**:
    - Default view: All active transfer requests (excluding own requests)
    - **Filters**:
      - Current District (where teacher is now)
      - Desired District (where teacher wants to transfer)
      - Subjects
      - Grades
      - Years of experience
      - Posted within: Last 7 days, Last 30 days, Last 3 months, All time
    - **Sort**:
      - Newest first (default)
      - Best match (algorithm considers district overlap, subject match)
      - Most experienced teachers first
  - **Request Card Display** (Stage 1 - Limited Info per FR-023.1):
    - Displayed: Current District, Desired District, Subjects, Grades, Experience years, "Posted X days ago"
    - Hidden: Teacher name, Current school name, Contact details
    - "View Details" button
  - **Saved Searches**:
    - Save filter combinations
    - Receive notification when new requests match saved criteria
- **Acceptance Criteria**:
  - Search returns results within 2 seconds for up to 1000 requests
  - Filters work accurately
  - Best match algorithm scores based on district/subject alignment
  - Saved search notifications sent within 5 minutes of new match

---

#### FR-023: Transfer Request Interaction

**FR-023.1 Three-Stage Information Disclosure**
- **Priority**: HIGH
- **Description**: Transfer requests SHALL reveal information progressively to protect teacher privacy
- **Requirements**:
  - **Stage 1: Public Listing** (FR-022):
    - Visible to all verified external teachers
    - Shows: Current District, Desired District, Subjects, Grades, Experience years
    - Hides: Teacher name, Current school name, Contact details
  - **Stage 2: After Receiver Sends Request** (FR-023.2):
    - Requesting teacher (receiver) sees full profile of request owner (sender):
      - Name, Current school, Email, Phone
    - Sender still sees limited info of receiver:
      - Only: "Someone from [District] is interested in your request"
  - **Stage 3: After Sender Accepts Request** (FR-023.3):
    - Both teachers see full profiles of each other:
      - Name, Current school, Email, Phone, Photo
    - Peer-to-peer chat unlocked (FR-023.4)
- **Acceptance Criteria**:
  - Information disclosure follows exact stage progression
  - No data leak before appropriate stage
  - Profile visibility rules enforced in API and UI
  - Audit log records each disclosure stage transition

**FR-023.2 Send Transfer Interest**
- **Priority**: HIGH
- **Description**: External teachers SHALL express interest in transfer requests with optional introduction message
- **Requirements**:
  - "Interested" button on request detail view
  - **Interest Form**:
    - Requester's current district (auto-filled)
    - Requester's current school (auto-filled)
    - Introduction message (optional, max 500 characters)
    - "Why this transfer works for both of us" (optional, max 500 characters)
  - Upon sending:
    - Request owner (sender) receives notification: "Someone from [District] is interested in your transfer request"
    - Requester (receiver) sees sender's full profile immediately (Stage 2)
    - Sender sees limited info: District of requester
    - Interest appears in sender's "Received Interests" list (FR-023.3)
  - **Multiple Requests Support**:
    - One teacher's request can receive interests from multiple teachers
    - Sender can accept multiple interests (e.g., Teacher A's request accepted by Teachers B, C, and D all simultaneously)
    - All accepted teachers proceed to Stage 3 independently
- **Acceptance Criteria**:
  - Interest sent within 2 seconds
  - Notification delivered within 30 seconds
  - Receiver sees full sender profile immediately
  - Sender sees limited receiver info until acceptance
  - Multiple interests tracked independently

**FR-023.3 Manage Received Interests**
- **Priority**: HIGH
- **Description**: External teachers SHALL review and respond to interests received on their transfer requests, with support for accepting multiple interests
- **Requirements**:
  - **"Received Interests" List**:
    - Shows: Requester's district, Introduction message, Date received
    - Actions per interest: View Full Profile (transitions to Stage 2 for sender to see receiver's full profile even before acceptance), Accept, Reject, Mark as Spam
  - **Accept Interest**:
    - Confirmation dialog: "Accept interest from [Teacher Name]? This will share your full contact details."
    - Upon accept:
      - Both teachers transition to Stage 3 (full profile visibility)
      - Push notification sent to requester: "Your interest in [Sender Name]'s transfer request was accepted!"
      - Peer-to-peer chat unlocked (FR-023.4)
      - Interest status: Accepted
    - **Multiple Acceptances**: Teacher can accept interests from multiple teachers - all accepted teachers gain full profile access and chat independently
  - **Reject Interest**:
    - Confirmation dialog: "Reject interest from [District]?"
    - Requester notified: "Your interest was not accepted"
    - Interest archived
  - **Mark as Spam**:
    - Interest hidden from sender's view
    - Admin notified for review (potential account suspension)
- **Acceptance Criteria**:
  - Accept transitions both teachers to Stage 3 within 5 seconds
  - Notifications sent within 30 seconds
  - Multiple acceptances work independently (no conflicts)
  - Each accepted teacher gets separate chat thread
  - Rejected interests archived but recoverable
  - Spam reports logged and reviewed by admin

**FR-023.4 Peer-to-Peer Chat (Post-Acceptance)**
- **Priority**: MEDIUM
- **Description**: External teachers SHALL chat directly after mutual interest acceptance to discuss transfer logistics
- **Requirements**:
  - Chat unlocked only after sender accepts receiver's interest (Stage 3)
  - **Chat Interface**:
    - Real-time messaging (WebSocket)
    - Text messages (max 2000 characters)
    - File sharing: Images, PDFs (up to 10MB)
    - Typing indicator
    - Read receipts
    - Message history (unlimited retention)
  - **Chat Features**:
    - Search messages
    - Delete own messages (within 1 hour of sending)
    - Report inappropriate messages to admin
    - Block user (hides chat, prevents further messages)
  - **Moderation**:
    - No admin pre-approval required (unlike FR-004.1 internal chat)
    - Teachers can report messages â†’ Admin reviews
    - Admin can suspend chat if terms violated
- **Acceptance Criteria**:
  - Chat unlocks immediately after acceptance
  - Messages delivered within 2 seconds
  - File uploads complete within 1 minute for 10MB files
  - Read receipts update in real-time
  - Blocked users cannot send further messages

---

#### FR-024: Transfer Request Lifecycle Management

**FR-024.1 Edit and Pause Requests**
- **Priority**: MEDIUM
- **Description**: External teachers SHALL edit or pause their active transfer requests
- **Requirements**:
  - **Edit Request**:
    - Only possible if request status is Active or Paused
    - Cannot edit if interests already received (to prevent bait-and-switch)
    - Editable fields: Desired district, Subjects, Grades, Transfer reasons
    - After edit, request remains Active
  - **Pause Request**:
    - Temporarily hide request from search
    - Paused requests:
      - Not visible in FR-022 search
      - Existing interests preserved
      - Can unpause anytime â†’ Request becomes Active again
    - Use case: Teacher wants temporary break from receiving interests
  - **Unpause Request**:
    - Restores request to Active status
    - Becomes searchable again
    - Preserves all existing interests and chat history
- **Acceptance Criteria**:
  - Edit saves within 2 seconds
  - Paused requests disappear from search within 1 minute
  - Unpause restores searchability within 1 minute
  - Cannot edit requests with existing interests

**FR-024.2 Close or Delete Requests**
- **Priority**: MEDIUM
- **Description**: External teachers SHALL close completed transfers or delete requests
- **Requirements**:
  - **Close Request**:
    - Mark transfer as completed (successfully transferred) or cancelled (no longer seeking transfer)
    - Closed requests:
      - Not visible in search
      - Interests archived (read-only)
      - Chats remain accessible (read-only)
    - Confirmation dialog: "Close request? This action cannot be undone."
  - **Delete Request**:
    - Permanently remove request
    - Requires confirmation: "Delete request? This will remove all interests and chat history."
    - Only possible if no accepted interests (if accepted, must close instead)
    - Deletes: Request, Draft interests (not accepted), Unaccepted chats
    - Preserves: Accepted interests and chats (for both parties' reference)
  - **Request History**:
    - View all past requests (Closed, Deleted)
    - Cannot reopen closed/deleted requests (must create new)
- **Acceptance Criteria**:
  - Close removes from search within 1 minute
  - Delete confirmation prevents accidental removal
  - Cannot delete requests with accepted interests
  - Request history accessible indefinitely

---

### 4.6 Administrator Requirements

#### FR-025: User Management and Provisioning

**FR-025.1 Internal Student Provisioning**
- **Priority**: HIGH
- **Description**: Administrators SHALL create and manage internal student accounts with Face ID verification
- **Requirements**:
  - **Bulk Student Creation**:
    - Upload Excel template: Student Name, Grade, Class, Phone, Parent Phone, Email (optional)
    - System generates: Unique Student ID, Default password (institution-defined format)
    - Export generated credentials to Excel (for distribution)
  - **Individual Student Creation**:
    - Manual form: Name, Grade, Class, Phone, Parent Phone, Email, Password
    - System assigns Student ID
  - **Face ID Verification Queue** (FR-001.2):
    - View students pending Face ID verification
    - Review uploaded Face ID videos (3-angle view)
    - Actions: Approve (grants access), Reject (with reason: unclear video, multiple faces, etc.), Request Re-upload
    - Upon approval:
      - Face ID stored in database
      - Student notified: "Face ID approved, you can now attend classes"
    - Upon rejection:
      - Student notified with rejection reason
      - Must re-upload Face ID video
  - **Student Account Management**:
    - View all students: Filter by Grade, Class, Status (Active/Inactive/Suspended)
    - Edit student: Name, Phone, Email, Class (cannot edit Student ID)
    - Deactivate account (soft delete, reversible)
    - Reset password
    - Delete account (hard delete, confirmation required)
- **Acceptance Criteria**:
  - Bulk upload processes 500 students within 2 minutes
  - Face ID videos playable in browser
  - Approval status updates within 5 seconds
  - Password reset email sent within 1 minute

**FR-025.2 Teacher Provisioning**
- **Priority**: HIGH
- **Description**: Administrators SHALL create and manage internal teacher accounts
- **Requirements**:
  - **Teacher Creation**:
    - Manual form: Name, Employee ID, Phone, Email, Password, Subjects, Grades
    - System assigns Teacher ID
  - **Teacher Account Management**:
    - View all teachers: Filter by Subject, Status
    - Edit teacher: Name, Phone, Email, Subjects, Grades (cannot edit Employee ID)
    - Deactivate/Reactivate account
    - Reset password
    - Delete account (confirmation required)
  - **No Face ID Required**: Teachers do not undergo Face ID capture (only students)
- **Acceptance Criteria**:
  - Teacher creation completes within 5 seconds
  - Email sent with credentials
  - Cannot create duplicate Employee ID
  - Password reset works correctly

---

#### FR-026: Timetable and Class Scheduling

**FR-026.1 Timetable Creation**
- **Priority**: HIGH
- **Description**: Administrators SHALL create and manage one-year timetables for all classes
- **Requirements**:
  - **Timetable Interface**:
    - Select: Year (current year or next year), Grade, Class
    - Grid view: Days (columns) Ã— Time Slots (rows)
    - Add class: Subject, Teacher, Time, Duration, Recurring (Yes/No)
  - **Recurring Classes**:
    - Weekly recurrence: Every Monday at 8:00 AM
    - End date: One year from start date
    - Exception dates: Skip specific dates (holidays, exam days)
  - **One-Off Classes**:
    - Single-date classes (e.g., special lectures, makeup classes)
  - **Timetable Rules**:
    - No teacher double-booking (validation alert)
    - No class double-booking (same classroom, same time)
    - Maximum 8 classes per day per grade (configurable)
  - **Publish Timetable**:
    - Draft mode: Editable, not visible to students/teachers
    - Published mode: Visible to students/teachers, read-only (must unpublish to edit)
  - **Export**:
    - Export timetable to PDF (by Grade, Class, or Teacher)
    - Export to Excel for printing
- **Acceptance Criteria**:
  - Timetable grid loads within 3 seconds
  - Validation prevents double-booking
  - Published timetables visible to students within 1 minute
  - Export generates files within 10 seconds

---

#### FR-027: Payment and Access Management

**FR-027.1 Payment Tracker Dashboard**
- **Priority**: HIGH
- **Description**: Administrators SHALL monitor student payments via Tracker Plus integration and manage access restrictions
- **Requirements**:
  - **Payment Dashboard**:
    - Display 150 most recent payments (FR-008.1)
    - Columns: Student Name, Student ID, Amount, Date, Status (Paid/Pending/Failed), Transaction ID (Tracker Plus)
    - Hide payments older than 1 month (FR-008.1)
    - Filter by: Grade, Class, Status, Date range
    - Search by: Student Name, Student ID, Transaction ID
  - **Payment Details**:
    - Tap payment to view: Student profile, Payment method, Receipt (PDF), Tracker Plus transaction details
    - Download receipt
  - **Manual Payment Entry**:
    - For bank slip payments (FR-008.2):
      - Upload slip image
      - Enter: Student ID, Amount, Date, Reference number
      - Status: Pending verification
    - Verification actions: Approve (marks as Paid), Reject (with reason)
  - **Access Management**:
    - View students with unpaid fees
    - Bulk actions: Send payment reminder (SMS/Email/Push), Restrict access (locks classes/exams per FR-008.3)
  - **Temporary Access Override**:
    - Grant temporary access for unpaid students (FR-008.3)
    - Specify: Duration (days), Reason
    - Auto-revokes after duration expires
    - Log all overrides for audit
- **Acceptance Criteria**:
  - Dashboard loads within 3 seconds for 150 payments
  - Tracker Plus integration fetches transaction status in real-time
  - Manual payment approval updates access within 1 minute
  - Temporary access expires automatically on schedule
  - Payment reminders sent within 5 minutes

---

#### FR-028: Exam Oversight and Approval

**FR-028.1 Exam Approval Queue**
- **Priority**: HIGH
- **Description**: Administrators SHALL review and approve teacher-created exams before publication to students (FR-007.1, FR-016.1)
- **Requirements**:
  - **Approval Queue**:
    - List: Exam Name, Subject, Grade, Teacher Name, Created Date, Status (Pending/Approved/Rejected)
    - Filter by: Subject, Grade, Teacher, Date
  - **Exam Review**:
    - View full exam: Questions, Options, Marks, Settings (duration, randomization, etc.)
    - Preview as student would see it
    - Check for: Clarity, correctness, appropriate difficulty, no errors
  - **Actions**:
    - Approve: Exam published to students immediately (FR-007.1)
    - Reject: Exam returns to teacher as Draft with rejection reason
    - Request Edit: Admin comments on specific questions, teacher must revise
  - **Approval Notifications**:
    - Teacher notified via push/email upon approval/rejection
    - Students notified when exam published (if within window)
- **Acceptance Criteria**:
  - Queue updates in real-time as teachers submit exams
  - Preview renders exam correctly
  - Approval publishes exam within 1 minute
  - Rejection reasons delivered immediately

---

#### FR-029: Chat Moderation

**FR-029.1 Chat Approval Queue (Internal Teacher-Student)**
- **Priority**: HIGH
- **Description**: Administrators SHALL review and approve chat messages between internal teachers and students before delivery (FR-004.1)
- **Requirements**:
  - **Moderation Queue**:
    - List: Sender Name, Recipient Name, Message Preview (first 100 characters), Sent Date, Status (Pending/Approved/Rejected)
    - Filter by: Sender type (Teacher/Student), Date, Status
  - **Message Review**:
    - View full message text
    - View attachments (images, PDFs)
    - View conversation history (context)
  - **Actions**:
    - Approve: Message delivered to recipient
    - Reject: Message not delivered, sender notified with reason
    - Flag: Mark for further review (e.g., inappropriate language, harassment)
  - **Auto-Approval Rules** (optional, configurable):
    - After X approved messages from same teacher, auto-approve future messages
    - Keyword filters: Auto-reject messages with blacklisted words
  - **Audit Log**:
    - Record all moderation actions: Admin name, Action (Approve/Reject/Flag), Timestamp
- **Acceptance Criteria**:
  - Queue updates in real-time as messages sent
  - Approved messages delivered within 30 seconds
  - Rejected senders notified immediately
  - Auto-approval rules configurable by admin

---

#### FR-030: Multi-Institution Management

**FR-030.1 Institution Configuration**
- **Priority**: MEDIUM
- **Description**: System SHALL support multiple institutions with isolated data and configurations
- **Requirements**:
  - **Institution Setup**:
    - Institution Name: "Pulamai Viththakan" (default)
    - Institution Code: Unique identifier for login (FR-001.1)
    - Logo, Banner image
    - Contact: Phone, Email, Address, WhatsApp business number
    - Branding: Primary color, Secondary color (for app theming)
  - **Multi-Institution Support**:
    - Each institution has isolated: Students, Teachers, Classes, Exams, Payments
    - Super Admin can manage multiple institutions
    - Institution Admins manage only their institution
  - **Switching Institutions** (Super Admin only):
    - Dropdown to select active institution
    - Dashboard updates to show selected institution's data
  - **Institution Settings**:
    - Academic year start/end dates
    - Payment due dates
    - Exam policies: Face ID required (Yes/No), AI monitoring sensitivity (Low/Medium/High)
    - Notification settings: SMS provider, Email provider, Push notification keys
- **Acceptance Criteria**:
  - Institution Code uniquely identifies institution
  - Data isolation enforced (no cross-institution data leaks)
  - Super Admin can switch institutions within 2 seconds
  - Branding applied to mobile app for each institution

---

## 5. Non-Functional Requirements

### 5.1 Security Requirements

**NFR-001: Authentication and Authorization**
- **Priority**: HIGH
- **Description**: System SHALL enforce role-based access control (RBAC) with secure authentication
- **Requirements**:
  - Multi-factor authentication (MFA) optional for admins
  - JWT tokens with 1-hour expiration, refresh tokens with 7-day expiration
  - Password requirements: Min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  - Account lockout after 5 failed login attempts for 15 minutes
  - Session management: Logout invalidates all tokens
  - Multi-session support with session limit (max 3 concurrent devices per user)
- **Acceptance Criteria**:
  - OWASP Top 10 vulnerabilities mitigated
  - Penetration testing pass before production deployment
  - All API endpoints protected with authentication middleware

**NFR-002: Data Encryption**
- **Priority**: HIGH
- **Description**: Sensitive data SHALL be encrypted at rest and in transit
- **Requirements**:
  - HTTPS/TLS 1.3 for all communications
  - Database encryption: AES-256 for sensitive fields (passwords, Face ID data, payment info)
  - File storage encryption for uploaded documents, recordings, Face ID videos
  - No sensitive data in logs or error messages
- **Acceptance Criteria**:
  - SSL Labs A+ rating for HTTPS configuration
  - Database encryption verified via compliance audit
  - PCI DSS compliance for payment data handling

**NFR-003: Face ID Data Protection**
- **Priority**: HIGH
- **Description**: Biometric Face ID data SHALL be stored securely with strict access controls
- **Requirements**:
  - Face ID videos encrypted at rest
  - Access restricted to: Admin (for verification), AI system (for recognition), Student owner
  - Face ID data never transmitted to third parties
  - Automatic deletion upon student account termination (with 90-day retention for legal compliance)
  - Audit log for all Face ID data access
- **Acceptance Criteria**:
  - GDPR and CCPA compliance for biometric data
  - Access logs immutable and auditable
  - Data retention policy enforced automatically

---

### 5.2 Performance Requirements

**NFR-004: Response Time**
- **Priority**: HIGH
- **Description**: System SHALL respond to user actions within acceptable time limits
- **Requirements**:
  - **API Response Time**:
    - Read operations: <500ms (95th percentile)
    - Write operations: <1 second (95th percentile)
    - Search operations: <2 seconds (95th percentile)
  - **Page Load Time**:
    - Web app initial load: <3 seconds
    - Mobile app initial load: <2 seconds
    - Subsequent navigation: <1 second
  - **Video Streaming**:
    - Live class stream latency: <2 seconds
    - Recorded video buffering: <3 seconds to start playback
- **Acceptance Criteria**:
  - Performance testing validates 95th percentile targets
  - Load testing with 500 concurrent users shows no degradation
  - Monitoring alerts trigger if response times exceed thresholds

**NFR-005: Scalability**
- **Priority**: MEDIUM
- **Description**: System SHALL scale to support growing user base and concurrent activities
- **Requirements**:
  - Support 10,000 registered users (5,000 students, 200 teachers, 4,800 external teachers)
  - Support 500 concurrent live class participants
  - Support 1,000 concurrent exam takers
  - Horizontal scaling for backend services (stateless design)
  - Database read replicas for high-read operations
  - CDN for static assets (images, videos, publications)
- **Acceptance Criteria**:
  - Load testing with 1,000 concurrent exams passes without errors
  - Auto-scaling triggers at 70% CPU utilization
  - Database query performance <100ms for 95% of queries

**NFR-006: Availability**
- **Priority**: HIGH
- **Description**: System SHALL maintain high availability with minimal downtime
- **Requirements**:
  - **Uptime**: 99.5% availability (maximum 3.65 hours downtime per month)
  - **Scheduled Maintenance**: Outside class hours (e.g., 2-4 AM local time)
  - **Disaster Recovery**:
    - Automated daily backups (database, file storage)
    - Recovery Time Objective (RTO): 4 hours
    - Recovery Point Objective (RPO): 1 hour (maximum 1 hour data loss)
  - **Monitoring**: Real-time monitoring with automated alerts for downtime, errors, performance degradation
- **Acceptance Criteria**:
  - Uptime SLA met over 6-month period
  - Disaster recovery tested quarterly
  - Incident response time <30 minutes for critical issues

---

### 5.3 Usability Requirements

**NFR-007: User Interface Design**
- **Priority**: HIGH
- **Description**: System SHALL provide intuitive, accessible, and consistent user interfaces
- **Requirements**:
  - **Mobile App**:
    - Native mobile experience (React Native)
    - Offline support for: Downloaded publications, Cached exam questions (draft answers saved locally)
    - Gesture-based navigation (swipe, pinch-to-zoom)
    - Dark mode support
  - **Web App**:
    - Responsive design (desktop, tablet, mobile browsers)
    - Keyboard shortcuts for power users (admins, teachers)
    - Consistent UI components using design system (shadcn/ui)
  - **Accessibility**:
    - WCAG 2.1 Level AA compliance
    - Screen reader support
    - Keyboard navigation for all features
    - Color contrast ratios â‰¥4.5:1 for text
  - **Localization**:
    - Sinhala and Tamil language support (future enhancement)
    - Date/time formats: Sri Lankan locale
    - Currency: Sri Lankan Rupee (LKR)
- **Acceptance Criteria**:
  - Usability testing with 10 users (students, teachers, admins) shows 80% task completion success
  - Accessibility audit passes WCAG 2.1 Level AA
  - Mobile app rated â‰¥4.0 stars on Play Store/App Store

**NFR-008: Help and Documentation**
- **Priority**: MEDIUM
- **Description**: System SHALL provide comprehensive help resources
- **Requirements**:
  - In-app help tooltips for complex features (e.g., exam creation, Face ID capture)
  - Video tutorials: Student onboarding, Teacher exam creation, Admin dashboard overview
  - FAQ section: Common questions for each user role
  - Support contact: WhatsApp, Email, Phone (displayed in app footer)
  - Onboarding wizard for first-time users
- **Acceptance Criteria**:
  - Help documentation covers 100% of features
  - Video tutorials <5 minutes each, professionally produced
  - Support response time <24 hours for non-critical queries

---

### 5.4 Reliability and Error Handling

**NFR-009: Error Handling**
- **Priority**: HIGH
- **Description**: System SHALL handle errors gracefully with informative messages
- **Requirements**:
  - User-friendly error messages (no technical jargon for end users)
  - Detailed error logs for developers (stack traces, request IDs)
  - Retry mechanism for network failures (exponential backoff)
  - Offline mode for mobile app: Queue actions (e.g., submit exam answer) and sync when online
  - Validation errors: Highlight field, display specific error (e.g., "Password must contain at least 1 uppercase letter")
- **Acceptance Criteria**:
  - 100% of API errors return user-friendly messages
  - Critical errors logged with alerting to dev team
  - Mobile app syncs queued actions within 1 minute of reconnecting

**NFR-010: Data Integrity**
- **Priority**: HIGH
- **Description**: System SHALL maintain data consistency and prevent data loss
- **Requirements**:
  - Database transactions for multi-step operations (e.g., exam submission: update answers, calculate marks, record timestamp)
  - Optimistic locking for concurrent edits (e.g., two admins editing same timetable)
  - Auto-save for long forms (exam creation, profile editing) every 30 seconds
  - Data validation at API and database layers
  - Audit trails for critical operations: User creation, Payment processing, Exam approval, Face ID verification
- **Acceptance Criteria**:
  - Zero data loss incidents over 6-month period
  - Audit trails capture 100% of defined critical operations
  - Concurrent edit conflicts resolved gracefully with user notification

---

### 5.5 Maintainability and Extensibility

**NFR-011: Code Quality**
- **Priority**: MEDIUM
- **Description**: Codebase SHALL be maintainable, testable, and well-documented
- **Requirements**:
  - Code coverage: Minimum 70% for backend, 60% for frontend
  - Linting and formatting: ESLint, Prettier for TypeScript/JavaScript
  - API documentation: OpenAPI/Swagger for all endpoints
  - Code reviews: All pull requests reviewed by senior developer before merge
  - Version control: Git with branching strategy (Gitflow or trunk-based)
- **Acceptance Criteria**:
  - Code coverage reports generated automatically in CI/CD
  - API documentation accessible via /api/docs endpoint
  - Code review turnaround time <48 hours

**NFR-012: Deployment and DevOps**
- **Priority**: MEDIUM
- **Description**: System SHALL support automated deployment and continuous integration
- **Requirements**:
  - CI/CD pipeline: Automated testing, building, deployment
  - Environment separation: Development, Staging, Production
  - Infrastructure as Code (IaC): Terraform or equivalent
  - Containerization: Docker for consistent environments
  - Zero-downtime deployments: Blue-green or rolling deployments
  - Rollback capability: Revert to previous version within 10 minutes
- **Acceptance Criteria**:
  - CI/CD pipeline deploys to staging automatically on main branch merge
  - Production deployments require manual approval
  - Rollback tested monthly

---

### 5.6 Legal and Compliance

**NFR-013: Data Privacy Compliance**
- **Priority**: HIGH
- **Description**: System SHALL comply with data protection regulations
- **Requirements**:
  - GDPR compliance (if targeting EU users, future consideration)
  - CCPA compliance (if targeting California users, future consideration)
  - Sri Lankan data protection laws (PDPA - Personal Data Protection Act)
  - User consent for data collection: Face ID, Location (if tracked), Communication preferences
  - Right to access: Users can request their data
  - Right to deletion: Users can request account deletion (with legal retention for financial records)
  - Privacy policy and Terms of Service accessible in app
- **Acceptance Criteria**:
  - Privacy policy drafted and reviewed by legal counsel
  - Data access/deletion requests fulfilled within 30 days
  - Consent checkboxes present during onboarding

**NFR-014: Payment Compliance**
- **Priority**: HIGH
- **Description**: Payment processing SHALL comply with financial regulations
- **Requirements**:
  - PCI DSS compliance via Tracker Plus integration (no card data stored in LearnApp)
  - Receipt generation for all payments (PDF, emailed to user)
  - Refund policy clearly stated
  - Transaction logs retained for 7 years (Sri Lankan tax law)
  - Payment disputes handled via Tracker Plus support
- **Acceptance Criteria**:
  - PCI DSS audit passed (via Tracker Plus attestation)
  - Receipts generated for 100% of successful payments
  - Transaction logs immutable and backed up

**NFR-015: Intellectual Property**
- **Priority**: MEDIUM
- **Description**: System SHALL protect teacher-created content and publications
- **Requirements**:
  - Copyright notice on all publications
  - Digital watermarking for paid publications (embed student ID)
  - Terms of Service: Teachers retain copyright, grant LearnApp license to distribute
  - DMCA takedown process for copyright infringement reports
- **Acceptance Criteria**:
  - Watermarking implemented for all paid PDFs
  - Copyright policy documented in teacher agreement

---

## 6. Data Model

### 6.1 Core Entities

*(This section provides a high-level overview of key database entities. Detailed schema design will be documented separately.)*

**User**
- Common attributes: UserID, Name, Phone, Email, Password (hashed), Role (Student/Teacher/Admin), Status (Active/Inactive/Suspended), CreatedAt, UpdatedAt
- Student-specific: StudentID, Grade, Class, PaymentStatus, WalletBalance, FaceIDVerified
- Teacher-specific: EmployeeID, Subjects, Grades
- External Teacher-specific: School, Districts, Qualifications

**Class**
- ClassID, Subject, Grade, TeacherID, Schedule (day, time, duration, recurring), MeetingLink, Status (Draft/Published), RecordingURL

**Exam**
- ExamID, Name, Subject, Grade, TeacherID, Type (Full Online/Hybrid/Upload), StartTime, EndTime, Duration, TotalMarks, Status (Draft/Pending Approval/Published/Closed)

**Question**
- QuestionID, ExamID, Text, Type (MCQ/Multiple Select/True-False/Fill in Blanks/Short Answer/Essay/Arrange in Order/Structure/File Upload), Marks, Options (JSON), CorrectAnswer, Explanation

**Exam Submission**
- SubmissionID, ExamID, StudentID, StartTime, EndTime, Answers (JSON), TotalMarks, Rank, AIAlerts (JSON), Status (In Progress/Submitted/Time Out)

**Payment**
- PaymentID, StudentID, Amount, TransactionID (Tracker Plus), Method (Online/Bank Slip), Status (Paid/Pending/Failed), Date, Receipt URL

**Publication**
- PublicationID, Title, TeacherID, Description, FileURL, Price, Visibility (Public/Internal), Status (Draft/Pending Approval/Published), DownloadCount

**Transfer Request**
- RequestID, TeacherID, CurrentDistrict, DesiredDistrict, Subjects, Status (Draft/Pending Approval/Active/Paused/Closed), CreatedAt

**Transfer Interest**
- InterestID, RequestID, RequesterID (Teacher), Message, Status (Pending/Accepted/Rejected), CreatedAt

**Chat Message**
- MessageID, SenderID, ReceiverID, MessageText, Attachments (JSON), Status (Pending Approval/Approved/Rejected - for internal chat), Timestamp

**Notification**
- NotificationID, UserID, Title, Body, Type (Push/SMS/Email/In-App), Status (Sent/Failed), CreatedAt

---

### 6.2 Entity Relationship Diagram

*(ER diagram to be created using ERD tools like dbdiagram.io, Lucidchart, or Draw.io. Diagram will illustrate relationships between entities such as User â†’ Class, Teacher â†’ Exam, Student â†’ Exam Submission, etc.)*

---

### 6.3 Data Security and Privacy

- **Sensitive Data Fields**: Face ID videos, Passwords, Payment info encrypted at rest
- **Personally Identifiable Information (PII)**: Name, Phone, Email, NIC â†’ Access logged, protected by RBAC
- **Data Retention**:
  - Face ID: Deleted 90 days after account termination
  - Class Recordings: Auto-deleted after 30 days (per FR-009.2)
  - Exam Results: Hidden after 7 days but retained indefinitely for records
  - Payment Transactions: Retained 7 years for tax compliance
  - Audit Logs: Retained 1 year

---

## 7. System Workflows

### 7.1 External Student Onboarding

*(Flowchart to be created)*

1. User opens app â†’ Selects "Student" role
2. Taps "Sign Up" â†’ Enters phone, email, password, grade
3. SMS OTP sent â†’ User enters OTP â†’ Account created
4. Wallet visible (balance: 0)
5. User browses exams â†’ Selects exam â†’ Prompted to top up wallet
6. Redirects to Tracker Plus â†’ Completes payment â†’ Wallet credited
7. User purchases exam access â†’ Accesses exam

---

### 7.2 Internal Student Class Attendance

*(Flowchart to be created)*

1. Admin creates timetable â†’ Class published 1 year in advance
2. On class day, student opens app â†’ Sees "Join Class" button enabled (disabled on non-class days)
3. Student taps "Join" â†’ Face ID verification triggered (3-angle video capture)
4. Face ID compared with stored data â†’ Match: Allow join | No match: Block access, alert admin
5. Student joins video call (Jitsi/Agora) â†’ Teacher sees attendance marked "Present"
6. During class, teacher can "Ask Question" â†’ System selects random student â†’ Teacher marks response
7. Class ends â†’ Attendance finalized â†’ Recording stored for 30 days

---

### 7.3 Exam Creation and Monitoring

*(Sequence diagram to be created)*

1. **Teacher**: Creates exam (FR-016.1) â†’ Adds questions â†’ Saves as Draft
2. **Teacher**: Publishes exam â†’ Sends to admin approval queue (FR-016.1)
3. **Admin**: Reviews exam (FR-028.1) â†’ Approves â†’ Exam visible to students
4. **Student**: Discovers exam (FR-007.1) â†’ Enrolls (if external, purchases with wallet)
5. **Exam Window Opens**: Student starts exam â†’ AI monitoring active (FR-007.6)
6. **Teacher**: Monitors live dashboard (FR-017.1) â†’ Views AI alerts, student progress
7. **Student**: Submits exam â†’ Answers stored
8. **Exam Window Closes**: Teacher marks exam question-by-question (FR-018.1)
9. **Teacher**: Publishes results (FR-018.2) â†’ Students notified â†’ View results for 7 days

---

### 7.4 Mutual Transfer Request Flow

*(Flowchart to be created)*

1. **External Teacher**: Registers â†’ Uploads documents â†’ Awaits admin approval (FR-020)
2. **Admin**: Approves teacher â†’ Teacher verified
3. **Teacher**: Creates transfer request â†’ Submits for admin approval (FR-021)
4. **Admin**: Approves request â†’ Request becomes "Active" and searchable
5. **Another Teacher**: Searches requests (FR-022) â†’ Finds match â†’ Views limited info (Stage 1)
6. **Requester**: Sends interest (FR-023.2) â†’ Sees full sender profile (Stage 2)
7. **Sender**: Views received interest â†’ Accepts (FR-023.3) â†’ Both see full profiles (Stage 3)
8. **Both Teachers**: Chat unlocked (FR-023.4) â†’ Discuss transfer logistics
9. **Either Teacher**: Closes request (FR-024.2) when transfer complete or cancelled

---

### 7.5 Payment Processing

*(Sequence diagram to be created)*

1. **Student** (External): Taps "Top Up Wallet" â†’ Selects amount (e.g., 1000 LKR)
2. **App**: Redirects to Tracker Plus payment page with Transaction ID
3. **Student**: Completes payment (card/bank transfer)
4. **Tracker Plus**: Sends webhook to LearnApp backend with transaction status
5. **Backend**: Verifies transaction â†’ Updates wallet balance â†’ Sends push notification
6. **Student**: Sees updated wallet balance â†’ Purchases exam/publication
7. **Backend**: Deducts credits â†’ Grants access â†’ Records transaction
8. **(Alternative) Bank Slip**: Student uploads slip â†’ Admin reviews (FR-027.1) â†’ Approves â†’ Credits wallet

---

## 8. Integration Requirements

### 8.1 Payment Integration (Tracker Plus)

- **API Endpoints**: Initiate Payment, Verify Transaction, Refund
- **Webhooks**: Payment success, Payment failure, Refund processed
- **Security**: API keys, HMAC signature validation for webhooks
- **Error Handling**: Timeout after 5 minutes, retry logic, fallback to manual verification
- **Testing**: Sandbox environment for development and QA

---

### 8.2 Video Conferencing

- **Primary**: Jitsi Meet (self-hosted or Jitsi-as-a-Service)
- **Alternative**: Agora (if scalability issues with Jitsi)
- **Features**: HD video, Screen sharing, Recording, Chat, Participant management
- **Integration**: SDK embedded in mobile/web apps
- **Recording Storage**: S3-compatible storage, auto-delete after 30 days

---

### 8.3 Notification Services

- **Push Notifications**: Firebase Cloud Messaging (FCM) for Android and iOS
- **SMS**: Third-party SMS gateway (e.g., QuickSend, Dialog, Mobitel)
- **Email**: SMTP (e.g., SendGrid, Amazon SES)
- **In-App Notifications**: WebSocket for real-time delivery
- **Rate Limiting**: Max 10 push notifications per user per hour (to prevent spam)

---

### 8.4 AI and Face Recognition

- **Face ID Capture**: Device camera via WebRTC or native camera APIs
- **Face Recognition Engine**: AWS Rekognition, Azure Face API, or open-source (e.g., DeepFace, FaceNet)
- **AI Monitoring (Exams)**: Real-time video analysis for:
  - Multiple faces detected
  - No face detected (>5 seconds)
  - Face looking away (>10 seconds)
  - Tab switch detection (browser/app)
  - Screenshot attempt detection (mobile)
- **Alerts**: Stored in Exam Submission record, displayed to teacher in FR-017.1
- **Privacy**: External students' AI monitoring does NOT compare against stored Face ID (no biometric storage)

---

## 9. Technical Specifications

### 9.1 Technology Stack

*(As documented in Section 2.3 Operating Environment)*

**Backend**: NestJS, Node.js 20, PostgreSQL 14+, Redis 6+, BullMQ  
**Frontend Web**: Next.js, TypeScript, shadcn/ui, Tailwind CSS  
**Mobile**: React Native, TypeScript, Expo  
**Video**: Jitsi Meet or Agora SDK  
**Payments**: Tracker Plus API  
**Storage**: AWS S3 or S3-compatible  
**Deployment**: Docker, AWS ECS Fargate or Kubernetes  

---

### 9.2 API Design

- **REST API**: RESTful endpoints for CRUD operations
- **GraphQL** (optional): For complex data fetching (e.g., student dashboard with nested data)
- **WebSockets**: Real-time features (chat, notifications, live monitoring)
- **Authentication**: JWT in Authorization header (`Bearer <token>`)
- **Versioning**: URL-based (e.g., `/api/v1/users`)
- **Rate Limiting**: 100 requests per minute per user
- **Documentation**: OpenAPI (Swagger) specification, hosted at `/api/docs`

---

### 9.3 Database Design

- **Primary Database**: PostgreSQL
- **Schema**: Normalized design (3NF) for relational data
- **Indexing**: Indexes on foreign keys, frequently queried columns (e.g., StudentID, ExamID, UserID)
- **Full-Text Search**: PostgreSQL full-text search or Elasticsearch for publication/exam search
- **Caching**: Redis for session storage, frequently accessed data (e.g., user profiles, class schedules)
- **Backups**: Automated daily backups, retained for 30 days

---

### 9.4 Security Architecture

- **Network Security**: VPC with private subnets for database, public subnets for load balancers
- **API Gateway**: Rate limiting, IP whitelisting (for admin panel, optional)
- **Secret Management**: AWS Secrets Manager or HashiCorp Vault for API keys, database credentials
- **Logging**: Centralized logging (e.g., AWS CloudWatch, ELK stack)
- **Monitoring**: Application Performance Monitoring (APM) with New Relic, Datadog, or Sentry
- **Intrusion Detection**: Web Application Firewall (WAF) to block common attacks (SQL injection, XSS)

---

## 10. Implementation Plan

### 10.1 Development Phases

**Phase 1: Core Infrastructure (Weeks 1-4)**
- User authentication (FR-001)
- Database schema setup
- Admin panel (user provisioning FR-025)
- CI/CD pipeline setup

**Phase 2: Student and Class Management (Weeks 5-8)**
- Internal student onboarding (FR-001, FR-005)
- External student onboarding (FR-011)
- Class scheduling (FR-026)
- Class attendance and Face ID verification (FR-006, FR-015)

**Phase 3: Examination System (Weeks 9-14)**
- Exam creation (FR-016)
- Exam taking with AI monitoring (FR-007)
- Live monitoring dashboard (FR-017)
- Question-wise marking (FR-018)
- Result publication (FR-018.2)

**Phase 4: Payments and Wallet (Weeks 15-17)**
- Tracker Plus integration (FR-012, FR-027)
- Wallet management (FR-012)
- Payment dashboard (FR-027)

**Phase 5: Content and Communication (Weeks 18-20)**
- Publications and notes (FR-010, FR-019)
- Chat system (FR-004, FR-023.4, FR-029)
- Notifications (FR-003)

**Phase 6: Mutual Transfer System (Weeks 21-24)**
- External teacher registration (FR-020)
- Transfer request publication (FR-021)
- Search and discovery (FR-022)
- Interest management (FR-023)
- Request lifecycle (FR-024)

**Phase 7: Testing and Launch (Weeks 25-28)**
- Comprehensive testing (functional, performance, security)
- Bug fixes and optimization
- User acceptance testing (UAT)
- Production deployment
- Post-launch monitoring and support

---

### 10.2 Testing Strategy

**Unit Testing**: Backend (Jest), Frontend (Jest + React Testing Library), Mobile (Jest + Detox)  
**Integration Testing**: API endpoint testing with Postman/Newman  
**End-to-End Testing**: Cypress (web), Detox (mobile)  
**Performance Testing**: JMeter or k6 for load testing (500 concurrent users, 1000 concurrent exams)  
**Security Testing**: OWASP ZAP, penetration testing by third-party security firm  
**User Acceptance Testing (UAT)**: Pilot with 50 students, 10 teachers, 2 admins  

---

### 10.3 Deployment Strategy

**Staging Environment**: Mirror of production for final testing before release  
**Production Deployment**: Blue-green deployment to minimize downtime  
**Rollback Plan**: Automated rollback if critical errors detected (error rate >5%)  
**Monitoring**: Real-time monitoring dashboard, automated alerts via Slack/Email/SMS  
**Post-Deployment**: Smoke tests run automatically after deployment  

---

## 11. Appendices

### 11.1 UI/UX Design Guidelines

- **Design System**: shadcn/ui components for consistency
- **Color Palette**: Primary (institution branding), Secondary, Success, Warning, Error
- **Typography**: Sans-serif font (e.g., Inter, Roboto), hierarchical sizing for headings
- **Iconography**: Consistent icon set (e.g., Lucide icons)
- **Spacing**: 8px base unit for consistent spacing/padding
- **Mobile-First**: Design for mobile, scale up to tablet/desktop

---

### 11.2 Error Handling

- **API Errors**: Return standard format: `{ "error": "User-friendly message", "code": "ERROR_CODE", "details": "Technical details for developers" }`
- **Frontend Errors**: Display toast notifications or inline error messages
- **Network Failures**: Retry with exponential backoff, show offline mode message
- **Validation Errors**: Highlight field, display specific error next to field

---

### 11.3 Edge Cases and Guardrails

- **Concurrent Exam Submission**: Lock exam submission to prevent duplicate submissions
- **Timezone Handling**: All timestamps stored in UTC, converted to local time for display
- **Face ID Mismatch**: After 3 failed Face ID attempts, lock student account and alert admin
- **Payment Failures**: Retry webhook delivery 3 times with 5-minute intervals before marking as failed
- **Class Recording Failure**: Alert teacher immediately, allow manual upload as backup
- **Mutual Transfer Spam**: Limit teachers to 5 active transfer requests simultaneously
- **Exam Question Limit**: Maximum 100 questions per exam (performance consideration)

---

## Document Version
- **Version**: 2.0
- **Last Updated**: November 19, 2025
- **Status**: Complete - Ready for Development
- **Reviewed By**: Senior Software Development Mentor
- **Approval Status**: Pending Stakeholder Review

---

## Next Steps
1. Review and approve requirements with stakeholders
2. Technical feasibility assessment
3. Resource allocation and team formation
4. Detailed technical architecture design
5. Sprint planning based on build order (prioritize Web App and Mobile App per Section 2)
6. Development environment setup
7. Begin Phase 1 development (Core Infrastructure)

---

*This document serves as the single source of truth for the Pulamai Viththakan (LearnApp) Platform requirements. All development work should reference and align with these specifications.*

---

## Summary of Changes from v1.0 to v2.0

### Document Structure
- Restructured to IEEE 830 SRS standard format
- Added comprehensive Table of Contents with 11 main sections
- Added requirement IDs (FR-XXX, NFR-XXX) for traceability
- Added priority levels (HIGH/MEDIUM/LOW) to all requirements
- Added acceptance criteria to all functional requirements

### Functional Requirements (Section 4)
- **Section 4.1**: Common Requirements (FR-001 to FR-004) - Authentication, Profile, Notifications, Chat
- **Section 4.2**: Internal Student Requirements (FR-005 to FR-010) - 26 sub-requirements covering home, classes, exams, payments, notes, publications
- **Section 4.3**: External Student Requirements (FR-011 to FR-013) - Role selection, registration, wallet management, WhatsApp CTA
- **Section 4.4**: Internal Teacher Requirements (FR-014 to FR-019) - Dashboard, students/attendance with participation tracking, exam creation with 9 question types (including "Arrange in Order" and "Structure Questions"), live monitoring, question-wise marking workflow, content management
- **Section 4.5**: External Teacher/Mutual Transfer Requirements (FR-020 to FR-024) - Registration with admin approval, transfer request publication (admin approval required before searchable), 3-stage information disclosure, multiple acceptance support, peer-to-peer chat, request lifecycle
- **Section 4.6**: Administrator Requirements (FR-025 to FR-030) - User provisioning with Face ID verification, 1-year timetable creation, payment dashboard (150 recent, hide >1 month), exam approval, chat moderation, multi-institution management

### Non-Functional Requirements (Section 5)
- **NFR-001 to NFR-003**: Security (Authentication, Encryption, Face ID Protection)
- **NFR-004 to NFR-006**: Performance (Response Time <500ms, Scalability to 10,000 users, 99.5% Availability)
- **NFR-007 to NFR-008**: Usability (WCAG 2.1 Level AA, Offline support, Dark mode, Help resources)
- **NFR-009 to NFR-010**: Reliability (Error handling, Data integrity, Audit trails)
- **NFR-011 to NFR-012**: Maintainability (70% code coverage, CI/CD, IaC, Zero-downtime deployment)
- **NFR-013 to NFR-015**: Legal Compliance (GDPR/CCPA/PDPA, PCI DSS via Tracker Plus, IP protection)

### Additional Sections
- **Section 6**: Data Model (Core entities, ER diagram placeholder, Data retention policies)
- **Section 7**: System Workflows (5 key workflows with flowchart/sequence diagram placeholders)
- **Section 8**: Integration Requirements (Tracker Plus, Jitsi/Agora, FCM, AI Face Recognition)
- **Section 9**: Technical Specifications (Tech stack, REST API, PostgreSQL, Security architecture)
- **Section 10**: Implementation Plan (7 development phases over 28 weeks, Testing strategy, Deployment strategy)
- **Section 11**: Appendices (UI/UX guidelines, Error handling, Edge cases)

### Critical Clarifications
- **Face ID Distinction**: Internal students (capture + store + verify), External students (no stored biometrics, AI monitoring only during exams)
- **Class Links**: Valid 1 year, visible only on class day
- **Exam Types**: Full Online, Half Online/Half Upload, Full Upload
- **Mutual Transfer**: 3-stage info disclosure, multiple teachers can accept same request, admin approval for both teacher registration and request publication
- **Question-Wise Marking**: Teachers mark Question 1 across all students, then Question 2, etc.
- **Participation Tracking**: Teachers ask questions during class, "skip after 2 no-responses" rule, monthly awards (Gold/Silver/Bronze)
- **Admin Approvals Required**: Teacher exams (FR-028), External teacher registration (FR-020.2), Transfer request publication (FR-021.2), Internal teacher-student chat messages (FR-029)

### Metrics
- **Document Length**: 3,000+ lines (from 1,338 original lines)
- **Functional Requirements**: 30 main requirements (FR-001 to FR-030) with 100+ sub-requirements
- **Non-Functional Requirements**: 15 requirements (NFR-001 to NFR-015)
- **User Roles**: 6 (Internal Students, External Students, Internal Teachers, External Teachers, Admins, Super Admin)
- **Major Features**: Authentication with Face ID, Live Classes, Exam System with AI monitoring, Wallet/Payments, Mutual Transfer Portal, Publications, Chat System
- **Integration Points**: 4 (Tracker Plus, Jitsi/Agora, FCM, AI Face Recognition)


