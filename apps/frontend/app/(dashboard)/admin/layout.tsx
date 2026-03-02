"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminHeader from "@/components/layouts/admin/AdminHeader";
import AdminSidebar from "@/components/layouts/admin/AdminSidebar";
import { cn } from "@/lib/utils";

/**
 * Admin Layout
 *
 * Role-based access control is handled server-side in middleware.ts
 * The middleware validates that only ADMIN and SUPER_ADMIN
 * can access /admin/* routes.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  // Determine if this is the admin sign-in page - skip layout for sign-in
  const isSignInPage =
    pathname === "/admin/sign-in" || pathname === "/(dashboard)/admin/sign-in";

  // If this is the admin sign-in page, show the page directly without the header/sidebar
  if (isSignInPage) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AdminHeader
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
            <AdminSidebar collapsed={!sidebarOpen} />
          </div>

          <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
