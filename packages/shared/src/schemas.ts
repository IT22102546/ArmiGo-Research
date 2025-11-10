import { z } from "zod";
import {
  UserRole,
  UserStatus,
  Grade,
  Medium,
  Subject,
  QuestionType,
  ExamType,
  PaymentMethod,
  PaymentType,
} from "./types";

// User Schemas
export const userProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  grade: z.nativeEnum(Grade).optional(),
  medium: z.nativeEnum(Medium).optional(),
  school: z.string().optional(),
  avatar: z.string().url().optional(),
});

export const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, "Invalid phone number"),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus).default(UserStatus.PENDING),
  profile: userProfileSchema,
});

// Auth Schemas
export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.nativeEnum(UserRole).optional(),
});

export const signupSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    phone: z.string().regex(/^\+?[\d\s-()]+$/, "Invalid phone number"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    role: z.nativeEnum(UserRole),
    profile: userProfileSchema,
    institutionCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Exam Schemas
export const examQuestionSchema = z.object({
  type: z.nativeEnum(QuestionType),
  content: z.string().min(1, "Question content is required"),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]).optional(),
  points: z.number().min(1, "Points must be at least 1"),
  explanation: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

export const examSchema = z
  .object({
    title: z.string().min(1, "Exam title is required"),
    description: z.string().optional(),
    type: z.nativeEnum(ExamType),
    grade: z.nativeEnum(Grade),
    subject: z.nativeEnum(Subject),
    duration: z.number().min(5, "Duration must be at least 5 minutes"),
    startTime: z.date(),
    endTime: z.date(),
    aiMonitoring: z.boolean().default(true),
    questions: z.array(examQuestionSchema),
    settings: z.object({
      aiMonitoring: z.boolean().default(true),
      randomizeQuestions: z.boolean().default(false),
      allowReview: z.boolean().default(true),
      showResults: z.boolean().default(true),
      timeLimit: z.number().min(5),
      passingScore: z.number().min(0).max(100),
    }),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

// Class Schemas
export const classSchema = z
  .object({
    title: z.string().min(1, "Class title is required"),
    description: z.string().optional(),
    grade: z.nativeEnum(Grade),
    subject: z.nativeEnum(Subject),
    startTime: z.date(),
    endTime: z.date(),
    maxParticipants: z.number().min(1).max(1000).default(100),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

// Payment Schemas
export const paymentSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  currency: z
    .string()
    .length(3, "Currency must be 3 characters")
    .default("USD"),
  type: z.nativeEnum(PaymentType),
  method: z.nativeEnum(PaymentMethod),
  metadata: z.record(z.any()).optional(),
});

export const walletTopupSchema = z.object({
  amount: z.number().min(1, "Minimum top-up amount is $1"),
  method: z.nativeEnum(PaymentMethod),
});

// Transfer Schemas
export const transferRequestSchema = z.object({
  fromZone: z.string().min(1, "From zone is required"),
  toZone: z.string().min(1, "To zone is required"),
  subject: z.nativeEnum(Subject),
  medium: z.nativeEnum(Medium),
  level: z.string().min(1, "Level is required"),
  message: z
    .string()
    .max(500, "Message cannot exceed 500 characters")
    .optional(),
});

// Search Schemas
export const searchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  type: z.enum(["exam", "class", "user", "transfer"]).optional(),
  filters: z.record(z.any()).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// File Upload Schemas
export const fileUploadSchema = z.object({
  file: z.any(), // Will be validated differently on client/server
  type: z.enum(["image", "document", "video", "audio"]),
  purpose: z.enum(["avatar", "exam_attachment", "assignment", "verification"]),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ExamInput = z.infer<typeof examSchema>;
export type ClassInput = z.infer<typeof classSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type WalletTopupInput = z.infer<typeof walletTopupSchema>;
export type TransferRequestInput = z.infer<typeof transferRequestSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
