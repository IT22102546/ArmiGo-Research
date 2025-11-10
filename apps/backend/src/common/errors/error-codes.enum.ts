/**
 * Standardized Error Codes
 *
 * All application errors should use these codes for consistency
 * and to enable better error handling on the frontend.
 */

export enum ErrorCode {
  // Authentication & Authorization (1xxx)
  INVALID_CREDENTIALS = "AUTH_1001",
  USER_NOT_FOUND = "AUTH_1002",
  ACCOUNT_LOCKED = "AUTH_1003",
  TOKEN_EXPIRED = "AUTH_1004",
  TOKEN_INVALID = "AUTH_1005",
  REFRESH_TOKEN_INVALID = "AUTH_1006",
  UNAUTHORIZED = "AUTH_1007",
  FORBIDDEN = "AUTH_1008",
  TWO_FACTOR_REQUIRED = "AUTH_1009",
  TWO_FACTOR_INVALID = "AUTH_1010",
  PASSWORD_RESET_EXPIRED = "AUTH_1011",
  EMAIL_NOT_VERIFIED = "AUTH_1012",
  PHONE_NOT_VERIFIED = "AUTH_1013",
  TOKEN_REVOKED = "AUTH_1014",
  INVALID_LOGIN_METHOD = "AUTH_1015",
  INVALID_TOKEN = "AUTH_1016",
  INSUFFICIENT_PERMISSIONS = "AUTH_1017",

  // User Management (2xxx)
  USER_ALREADY_EXISTS = "USER_2001",
  EMAIL_ALREADY_EXISTS = "USER_2002",
  PHONE_ALREADY_EXISTS = "USER_2003",
  INVALID_USER_ID = "USER_2004",
  PROFILE_UPDATE_FAILED = "USER_2005",
  AVATAR_UPLOAD_FAILED = "USER_2006",
  PASSWORD_CHANGE_FAILED = "USER_2007",
  WEAK_PASSWORD = "USER_2008",

  // Validation Errors (3xxx)
  VALIDATION_ERROR = "VAL_3001",
  VALIDATION_FAILED = "VAL_3002",
  INVALID_INPUT = "VAL_3003",
  MISSING_REQUIRED_FIELD = "VAL_3004",
  INVALID_FORMAT = "VAL_3005",
  INVALID_DATE_RANGE = "VAL_3006",
  INVALID_EMAIL_FORMAT = "VAL_3007",
  INVALID_PHONE_FORMAT = "VAL_3008",

  // Resource Errors (4xxx)
  RESOURCE_NOT_FOUND = "RES_4001",
  CLASS_NOT_FOUND = "RES_4002",
  EXAM_NOT_FOUND = "RES_4003",
  ENROLLMENT_NOT_FOUND = "RES_4004",
  PUBLICATION_NOT_FOUND = "RES_4005",
  MATERIAL_NOT_FOUND = "RES_4006",
  PAYMENT_NOT_FOUND = "RES_4007",
  TEACHER_NOT_FOUND = "RES_4008",
  GRADE_NOT_FOUND = "RES_4009",
  MEDIUM_NOT_FOUND = "RES_4010",
  SUBJECT_NOT_FOUND = "RES_4011",
  ACADEMIC_YEAR_NOT_FOUND = "RES_4012",
  TEACHER_ASSIGNMENT_NOT_FOUND = "RES_4013",

  // Business Logic Errors (5xxx)
  ENROLLMENT_FULL = "BIZ_5001",
  ENROLLMENT_CLOSED = "BIZ_5002",
  ALREADY_ENROLLED = "BIZ_5003",
  INSUFFICIENT_FUNDS = "BIZ_5004",
  PAYMENT_FAILED = "BIZ_5005",
  EXAM_ALREADY_SUBMITTED = "BIZ_5006",
  EXAM_NOT_STARTED = "BIZ_5007",
  EXAM_EXPIRED = "BIZ_5008",
  INVALID_EXAM_STATE = "BIZ_5009",
  CLASS_ALREADY_STARTED = "BIZ_5010",
  CANNOT_DELETE_ACTIVE_CLASS = "BIZ_5011",
  BUSINESS_RULE_VIOLATION = "BIZ_5012",
  ONLY_TEACHERS_CAN_CREATE_CLASSES = "BIZ_5013",
  TEACHER_NO_ACTIVE_ASSIGNMENT = "BIZ_5014",
  EXTERNAL_TEACHER_RESTRICTION = "BIZ_5015",
  NO_CURRENT_ACADEMIC_YEAR = "BIZ_5016",
  ONLY_CLASS_TEACHER_CAN_MODIFY = "BIZ_5017",
  CANNOT_MODIFY_COMPLETED_CLASS = "BIZ_5018",
  STUDENT_ALREADY_ENROLLED = "BIZ_5019",
  STUDENT_NOT_ENROLLED = "BIZ_5020",
  ONLY_STUDENTS_CAN_ENROLL = "BIZ_5021",
  CLASS_NOT_ACTIVE = "BIZ_5022",
  CLASS_CAPACITY_FULL = "BIZ_5023",
  CLASS_NOT_LIVE = "BIZ_5024",
  CLASS_ALREADY_LIVE = "BIZ_5025",
  ONLY_ASSIGNED_TEACHER_CAN_START = "BIZ_5026",
  MEDIUM_REQUIRED = "BIZ_5027",
  ONLY_ASSIGNED_TEACHER_CAN_STOP = "BIZ_5028",
  ONLY_TEACHERS_ADMINS_CAN_CREATE = "BIZ_5029",
  ONLY_OWN_CLASS_EXAMS = "BIZ_5030",
  TEACHER_PROFILE_NOT_FOUND = "BIZ_5031",
  NOT_ENROLLED_IN_CLASS = "BIZ_5032",
  EXAM_NOT_AVAILABLE = "BIZ_5033",
  EXAM_NOT_ACTIVE = "BIZ_5034",
  MAX_ATTEMPTS_EXCEEDED = "BIZ_5035",
  EXAM_ATTEMPT_NOT_IN_PROGRESS = "BIZ_5036",
  ACCESS_DENIED = "BIZ_5037",
  EXAM_PENDING_APPROVAL = "BIZ_5038",
  RANKING_NOT_ENABLED = "BIZ_5039",
  ONLY_ADMINS_CAN_PERFORM = "BIZ_5040",
  QUESTION_NOT_FOUND = "RES_4015",
  EXAM_ATTEMPT_NOT_FOUND = "RES_4016",
  STUDENT_NOT_FOUND = "RES_4014",

