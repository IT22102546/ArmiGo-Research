import { Suspense } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import TeacherMaterialsPage from "@/components/features/teacher/TeacherMaterialsPage";

export default function MaterialsPage() {
  return (
    <ProtectedRoute allowedRoles={["INTERNAL_TEACHER"]}>
      <Suspense fallback={<div>Loading...</div>}>
        <TeacherMaterialsPage />
      </Suspense>
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "Course Materials - LearnApp Platform",
  description: "Manage your course materials",
};
