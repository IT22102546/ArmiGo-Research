"use client";

import React from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "HOSPITAL_ADMIN"]}>
      {children}
    </ProtectedRoute>
  );
}