  // Exam Timing Validation (5050-5069)
  EXAM_END_BEFORE_START = "BIZ_5050",
  WINDOW_END_BEFORE_START = "BIZ_5051",
  WINDOW_START_BEFORE_EXAM = "BIZ_5052",
  WINDOW_END_AFTER_EXAM = "BIZ_5053",
  EXAM_DURATION_EXCEEDS_WINDOW = "BIZ_5054",
  EXAM_DURATION_EXCEEDS_TIME = "BIZ_5055",
  INVALID_WINDOW_CONFIG = "BIZ_5056",

  // Class-Teacher Validation (5070-5079)
  CLASS_TEACHER_MISMATCH = "BIZ_5070",
  ASSIGNMENT_TEACHER_MISMATCH = "BIZ_5071",
  ASSIGNMENT_SUBJECT_MISMATCH = "BIZ_5072",
  ASSIGNMENT_GRADE_MISMATCH = "BIZ_5073",
  ASSIGNMENT_MEDIUM_MISMATCH = "BIZ_5074",

  // Transfer Request Errors (5080-5099)
  ACTIVE_TRANSFER_EXISTS = "BIZ_5080",
  ZONE_NOT_FOUND = "BIZ_5081",
  SUBJECT_REQUIRED = "BIZ_5082",
  MEDIUM_REQUIRED_TRANSFER = "BIZ_5083",
  TRANSFER_NOT_FOUND = "BIZ_5084",
  CANNOT_CANCEL_COMPLETED_TRANSFER = "BIZ_5085",
  CANNOT_ACCEPT_UNVERIFIED = "BIZ_5086",
  TRANSFER_NOT_AVAILABLE = "BIZ_5087",
  PROFILE_MISMATCH = "BIZ_5088",
  CANNOT_MATCH_SELF = "BIZ_5089",
  TRANSFER_ALREADY_VERIFIED = "BIZ_5090",
  CAN_ONLY_COMPLETE_MATCHED = "BIZ_5091",
  MESSAGE_NOT_FOUND = "BIZ_5092",
  CANNOT_DELETE_OTHERS_MESSAGE = "BIZ_5093",
  ONLY_ADMINS_CAN_VERIFY = "BIZ_5094",
  ONLY_OWNERS_CAN_CANCEL = "BIZ_5095",
  ONLY_OWNERS_CAN_UPDATE = "BIZ_5096",
  CANNOT_UPDATE_NON_PENDING = "BIZ_5097",
  CANNOT_VIEW_TRANSFER = "BIZ_5098",
  TRANSFER_REQUEST_NOT_FOUND = "BIZ_5099",
  ACCEPTANCE_NOT_FOUND = "BIZ_5100",
  INVALID_REQUEST = "BIZ_5101",

  // Video Session Errors (5102-5119)
  VIDEO_SESSION_NOT_FOUND = "BIZ_5102",
  NOT_CLASS_TEACHER = "BIZ_5103",
  NOT_SESSION_HOST = "BIZ_5104",
  SESSION_NOT_ACTIVE = "BIZ_5105",
  SESSION_NOT_SCHEDULED = "BIZ_5106",
  NO_SESSION_ACCESS = "BIZ_5107",
  NOT_ENROLLED_SESSION_CLASS = "BIZ_5108",
  ALREADY_ENDED = "BIZ_5109",
  CAN_ONLY_UPDATE_SCHEDULED = "BIZ_5110",

  // Payment Errors (5120-5139)
  PAYMENT_NOT_PENDING = "BIZ_5120",
  PAYMENT_NOT_COMPLETED = "BIZ_5121",
  ALREADY_ENROLLED_CLASS = "BIZ_5122",
  BANK_SLIP_REQUIRED = "BIZ_5123",
  TRACKER_PLUS_REQUIRED = "BIZ_5124",
  REFUND_WINDOW_EXPIRED = "BIZ_5125",

  // Wallet Errors (5140-5149)
  AMOUNT_MUST_BE_POSITIVE = "BIZ_5140",
  ONLY_TEACHERS_WITHDRAW = "BIZ_5141",
  INSUFFICIENT_WALLET_BALANCE = "BIZ_5142",
  WALLET_FROZEN = "BIZ_5143",
  MAX_BALANCE_EXCEEDED = "BIZ_5144",

  // Teacher Availability Errors (5150-5159)
  LEAVE_NOT_FOUND = "BIZ_5150",
  START_BEFORE_END_DATE = "BIZ_5151",
  LEAVE_CONFLICT = "BIZ_5152",
  ONLY_PENDING_CAN_APPROVE = "BIZ_5153",
  ONLY_PENDING_CAN_REJECT = "BIZ_5154",
  ONLY_PENDING_CAN_CANCEL = "BIZ_5155",
  LEAVE_ALREADY_CANCELLED = "BIZ_5156",

