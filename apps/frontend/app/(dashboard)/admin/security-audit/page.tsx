"use client";

import { redirect } from "next/navigation";

export default function SecurityAuditPage() {
  // Redirect to existing system audit page
  redirect("/admin/system/audit");
}
