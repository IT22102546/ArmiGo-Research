import { Suspense } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MyExamsPage from "@/components/features/teacher/MyExamsPage";

export default function TeacherExamsPage() {
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
        <MyExamsPage />
      </Suspense>
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "My Exams - LearnApp Platform",
  description: "Create and manage your exams",
};
