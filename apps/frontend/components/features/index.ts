// Feature components exports
// Note: Avoiding nested "export * from" to prevent Next.js serialization issues
// Import specific components from their subdirectories instead

// Direct exports for commonly used feature components
export { default as CourseMaterialsManagement } from "./course-materials/CourseMaterialsManagement";
export { default as AttendanceTracking } from "./attendance/AttendanceTracking";
export { default as AnalyticsDashboard } from "./analytics/AnalyticsDashboard";
export { default as FeaturesOverview } from "./FeaturesOverview";
export { default as TransferPortal } from "./transfer/TransferPortal";

// For other feature components, import directly from subdirectories:
// Example: import { ExamManagement } from "@/components/features/exams"
// Example: import { TimetableManagement } from "@/components/features/timetable"

// Feature Types
export interface FeatureModule {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType;
  path: string;
  permissions: string[];
  status: "available" | "maintenance" | "deprecated";
}

export interface FeatureConfig {
  courseMaterials: {
    enabled: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
    storageProvider: "local" | "s3";
  };
  attendance: {
    enabled: boolean;
    autoMarkLate: boolean;
    lateThresholdMinutes: number;
    bulkOperations: boolean;
  };
  transferPortal: {
    enabled: boolean;
    autoMatching: boolean;
    requireApproval: boolean;
    maxActiveRequests: number;
  };
  analytics: {
    enabled: boolean;
    realtimeUpdates: boolean;
    exportFormats: string[];
    retentionDays: number;
  };
}
