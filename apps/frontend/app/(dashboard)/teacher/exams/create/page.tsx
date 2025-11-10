"use client";

import { Suspense } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ExamBuilderWizard from "@/components/features/exams/ExamBuilderWizard";

export default function CreateExamPage() {
  return (
    <ProtectedRoute
      allowedRoles={[
        "INTERNAL_TEACHER",
        "EXTERNAL_TEACHER",
        "ADMIN",
        "SUPER_ADMIN",
      ]}
    >
      <Suspense fallback={<div>Loading...</div>}>
        <ExamBuilderWizard
          onComplete={(examId) => {
            window.location.href = `/teacher/exams/${examId}`;
          }}
        />
      </Suspense>
    </ProtectedRoute>
  );
}
