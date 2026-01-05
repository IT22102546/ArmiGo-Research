// apps/frontend/lib/api/endpoints/index.ts
export { adminApi } from "./admin";
export { authApi } from "./auth";
export { batchesApi } from "./batches";
export { classesApi } from "./classes";
export { classReschedulingApi } from "./class-rescheduling";
export { courseMaterialsApi } from "./course-materials";
export { enrollmentsApi } from "./enrollments";
export { examsApi } from "./exams";
export { invoiceApi } from "./invoice";
export { markingApi } from "./marking";
export { proctoringApi } from "./proctoring";
export { searchApi } from "./search";
export { timetableApi } from "./timetable";
export { attendanceApi } from "./attendance";
export { teacherTransferApi } from "./teacher-transfers";
export { analyticsApi } from "./analytics";
export { usersApi } from "./users";
export { walletApi } from "./wallet";
export { paymentsApi } from "./payments";
export { videoApi } from "./video";
export { notificationsApi } from "./notifications";
export { publicationsApi } from "./publications";
export { healthApi } from "./health";
export { storageApi } from "./storage";
export { subjectsApi } from "./subjects";
export { auditLogsApi } from "./audit-logs";
export { gradesApi } from "./grades";
export { mediumsApi } from "./mediums";
export { academicYearsApi } from "./academic-years";
export { externalTeachersApi } from "./external-teachers";
export { chatModerationApi } from "./chat-moderation";
export { chatApi } from "./chat";
export { announcementsApi } from "./announcements";
export { systemSettingsApi } from "./system-settings";
export { featureFlagsApi } from "./feature-flags";
export { securityAuditApi } from "./security-audit";

// Re-export commonly used types for convenience
export { TransferRequestStatus } from "./teacher-transfers";
export type {
  TeacherTransferRequest,
  TeacherTransferRequestDetail,
} from "./teacher-transfers";
