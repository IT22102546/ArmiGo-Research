// API Constants
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    SIGNUP: "/auth/signup",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    VERIFY_FACE: "/auth/verify-face",
  },
  USERS: {
    PROFILE: "/users/profile",
    UPDATE: "/users/update",
    LIST: "/users",
    DELETE: "/users/:id",
  },
  EXAMS: {
    LIST: "/exams",
    CREATE: "/exams",
    GET: "/exams/:id",
    UPDATE: "/exams/:id",
    DELETE: "/exams/:id",
    START: "/exams/:id/start",
    SUBMIT: "/exams/:id/submit",
    RESULTS: "/exams/:id/results",
  },
  CLASSES: {
    LIST: "/classes",
    CREATE: "/classes",
    GET: "/classes/:id",
    JOIN: "/classes/:id/join",
    RECORDING: "/classes/:id/recording",
  },
  PAYMENTS: {
    CREATE: "/payments",
    LIST: "/payments",
    WALLET: "/payments/wallet",
    TOPUP: "/payments/topup",
    HISTORY: "/payments/history",
  },
  TRANSFER: {
    LIST: "/transfer",
    CREATE: "/transfer",
    ACCEPT: "/transfer/:id/accept",
    REJECT: "/transfer/:id/reject",
  },
} as const;

// Error Codes
export const ERROR_CODES = {
  // Authentication Errors
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",

  // Validation Errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // User Errors
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
  USER_SUSPENDED: "USER_SUSPENDED",

  // Exam Errors
  EXAM_NOT_FOUND: "EXAM_NOT_FOUND",
  EXAM_NOT_ACTIVE: "EXAM_NOT_ACTIVE",
  EXAM_ALREADY_SUBMITTED: "EXAM_ALREADY_SUBMITTED",
  EXAM_TIME_EXPIRED: "EXAM_TIME_EXPIRED",

  // Payment Errors
  PAYMENT_FAILED: "PAYMENT_FAILED",
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
  PAYMENT_GATEWAY_ERROR: "PAYMENT_GATEWAY_ERROR",

  // System Errors
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  NETWORK_ERROR: "NETWORK_ERROR",
} as const;

// WebSocket Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: "connect",
  DISCONNECT: "disconnect",

  // Authentication
  AUTHENTICATE: "authenticate",
  AUTHENTICATED: "authenticated",

  // Exam Events
  EXAM_START: "exam:start",
  EXAM_SUBMIT: "exam:submit",
  EXAM_VIOLATION: "exam:violation",
  EXAM_TIME_WARNING: "exam:time_warning",

  // Class Events
  CLASS_JOIN: "class:join",
  CLASS_LEAVE: "class:leave",
  CLASS_START: "class:start",
  CLASS_END: "class:end",

  // AI Monitoring
  AI_FRAME: "ai:frame",
  AI_VIOLATION: "ai:violation",
  AI_STATUS: "ai:status",

  // Notifications
  NOTIFICATION: "notification",
  NOTIFICATION_READ: "notification:read",
} as const;

// File Upload Constants
export const FILE_UPLOAD = {
  MAX_SIZE: {
    IMAGE: 5 * 1024 * 1024, // 5MB
    DOCUMENT: 10 * 1024 * 1024, // 10MB
    VIDEO: 100 * 1024 * 1024, // 100MB
    AUDIO: 50 * 1024 * 1024, // 50MB
  },
  ALLOWED_TYPES: {
    IMAGE: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    DOCUMENT: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    VIDEO: ["video/mp4", "video/webm", "video/quicktime"],
    AUDIO: ["audio/mp3", "audio/wav", "audio/ogg"],
  },
} as const;

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Security Constants
export const SECURITY = {
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 128,
  JWT_EXPIRY: "15m",
  REFRESH_TOKEN_EXPIRY: "7d",
  FACE_VERIFICATION_THRESHOLD: 0.85,
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_ATTEMPT_WINDOW: 15 * 60 * 1000, // 15 minutes
} as const;

// Exam Constants
export const EXAM_CONSTANTS = {
  MIN_DURATION: 5, // minutes
  MAX_DURATION: 480, // 8 hours
  AUTO_SUBMIT_BUFFER: 30, // seconds before auto-submit
  VIOLATION_THRESHOLD: 3, // max violations before action
  FACE_CHECK_INTERVAL: 5000, // ms
} as const;

// Payment Constants
export const PAYMENT_CONSTANTS = {
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 10000,
  CURRENCIES: ["USD", "LKR"] as const,
  WALLET_MIN_TOPUP: 1,
  WALLET_MAX_BALANCE: 10000,
} as const;

// Time Constants
export const TIME_CONSTANTS = {
  TIMEZONE: "Asia/Colombo",
  DATE_FORMAT: "yyyy-MM-dd",
  TIME_FORMAT: "HH:mm",
  DATETIME_FORMAT: "yyyy-MM-dd HH:mm:ss",
} as const;

// Grade Constants - Only grades 1 to 11 are allowed
export const GRADE_CONSTANTS = {
  ALLOWED_GRADES: [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
  ] as const,
  MIN_GRADE: 1,
  MAX_GRADE: 11,
  GRADE_DISPLAY: {
    "1": "Grade 1",
    "2": "Grade 2",
    "3": "Grade 3",
    "4": "Grade 4",
    "5": "Grade 5",
    "6": "Grade 6",
    "7": "Grade 7",
    "8": "Grade 8",
    "9": "Grade 9",
    "10": "Grade 10",
    "11": "Grade 11",
  } as const,
} as const;

// Batch Constants - Support for multiple batches per grade
export const BATCH_CONSTANTS = {
  ALLOWED_BATCHES: [
    "Batch01",
    "Batch02",
    "Batch03",
    "Batch04",
    "Batch05",
  ] as const,
  BATCH_DISPLAY: {
    Batch01: "Batch 01",
    Batch02: "Batch 02",
    Batch03: "Batch 03",
    Batch04: "Batch 04",
    Batch05: "Batch 05",
  } as const,
} as const;

export type Currency = (typeof PAYMENT_CONSTANTS.CURRENCIES)[number];
export type AllowedGrade = (typeof GRADE_CONSTANTS.ALLOWED_GRADES)[number];
export type AllowedBatch = (typeof BATCH_CONSTANTS.ALLOWED_BATCHES)[number];