  // Marking Errors (5160-5169)
  NO_MARKING_ACCESS = "BIZ_5160",
  ANSWER_NOT_FOUND = "BIZ_5161",
  CANNOT_MARK_ATTEMPTED = "BIZ_5162",

  // Timetable Errors (5170-5189)
  TIMETABLE_NOT_FOUND = "BIZ_5170",
  USER_MUST_BE_TEACHER = "BIZ_5171",
  GRADE_ID_REQUIRED = "BIZ_5172",
  SUBJECT_ID_REQUIRED = "BIZ_5173",
  MEDIUM_ID_REQUIRED = "BIZ_5174",
  TIMETABLE_CONFLICT = "BIZ_5175",
  ONLY_OWN_TIMETABLE = "BIZ_5176",
  TIMETABLE_CHANGE_NOT_FOUND = "BIZ_5177",
  ONLY_OWN_CHANGES = "BIZ_5178",
  INVALID_NEW_TEACHER = "BIZ_5179",
  CHANGE_TYPE_REQUIRED = "BIZ_5180",
  RESCHEDULE_DATE_REQUIRED = "BIZ_5181",

  // Attendance Business Logic (5250-5259)
  ATTENDANCE_SESSION_NOT_STARTED = "BIZ_5250",
  ONLY_ADMIN_DELETE_ATTENDANCE = "BIZ_5251",

  // Promotion Errors (5190-5199)
  SETTING_NOT_EDITABLE = "BIZ_5190",
  ACCESS_EXPIRED = "BIZ_5191",
  DOWNLOAD_LIMIT_REACHED = "BIZ_5192",
  PUBLICATION_ALREADY_PURCHASED = "BIZ_5193",
  RECONCILIATION_ALREADY_MATCHED = "BIZ_5194",
  PAYMENT_ALREADY_RECONCILED = "BIZ_5195",
  PENDING_PROMOTION_EXISTS = "BIZ_5196",
  BATCH_TRANSFER_TYPE_REQUIRED = "BIZ_5197",
  PROMOTION_NOT_PENDING = "BIZ_5198",
  CANNOT_DELETE_COMPLETED_PROMOTION = "BIZ_5199",
  ACCESS_ALREADY_ACTIVE = "BIZ_5200",
  ACCESS_ALREADY_REVOKED = "BIZ_5201",
  EXCEPTION_PENDING_EXISTS = "BIZ_5202",
  TIME_EXTENSION_REQUIRED = "BIZ_5203",
  EXCEPTION_NOT_PENDING = "BIZ_5204",
  EXCEPTION_NOT_APPROVED = "BIZ_5205",
  RECONCILIATION_NOT_MATCHED = "BIZ_5206",
  RECONCILIATION_NOT_DISPUTED = "BIZ_5207",
  STUDENT_NO_CURRENT_GRADE = "BIZ_5208",
  STUDENT_PROFILE_MISSING = "BIZ_5209",
  PUBLICATION_NOT_AVAILABLE = "BIZ_5210",
  PUBLICATION_HAS_PURCHASES = "BIZ_5211",
  PUBLICATION_NOT_PURCHASED = "BIZ_5212",
  INSUFFICIENT_QUESTIONS = "BIZ_5213",
  RESCHEDULING_CONFLICT = "BIZ_5240",
  BATCH_ALREADY_EXISTS = "BIZ_5241",
  MESSAGE_NOT_PENDING = "BIZ_5242",
  ONLY_OWN_MESSAGES = "BIZ_5243",
  MAX_GRADES_REACHED = "BIZ_5244",
  TWO_FA_NOT_SETUP = "AUTH_2010",
  TWO_FA_NOT_ENABLED = "AUTH_2011",

  // Attendance & Announcements Resources
  ATTENDANCE_NOT_FOUND = "RES_4040",
  ANNOUNCEMENT_NOT_FOUND = "RES_4041",

  // Additional Resource Errors
  PARTICIPANT_NOT_FOUND = "RES_4017",
  RECORDING_NOT_AVAILABLE = "RES_4018",
  PROMOTION_NOT_FOUND = "RES_4020",
  SETTING_NOT_FOUND = "RES_4021",
  RECONCILIATION_NOT_FOUND = "RES_4022",
  EXCEPTION_NOT_FOUND = "RES_4023",
  TEMPORARY_ACCESS_NOT_FOUND = "RES_4024",
  QUESTION_CATEGORY_NOT_FOUND = "RES_4025",
  QUESTION_TAG_NOT_FOUND = "RES_4026",
  INVOICE_NOT_FOUND = "RES_4030",
  PROCTORING_SESSION_NOT_FOUND = "RES_4031",
  RESCHEDULING_NOT_FOUND = "RES_4035",
  BATCH_NOT_FOUND = "RES_4036",

  // Stripe/Payment Gateway Errors (5300-5319)
  STRIPE_INTENT_FAILED = "PAY_5300",
  STRIPE_CONFIRM_FAILED = "PAY_5301",
  STRIPE_REFUND_FAILED = "PAY_5302",
  WEBHOOK_NOT_CONFIGURED = "PAY_5303",
  INVALID_WEBHOOK_SIGNATURE = "PAY_5304",
  STRIPE_CUSTOMER_FAILED = "PAY_5305",
  STRIPE_CUSTOMER_DELETED = "PAY_5306",
  STRIPE_RETRIEVE_FAILED = "PAY_5307",

