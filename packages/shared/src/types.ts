import { AllowedBatch } from "./constants";

// Grade and Batch Types
export type Batch = AllowedBatch;

// User Types - Aligned with Prisma Schema
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  INTERNAL_TEACHER = "INTERNAL_TEACHER",
  EXTERNAL_TEACHER = "EXTERNAL_TEACHER",
  INTERNAL_STUDENT = "INTERNAL_STUDENT",
  EXTERNAL_STUDENT = "EXTERNAL_STUDENT",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  PENDING = "PENDING",
}

export interface User {
  id: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  profile: UserProfile;
  institution?: Institution;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  grade?: Grade;
  medium?: Medium;
  school?: string;
  avatar?: string;
  faceId?: string;
}

export interface Institution {
  id: string;
  name: string;
  code: string;
  type: InstitutionType;
}

export enum InstitutionType {
  INTERNAL = "internal",
  EXTERNAL = "external",
}

// Exam Types
export enum ExamType {
  FULL_ONLINE = "full_online",
  HALF_ONLINE_HALF_UPLOAD = "half_online_half_upload",
  FULL_UPLOAD = "full_upload",
}

export enum ExamStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  type: ExamType;
  grade: Grade;
  subject: Subject;
  duration: number; // minutes
  startTime: Date;
  endTime: Date;
  aiMonitoring: boolean;
  questions: ExamQuestion[];
  settings: ExamSettings;
  createdBy: string;
  status: ExamStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum QuestionType {
  MCQ = "mcq",
  MATCHING = "matching",
  FILL_IN_BLANK = "fill_in_blank",
  ESSAY = "essay",
  UPLOAD = "upload",
}

export interface ExamQuestion {
  id: string;
  type: QuestionType;
  content: string;
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  explanation?: string;
  attachments?: string[];
  subQuestions?: ExamQuestion[];
}

export interface ExamSettings {
  aiMonitoring: boolean;
  randomizeQuestions: boolean;
  allowReview: boolean;
  showResults: boolean;
  timeLimit: number;
  passingScore: number;
}

// Class Types
export enum ClassStatus {
  SCHEDULED = "scheduled",
  LIVE = "live",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export interface Class {
  id: string;
  title: string;
  description: string;
  grade: Grade;
  subject: Subject;
  teacherId: string;
  startTime: Date;
  endTime: Date;
  meetingUrl: string;
  recordingUrl?: string;
  status: ClassStatus;
  maxParticipants: number;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Types
export enum PaymentMethod {
  TRACKER_PLUS = "tracker_plus",
  CARD = "card",
  BANK_SLIP = "bank_slip",
}

export enum PaymentStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

export enum PaymentType {
  EXAM = "exam",
  WALLET_TOPUP = "wallet_topup",
  MONTHLY_FEE = "monthly_fee",
  PUBLICATION = "publication",
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;
  gatewayResponse?: any;
  metadata?: PaymentMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMetadata {
  examId?: string;
  publicationId?: string;
  description?: string;
  [key: string]: any;
}

// Wallet Types
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TransactionType {
  CREDIT = "credit",
  DEBIT = "debit",
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  description: string;
  balanceAfter: number;
  metadata?: any;
  createdAt: Date;
}

// Common Enums
export enum Grade {
  GRADE_1 = "1",
  GRADE_2 = "2",
  GRADE_3 = "3",
  GRADE_4 = "4",
  GRADE_5 = "5",
  GRADE_6 = "6",
  GRADE_7 = "7",
  GRADE_8 = "8",
  GRADE_9 = "9",
  GRADE_10 = "10",
  GRADE_11 = "11",
}

export enum Medium {
  SINHALA = "sinhala",
  TAMIL = "tamil",
  ENGLISH = "english",
}

export enum Subject {
  MATHEMATICS = "mathematics",
  SCIENCE = "science",
  ENGLISH = "english",
  SINHALA = "sinhala",
  TAMIL = "tamil",
  HISTORY = "history",
  GEOGRAPHY = "geography",
  BUDDHISM = "buddhism",
  HINDUISM = "hinduism",
  CHRISTIANITY = "christianity",
  ISLAM = "islam",
  CIVIC_EDUCATION = "civic_education",
  PRACTICAL_TECHNICAL_STUDIES = "practical_technical_studies",
  AESTHETIC_STUDIES = "aesthetic_studies",
  HEALTH_PHYSICAL_EDUCATION = "health_physical_education",
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Real-time Event Types
export interface SocketEvent {
  type: string;
  payload: any;
  timestamp: Date;
  userId?: string;
  roomId?: string;
}

// Security Types
export interface SecurityViolation {
  id: string;
  sessionId: string;
  type: ViolationType;
  severity: Severity;
  description: string;
  confidence?: number;
  timestamp: Date;
  evidence?: any;
}

export enum ViolationType {
  FACE_VERIFICATION_FAILED = "face_verification_failed",
  MULTIPLE_FACES_DETECTED = "multiple_faces_detected",
  ATTENTION_DEVIATION = "attention_deviation",
  AUDIO_VIOLATION = "audio_violation",
  NETWORK_ANOMALY = "network_anomaly",
  SUSPICIOUS_BEHAVIOR = "suspicious_behavior",
}

export enum Severity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Transfer Types
export interface TransferRequest {
  id: string;
  senderId: string;
  fromZone: string;
  toZone: string;
  subject: Subject;
  medium: Medium;
  level: string;
  status: TransferStatus;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TransferStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  EXPIRED = "expired",
}
