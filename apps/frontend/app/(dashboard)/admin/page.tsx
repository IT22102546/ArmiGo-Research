"use client";

import { Suspense } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import ComprehensiveAdminDashboard from "@/components/features/analytics/ComprehensiveAdminDashboard";

function AdminDashboardContent() {
  return <ComprehensiveAdminDashboard />;
}

export default function AdminDashboard() {
  return (
    <Suspense
      fallback={<LoadingSpinner fullScreen text="Loading admin dashboard..." />}
    >
      <AdminDashboardContent />
    </Suspense>
  );
}

