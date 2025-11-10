"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import TeacherHeader from "@/components/layouts/teacher/TeacherHeader";
import TeacherSidebar from "@/components/layouts/teacher/TeacherSidebar";

/**
 * Teacher Layout
 *
 * Role-based access control is handled server-side in middleware.ts
 * The middleware validates that only INTERNAL_TEACHER and EXTERNAL_TEACHER
 * can access /teacher/* routes.
 */
export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <TeacherHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="flex h-[calc(100vh-4rem)]">
          <div
            className={`${
              sidebarOpen ? "w-64" : "w-14"
            } transition-all duration-300 overflow-hidden border-r border-border`}
          >
            <TeacherSidebar collapsed={!sidebarOpen} />
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
