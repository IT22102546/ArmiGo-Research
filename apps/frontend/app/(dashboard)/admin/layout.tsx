"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminHeader from "@/components/layouts/admin/AdminHeader";
import AdminSidebar from "@/components/layouts/admin/AdminSidebar";

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

        <div className="flex h-[calc(100vh-4rem)]">
          <div
            className={`${
              sidebarOpen ? "w-64" : "w-14"
            } transition-all duration-300 overflow-hidden border-r border-border`}
          >
            <AdminSidebar collapsed={!sidebarOpen} />
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