  // Invoice Errors (5220-5229)
  INVOICE_ALREADY_PAID = "BIZ_5220",
  INVOICE_ALREADY_CANCELLED = "BIZ_5221",
  CANNOT_UPDATE_PAID_INVOICE = "BIZ_5222",
  CANNOT_CANCEL_PAID_INVOICE = "BIZ_5223",
  CANNOT_DELETE_PAID_INVOICE = "BIZ_5224",
  NO_TARGETING_CRITERIA_MATCH = "BIZ_5225",
  INVALID_EVENT_TYPE = "BIZ_5226",
  INVALID_SEVERITY_LEVEL = "BIZ_5227",
  CAN_ONLY_UPDATE_OWN_MATERIALS = "BIZ_5228",
  INVALID_INVOICE_STATE = "BIZ_5229",
  NO_ACTIVE_ENROLLMENTS = "BIZ_5230",
  INVOICE_ALREADY_EXISTS = "BIZ_5231",
  GRADE_ALREADY_EXISTS = "BIZ_5232",

  // File/Upload Errors (6xxx)
  FILE_TOO_LARGE = "FILE_6001",
  INVALID_FILE_TYPE = "FILE_6002",
  UPLOAD_FAILED = "FILE_6003",
  FILE_NOT_FOUND = "FILE_6004",
  STORAGE_ERROR = "FILE_6005",

  // Database Errors (7xxx)
  DATABASE_ERROR = "DB_7001",
  TRANSACTION_FAILED = "DB_7002",
  QUERY_TIMEOUT = "DB_7003",
  CONSTRAINT_VIOLATION = "DB_7004",
  DUPLICATE_ENTRY = "DB_7005",

  // External Service Errors (8xxx)
  EXTERNAL_SERVICE_ERROR = "EXT_8001",
  PAYMENT_GATEWAY_ERROR = "EXT_8002",
  SMS_SERVICE_ERROR = "EXT_8003",
  EMAIL_SERVICE_ERROR = "EXT_8004",
  STORAGE_SERVICE_ERROR = "EXT_8005",

  // Rate Limiting (9xxx)
  RATE_LIMIT_EXCEEDED = "RATE_9001",
  TOO_MANY_REQUESTS = "RATE_9002",
  TOO_MANY_LOGIN_ATTEMPTS = "RATE_9003",

  // System Errors (9xxx)
  SYS_9001 = "SYS_9001",
  INTERNAL_SERVER_ERROR = "SYS_9999",
  SERVICE_UNAVAILABLE = "SYS_9998",
  MAINTENANCE_MODE = "SYS_9997",
}

