"use client";

import { TeacherTransferProfile } from "@/components/features/teacher/TeacherTransferProfile";

export default function TransferProfilePage() {
  return (
    <div className="container mx-auto p-6">
      <TeacherTransferProfile mode="view" />
    </div>
  );
}
