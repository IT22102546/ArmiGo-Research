// apps/frontend/lib/api/endpoints/index.ts
export { authApi } from "./auth";
export { classesApi } from "./classes";
export { examsApi } from "./exams";
export { timetableApi } from "./timetable";
export { attendanceApi } from "./attendance";
export { transferApi } from "./transfer";
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

// Re-export types
export type * from "./auth";
export type * from "./classes";
export type * from "./exams";
export type * from "./timetable";
export type * from "./attendance";
export type * from "./transfer";
export type * from "./analytics";
export type * from "./users";
export type * from "./wallet";
export type * from "./payments";
export type * from "./video";
export type * from "./notifications";
export type * from "./publications";
export type * from "./health";
export type * from "./storage";
export type * from "./subjects";
export type * from "./audit-logs";
