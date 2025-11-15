"use client";

import ExamBuilderWizard from "@/components/features/exams/ExamBuilderWizard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useRouter } from "next/navigation";

export default function AdminExamCreatePage() {
  const router = useRouter();

  const handleComplete = (examId: string) => {
    router.push(`/admin/exam-detail/${examId}`);
  };

  const handleClose = () => {
    router.push("/admin/exam-management");
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
      <ExamBuilderWizard
        onComplete={handleComplete}
        onClose={handleClose}
        isAdmin={true}
      />
    </ProtectedRoute>
  );
}
