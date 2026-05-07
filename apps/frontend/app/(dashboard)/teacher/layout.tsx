"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import TeacherHeader from "@/components/layouts/teacher/TeacherHeader";
import TeacherSidebar from "@/components/layouts/teacher/TeacherSidebar";
import { cn } from "@/lib/utils";

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

        <div className="relative flex h-[calc(100dvh-4rem)]">
          {sidebarOpen && (
            <button
              type="button"
              className="fixed inset-0 top-16 z-30 bg-black/40 md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            />
          )}

          <div
            className={cn(
              "fixed inset-y-16 left-0 z-40 w-64 border-r border-border bg-background transition-transform duration-300 md:static md:inset-auto md:z-auto md:translate-x-0 md:transition-all",
              sidebarOpen
                ? "translate-x-0 md:w-64"
                : "-translate-x-full md:w-0"
            )}
          >
            <TeacherSidebar collapsed={!sidebarOpen} />
          </div>

          <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