/**
 * Error messages mapped to error codes
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Authentication & Authorization
  [ErrorCode.INVALID_CREDENTIALS]: "Invalid phone number or password",
  [ErrorCode.USER_NOT_FOUND]: "User not found",
  [ErrorCode.ACCOUNT_LOCKED]:
    "Account is locked due to multiple failed login attempts",
  [ErrorCode.TOKEN_EXPIRED]: "Authentication token has expired",
  [ErrorCode.TOKEN_INVALID]: "Invalid authentication token",
  [ErrorCode.REFRESH_TOKEN_INVALID]: "Invalid or expired refresh token",
  [ErrorCode.UNAUTHORIZED]: "You are not authorized to access this resource",
  [ErrorCode.FORBIDDEN]: "You do not have permission to perform this action",
  [ErrorCode.TWO_FACTOR_REQUIRED]: "Two-factor authentication is required",
  [ErrorCode.TWO_FACTOR_INVALID]: "Invalid two-factor authentication code",
  [ErrorCode.PASSWORD_RESET_EXPIRED]: "Password reset link has expired",
  [ErrorCode.EMAIL_NOT_VERIFIED]: "Email address is not verified",
  [ErrorCode.PHONE_NOT_VERIFIED]: "Phone number is not verified",
  [ErrorCode.TOKEN_REVOKED]: "Token has been revoked",
  [ErrorCode.INVALID_LOGIN_METHOD]:
    "Invalid login method for your account type",
  [ErrorCode.INVALID_TOKEN]: "Invalid or malformed authentication token",
  [ErrorCode.INSUFFICIENT_PERMISSIONS]:
    "You do not have sufficient permissions for this action",

  // User Management
  [ErrorCode.USER_ALREADY_EXISTS]: "User with this phone number already exists",
  [ErrorCode.EMAIL_ALREADY_EXISTS]: "Email address is already registered",
  [ErrorCode.PHONE_ALREADY_EXISTS]: "Phone number is already registered",
  [ErrorCode.INVALID_USER_ID]: "Invalid user ID",
  [ErrorCode.PROFILE_UPDATE_FAILED]: "Failed to update profile",
  [ErrorCode.AVATAR_UPLOAD_FAILED]: "Failed to upload avatar",
  [ErrorCode.PASSWORD_CHANGE_FAILED]: "Failed to change password",
  [ErrorCode.WEAK_PASSWORD]: "Password does not meet security requirements",

  // Validation Errors
  [ErrorCode.VALIDATION_ERROR]: "Validation error",
  [ErrorCode.VALIDATION_FAILED]: "Validation failed",
  [ErrorCode.INVALID_INPUT]: "Invalid input provided",
  [ErrorCode.MISSING_REQUIRED_FIELD]: "Required field is missing",
  [ErrorCode.INVALID_FORMAT]: "Invalid format",
  [ErrorCode.INVALID_DATE_RANGE]: "Invalid date range",
  [ErrorCode.INVALID_EMAIL_FORMAT]: "Invalid email format",
  [ErrorCode.INVALID_PHONE_FORMAT]: "Invalid phone number format",

  // Resource Errors
  [ErrorCode.RESOURCE_NOT_FOUND]: "Resource not found",
  [ErrorCode.CLASS_NOT_FOUND]: "Class not found",
  [ErrorCode.EXAM_NOT_FOUND]: "Exam not found",
  [ErrorCode.ENROLLMENT_NOT_FOUND]: "Enrollment not found",
  [ErrorCode.PUBLICATION_NOT_FOUND]: "Publication not found",
  [ErrorCode.MATERIAL_NOT_FOUND]: "Course material not found",
  [ErrorCode.PAYMENT_NOT_FOUND]: "Payment not found",
  [ErrorCode.TEACHER_NOT_FOUND]: "Teacher not found",
  [ErrorCode.GRADE_NOT_FOUND]: "Grade not found",
  [ErrorCode.MEDIUM_NOT_FOUND]: "Medium not found",
  [ErrorCode.SUBJECT_NOT_FOUND]: "Subject not found",
  [ErrorCode.ACADEMIC_YEAR_NOT_FOUND]: "Academic year not found",
  [ErrorCode.TEACHER_ASSIGNMENT_NOT_FOUND]: "Teacher assignment not found",

  // Business Logic Errors
  [ErrorCode.ENROLLMENT_FULL]: "Class enrollment is full",
  [ErrorCode.ENROLLMENT_CLOSED]: "Enrollment for this class is closed",
  [ErrorCode.ALREADY_ENROLLED]: "You are already enrolled in this class",
  [ErrorCode.INSUFFICIENT_FUNDS]: "Insufficient funds in wallet",
  [ErrorCode.PAYMENT_FAILED]: "Payment processing failed",
  [ErrorCode.EXAM_ALREADY_SUBMITTED]: "Exam has already been submitted",
  [ErrorCode.EXAM_NOT_STARTED]: "Exam has not started yet",
  [ErrorCode.EXAM_EXPIRED]: "Exam has expired",
  [ErrorCode.INVALID_EXAM_STATE]: "Invalid exam state",
  [ErrorCode.CLASS_ALREADY_STARTED]: "Class has already started",
  [ErrorCode.CANNOT_DELETE_ACTIVE_CLASS]: "Cannot delete an active class",
  [ErrorCode.BUSINESS_RULE_VIOLATION]: "Business rule violation",
  [ErrorCode.ONLY_TEACHERS_CAN_CREATE_CLASSES]:
    "Only teachers can create classes",
  [ErrorCode.TEACHER_NO_ACTIVE_ASSIGNMENT]:
    "Teacher does not have an active assignment for this subject/grade/medium",
  [ErrorCode.EXTERNAL_TEACHER_RESTRICTION]:
    "External teachers are not allowed to perform this action",
  [ErrorCode.NO_CURRENT_ACADEMIC_YEAR]: "No current academic year has been set",
  [ErrorCode.ONLY_CLASS_TEACHER_CAN_MODIFY]:
    "Only the class teacher can modify this class",
  [ErrorCode.CANNOT_MODIFY_COMPLETED_CLASS]: "Cannot modify a completed class",
  [ErrorCode.STUDENT_ALREADY_ENROLLED]:
    "Student is already enrolled in this class",
  [ErrorCode.STUDENT_NOT_ENROLLED]: "Student is not enrolled in this class",
  [ErrorCode.ONLY_STUDENTS_CAN_ENROLL]:
    "Only students can be enrolled in classes",
  [ErrorCode.CLASS_NOT_ACTIVE]: "Cannot enroll in an inactive class",
  [ErrorCode.CLASS_CAPACITY_FULL]: "Class has reached maximum capacity",
  [ErrorCode.CLASS_NOT_LIVE]: "Class is not currently live",
  [ErrorCode.CLASS_ALREADY_LIVE]: "Class is already live",
  [ErrorCode.ONLY_ASSIGNED_TEACHER_CAN_START]:
    "Only the assigned teacher can start/stop this class",
  [ErrorCode.MEDIUM_REQUIRED]: "Medium is required for this operation",
  [ErrorCode.ONLY_ASSIGNED_TEACHER_CAN_STOP]:
    "Only the assigned teacher can stop this class",
  [ErrorCode.ONLY_TEACHERS_ADMINS_CAN_CREATE]:
    "Only teachers and admins can create exams",
  [ErrorCode.ONLY_OWN_CLASS_EXAMS]:
    "You can only create exams for your own classes",
  [ErrorCode.TEACHER_PROFILE_NOT_FOUND]: "Teacher profile not found",
  [ErrorCode.NOT_ENROLLED_IN_CLASS]: "You are not enrolled in this class",
  [ErrorCode.EXAM_NOT_AVAILABLE]: "Exam is not available",
  [ErrorCode.EXAM_NOT_ACTIVE]: "Exam is not currently active",
  [ErrorCode.MAX_ATTEMPTS_EXCEEDED]: "Maximum attempts exceeded",
  [ErrorCode.EXAM_ATTEMPT_NOT_IN_PROGRESS]: "Exam attempt is not in progress",
  [ErrorCode.ACCESS_DENIED]: "Access denied",
  [ErrorCode.EXAM_PENDING_APPROVAL]: "Exam is not pending approval",
  [ErrorCode.RANKING_NOT_ENABLED]: "Ranking is not enabled for this exam",
  [ErrorCode.ONLY_ADMINS_CAN_PERFORM]: "Only admins can perform this action",
  [ErrorCode.QUESTION_NOT_FOUND]: "Question not found",
  [ErrorCode.EXAM_ATTEMPT_NOT_FOUND]: "Exam attempt not found",
  [ErrorCode.STUDENT_NOT_FOUND]: "Student not found",

  // Exam Timing Validation
  [ErrorCode.EXAM_END_BEFORE_START]: "Exam end time must be after start time",
  [ErrorCode.WINDOW_END_BEFORE_START]:
    "Window end time must be after window start time",
  [ErrorCode.WINDOW_START_BEFORE_EXAM]:
    "Window start must be on or after exam start time",
  [ErrorCode.WINDOW_END_AFTER_EXAM]:
    "Window end must be on or before exam end time",
  [ErrorCode.EXAM_DURATION_EXCEEDS_WINDOW]:
    "Exam duration exceeds the flexible window duration",
  [ErrorCode.EXAM_DURATION_EXCEEDS_TIME]:
    "Exam duration exceeds available time window",
  [ErrorCode.INVALID_WINDOW_CONFIG]:
    "Both windowStart and windowEnd must be provided for windowed exams, or neither for strict-time exams",

  // Class-Teacher Validation
  [ErrorCode.CLASS_TEACHER_MISMATCH]:
    "Class teacher ID does not match the current user",
  [ErrorCode.ASSIGNMENT_TEACHER_MISMATCH]:
    "Class teacher assignment does not match the class teacher",
  [ErrorCode.ASSIGNMENT_SUBJECT_MISMATCH]:
    "Teacher assignment subject does not match class subject",
  [ErrorCode.ASSIGNMENT_GRADE_MISMATCH]:
    "Teacher assignment grade does not match class grade",
  [ErrorCode.ASSIGNMENT_MEDIUM_MISMATCH]:
    "Teacher assignment medium does not match class medium",

  // Transfer Request Errors
  [ErrorCode.ACTIVE_TRANSFER_EXISTS]:
    "You already have an active mutual transfer request",
  [ErrorCode.ZONE_NOT_FOUND]: "Zone not found",
  [ErrorCode.SUBJECT_REQUIRED]: "Valid subject is required",
  [ErrorCode.MEDIUM_REQUIRED_TRANSFER]: "Valid medium is required",
  [ErrorCode.TRANSFER_NOT_FOUND]: "Transfer request not found",
  [ErrorCode.CANNOT_CANCEL_COMPLETED_TRANSFER]:
    "Cannot cancel completed requests",
  [ErrorCode.CANNOT_ACCEPT_UNVERIFIED]: "Cannot accept unverified requests",
  [ErrorCode.TRANSFER_NOT_AVAILABLE]: "Request is not available for acceptance",
  [ErrorCode.PROFILE_MISMATCH]: "Profile does not match transfer requirements",
  [ErrorCode.CANNOT_MATCH_SELF]: "Cannot match with your own request",
  [ErrorCode.TRANSFER_ALREADY_VERIFIED]: "Transfer request is already verified",
  [ErrorCode.CAN_ONLY_COMPLETE_MATCHED]: "Can only complete matched transfers",
  [ErrorCode.MESSAGE_NOT_FOUND]: "Message not found",
  [ErrorCode.CANNOT_DELETE_OTHERS_MESSAGE]:
    "Cannot delete messages from others",
  [ErrorCode.ONLY_ADMINS_CAN_VERIFY]:
    "Only admins can verify transfer requests",
  [ErrorCode.ONLY_OWNERS_CAN_CANCEL]: "Only the request owner can cancel",
  [ErrorCode.ONLY_OWNERS_CAN_UPDATE]: "Only the request owner can update",
  [ErrorCode.CANNOT_UPDATE_NON_PENDING]: "Cannot update non-pending requests",
  [ErrorCode.CANNOT_VIEW_TRANSFER]:
    "You do not have permission to view this transfer",
  [ErrorCode.TRANSFER_REQUEST_NOT_FOUND]: "Transfer request not found",
  [ErrorCode.ACCEPTANCE_NOT_FOUND]: "Interest/acceptance not found",
  [ErrorCode.INVALID_REQUEST]: "Invalid request",

  // Video Session Errors
  [ErrorCode.VIDEO_SESSION_NOT_FOUND]: "Video session not found",
  [ErrorCode.NOT_CLASS_TEACHER]: "You are not the teacher of this class",
  [ErrorCode.NOT_SESSION_HOST]: "Only the session host can perform this action",
  [ErrorCode.SESSION_NOT_ACTIVE]: "Session is not currently active",
  [ErrorCode.SESSION_NOT_SCHEDULED]: "Session is not in scheduled state",
  [ErrorCode.NO_SESSION_ACCESS]: "You do not have access to this session",
  [ErrorCode.NOT_ENROLLED_SESSION_CLASS]: "You are not enrolled in this class",
  [ErrorCode.ALREADY_ENDED]: "Session has already ended",
  [ErrorCode.CAN_ONLY_UPDATE_SCHEDULED]: "Can only update scheduled sessions",

  // Payment Errors
  [ErrorCode.PAYMENT_NOT_PENDING]: "Payment is not in pending status",
  [ErrorCode.PAYMENT_NOT_COMPLETED]: "Payment is not in completed status",
  [ErrorCode.ALREADY_ENROLLED_CLASS]: "User is already enrolled in this class",
  [ErrorCode.BANK_SLIP_REQUIRED]: "Payment must be a bank slip payment",
  [ErrorCode.TRACKER_PLUS_REQUIRED]: "Payment must be a Tracker Plus payment",
  [ErrorCode.REFUND_WINDOW_EXPIRED]: "Refund window has expired",

  // Wallet Errors
  [ErrorCode.AMOUNT_MUST_BE_POSITIVE]: "Amount must be greater than zero",
  [ErrorCode.ONLY_TEACHERS_WITHDRAW]: "Only teachers can withdraw funds",
  [ErrorCode.INSUFFICIENT_WALLET_BALANCE]: "Insufficient wallet balance",
  [ErrorCode.WALLET_FROZEN]: "Wallet is frozen",
  [ErrorCode.MAX_BALANCE_EXCEEDED]: "Transaction would exceed maximum balance",

  // Teacher Availability Errors
  [ErrorCode.LEAVE_NOT_FOUND]: "Leave request not found",
  [ErrorCode.START_BEFORE_END_DATE]: "Start date must be before end date",
  [ErrorCode.LEAVE_CONFLICT]: "Leave dates conflict with existing leave",
  [ErrorCode.ONLY_PENDING_CAN_APPROVE]: "Only pending leaves can be approved",
  [ErrorCode.ONLY_PENDING_CAN_REJECT]: "Only pending leaves can be rejected",
  [ErrorCode.ONLY_PENDING_CAN_CANCEL]:
    "Only pending or approved leaves can be cancelled",
  [ErrorCode.LEAVE_ALREADY_CANCELLED]: "Leave is already cancelled",

  // Marking Errors
  [ErrorCode.NO_MARKING_ACCESS]: "You do not have access to mark this exam",
  [ErrorCode.ANSWER_NOT_FOUND]: "Answer not found",
  [ErrorCode.CANNOT_MARK_ATTEMPTED]: "Cannot mark answered questions",

  // Timetable Errors
  [ErrorCode.TIMETABLE_NOT_FOUND]: "Timetable entry not found",
  [ErrorCode.USER_MUST_BE_TEACHER]: "User must be a teacher",
  [ErrorCode.GRADE_ID_REQUIRED]: "Grade ID is required",
  [ErrorCode.SUBJECT_ID_REQUIRED]: "Subject ID is required",
  [ErrorCode.MEDIUM_ID_REQUIRED]: "Medium ID is required for this operation",
  [ErrorCode.TIMETABLE_CONFLICT]: "Timetable conflict detected",
  [ErrorCode.ONLY_OWN_TIMETABLE]:
    "You can only modify your own timetable entries",
  [ErrorCode.TIMETABLE_CHANGE_NOT_FOUND]: "Timetable change not found",
  [ErrorCode.ONLY_OWN_CHANGES]: "You can only delete your own changes",
  [ErrorCode.INVALID_NEW_TEACHER]: "Invalid new teacher specified",
  [ErrorCode.CHANGE_TYPE_REQUIRED]: "Change type is required",
  [ErrorCode.RESCHEDULE_DATE_REQUIRED]:
    "Reschedule date is required for this change type",

  // Attendance Business Logic Errors
  [ErrorCode.ATTENDANCE_SESSION_NOT_STARTED]:
    "Session must be ended before auto-marking attendance",
  [ErrorCode.ONLY_ADMIN_DELETE_ATTENDANCE]:
    "Only admins can delete attendance records",

  // Promotion and Business Logic Errors
  [ErrorCode.SETTING_NOT_EDITABLE]: "Setting is not editable",
  [ErrorCode.ACCESS_EXPIRED]: "Access to this resource has expired",
  [ErrorCode.DOWNLOAD_LIMIT_REACHED]: "Maximum download limit reached",
  [ErrorCode.PUBLICATION_ALREADY_PURCHASED]: "Publication already purchased",
  [ErrorCode.RECONCILIATION_ALREADY_MATCHED]: "Reconciliation already matched",
  [ErrorCode.PAYMENT_ALREADY_RECONCILED]: "Payment already reconciled",
  [ErrorCode.PENDING_PROMOTION_EXISTS]:
    "Student already has a pending promotion for this academic year",
  [ErrorCode.BATCH_TRANSFER_TYPE_REQUIRED]:
    "Batch change requires promotionType to be BATCH_TRANSFER",
  [ErrorCode.PROMOTION_NOT_PENDING]: "Promotion is not in pending status",
  [ErrorCode.CANNOT_DELETE_COMPLETED_PROMOTION]:
    "Cannot delete a completed promotion",
  [ErrorCode.ACCESS_ALREADY_ACTIVE]:
    "User already has active access to this resource",
  [ErrorCode.ACCESS_ALREADY_REVOKED]: "Access is already revoked or expired",
  [ErrorCode.EXCEPTION_PENDING_EXISTS]:
    "A pending exception of this type already exists for this student",
  [ErrorCode.TIME_EXTENSION_REQUIRED]:
    "Time extension must be greater than 0 minutes for TIME_EXTENSION type",
  [ErrorCode.EXCEPTION_NOT_PENDING]: "Exception is not in pending status",
  [ErrorCode.EXCEPTION_NOT_APPROVED]: "Exception is not in approved status",
  [ErrorCode.RECONCILIATION_NOT_MATCHED]: "Reconciliation is not matched",
  [ErrorCode.RECONCILIATION_NOT_DISPUTED]:
    "Only disputed reconciliations can be resolved",
  [ErrorCode.STUDENT_NO_CURRENT_GRADE]: "Student does not have a current grade",
  [ErrorCode.STUDENT_PROFILE_MISSING]:
    "Student profile not found - cannot complete operation",
  [ErrorCode.PUBLICATION_NOT_AVAILABLE]:
    "Publication is not available for purchase",
  [ErrorCode.PUBLICATION_HAS_PURCHASES]:
    "Cannot delete publication with existing purchases",
  [ErrorCode.PUBLICATION_NOT_PURCHASED]: "Publication not purchased",
  [ErrorCode.INSUFFICIENT_QUESTIONS]: "Insufficient questions available",
  [ErrorCode.RESCHEDULING_CONFLICT]:
    "A rescheduling request already exists for this class on this date",
  [ErrorCode.BATCH_ALREADY_EXISTS]:
    "Batch with this code already exists in this grade",
  [ErrorCode.MESSAGE_NOT_PENDING]: "Message is not pending approval",
  [ErrorCode.ONLY_OWN_MESSAGES]:
    "You can only perform this action on your own messages",
  [ErrorCode.MAX_GRADES_REACHED]: "Maximum number of grades reached",
  [ErrorCode.TWO_FA_NOT_SETUP]: "2FA is not set up for this account",
  [ErrorCode.TWO_FA_NOT_ENABLED]: "2FA is not enabled for this account",

  // Attendance & Announcements Resources
  [ErrorCode.ATTENDANCE_NOT_FOUND]: "Attendance record not found",
  [ErrorCode.ANNOUNCEMENT_NOT_FOUND]: "Announcement not found",

  // Additional Resource Errors
  [ErrorCode.PARTICIPANT_NOT_FOUND]: "Participant record not found",
  [ErrorCode.RECORDING_NOT_AVAILABLE]:
    "Recording not available for this session",
  [ErrorCode.PROMOTION_NOT_FOUND]: "Promotion not found",
  [ErrorCode.SETTING_NOT_FOUND]: "Setting not found",
  [ErrorCode.RECONCILIATION_NOT_FOUND]: "Reconciliation record not found",
  [ErrorCode.EXCEPTION_NOT_FOUND]: "Exception not found",
  [ErrorCode.TEMPORARY_ACCESS_NOT_FOUND]: "Temporary access not found",
  [ErrorCode.QUESTION_CATEGORY_NOT_FOUND]: "Question category not found",
  [ErrorCode.QUESTION_TAG_NOT_FOUND]: "Question tag not found",
  [ErrorCode.INVOICE_NOT_FOUND]: "Invoice not found",
  [ErrorCode.PROCTORING_SESSION_NOT_FOUND]: "Proctoring session not found",
  [ErrorCode.RESCHEDULING_NOT_FOUND]: "Rescheduling not found",
  [ErrorCode.BATCH_NOT_FOUND]: "Batch not found",

  // Stripe/Payment Gateway Errors
  [ErrorCode.STRIPE_INTENT_FAILED]: "Failed to create payment intent",
  [ErrorCode.STRIPE_CONFIRM_FAILED]: "Failed to confirm payment",
  [ErrorCode.STRIPE_REFUND_FAILED]: "Failed to create refund",
  [ErrorCode.WEBHOOK_NOT_CONFIGURED]: "Webhook secret not configured",
  [ErrorCode.INVALID_WEBHOOK_SIGNATURE]: "Invalid webhook signature",
  [ErrorCode.STRIPE_CUSTOMER_FAILED]: "Failed to create customer",
  [ErrorCode.STRIPE_CUSTOMER_DELETED]: "Customer has been deleted",
  [ErrorCode.STRIPE_RETRIEVE_FAILED]: "Failed to retrieve payment information",

  // Invoice Errors
  [ErrorCode.INVOICE_ALREADY_PAID]: "Invoice is already paid",
  [ErrorCode.INVOICE_ALREADY_CANCELLED]: "Invoice is already cancelled",
  [ErrorCode.CANNOT_UPDATE_PAID_INVOICE]: "Cannot update a paid invoice",
  [ErrorCode.CANNOT_CANCEL_PAID_INVOICE]: "Cannot cancel a paid invoice",
  [ErrorCode.CANNOT_DELETE_PAID_INVOICE]: "Cannot delete a paid invoice",
  [ErrorCode.NO_TARGETING_CRITERIA_MATCH]:
    "No users match the targeting criteria",
  [ErrorCode.INVALID_EVENT_TYPE]: "Invalid event type",
  [ErrorCode.INVALID_SEVERITY_LEVEL]: "Invalid severity level",
  [ErrorCode.CAN_ONLY_UPDATE_OWN_MATERIALS]:
    "You can only update your own materials",
  [ErrorCode.INVALID_INVOICE_STATE]: "Invalid invoice state",
  [ErrorCode.NO_ACTIVE_ENROLLMENTS]:
    "No active enrollments found for this student",
  [ErrorCode.INVOICE_ALREADY_EXISTS]:
    "Invoice already exists for this enrollment",
  [ErrorCode.GRADE_ALREADY_EXISTS]:
    "Grade with this name or level already exists",

  // File/Upload Errors
  [ErrorCode.FILE_TOO_LARGE]: "File size exceeds maximum allowed",
  [ErrorCode.INVALID_FILE_TYPE]: "Invalid file type",
  [ErrorCode.UPLOAD_FAILED]: "File upload failed",
  [ErrorCode.FILE_NOT_FOUND]: "File not found",
  [ErrorCode.STORAGE_ERROR]: "Storage service error",

  // Database Errors
  [ErrorCode.DATABASE_ERROR]: "Database error occurred",
  [ErrorCode.TRANSACTION_FAILED]: "Database transaction failed",
  [ErrorCode.QUERY_TIMEOUT]: "Database query timeout",
  [ErrorCode.CONSTRAINT_VIOLATION]: "Database constraint violation",
  [ErrorCode.DUPLICATE_ENTRY]: "Duplicate entry",

  // External Service Errors
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: "External service error",
  [ErrorCode.PAYMENT_GATEWAY_ERROR]: "Payment gateway error",
  [ErrorCode.SMS_SERVICE_ERROR]: "SMS service error",
  [ErrorCode.EMAIL_SERVICE_ERROR]: "Email service error",
  [ErrorCode.STORAGE_SERVICE_ERROR]: "Storage service error",

  // Rate Limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: "Rate limit exceeded",
  [ErrorCode.TOO_MANY_REQUESTS]: "Too many requests. Please try again later",
  [ErrorCode.TOO_MANY_LOGIN_ATTEMPTS]:
    "Too many login attempts. Please try again later",

  // System Errors
  [ErrorCode.SYS_9001]: "Critical system error occurred",
  [ErrorCode.INTERNAL_SERVER_ERROR]: "An unexpected error occurred",
  [ErrorCode.SERVICE_UNAVAILABLE]: "Service temporarily unavailable",
  [ErrorCode.MAINTENANCE_MODE]: "System is under maintenance",
};
