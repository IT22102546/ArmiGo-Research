// Components index - centralized exports
// Note: Avoiding deep barrel exports (export * from) to prevent
// "Unsupported Server Component type: Module" errors in Next.js

// Auth components
export { AuthInitializer } from "./auth/AuthInitializer";
export { default as ProtectedRoute } from "./auth/ProtectedRoute";

// Provider components
export { Providers } from "./providers/Providers";
export { ThemeProvider } from "./providers/ThemeProvider";
export { StripeProvider } from "./providers/StripeProvider";

// Layout components
export { default as AdminHeader } from "./layouts/admin/AdminHeader";
export { default as AdminSidebar } from "./layouts/admin/AdminSidebar";
export { default as TeacherHeader } from "./layouts/teacher/TeacherHeader";
export { default as TeacherSidebar } from "./layouts/teacher/TeacherSidebar";

// Shared components - most commonly used
export { DataTable } from "./shared/DataTable";
export { LoadingSpinner, PageLoading } from "./shared/LoadingSpinner";
export { ErrorBoundary } from "./shared/ErrorBoundary";

// For other shared components, import from subdirectories
// Example: import { StatCard, CompactStatCard } from "@/components/shared"
