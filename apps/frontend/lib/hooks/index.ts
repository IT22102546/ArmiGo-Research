/** Centralized hook exports. */

// Auth hooks
export { useAuth } from "./use-auth";
export { useAuthRedirect, getDashboardPath } from "./use-auth-redirect";
export { useSession } from "./use-session";
export { useTokenMonitor } from "./use-token-monitor";

// Toast/Notification hooks
export { useToast } from "./use-toast";

// Other hooks
export { useDebounce } from "./use-debounce";
// Legacy user hooks (use TanStack Query versions from ./queries instead)
// export * from "./use-users";
export { useWebSocket } from "./use-websocket";

// TanStack Query hooks
export * from "./queries";

// Note: Additional TanStack Query entity hooks available via direct import:
// - useGrades, useMediums, useUsers (lib/hooks/useGrades, etc.)
// - useSubjects, useClasses, useAcademicYears
// - useZones, useDistricts
// Import directly to avoid naming conflicts with existing query hooks
