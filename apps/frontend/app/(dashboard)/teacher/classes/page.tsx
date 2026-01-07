import { Suspense } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MyClassesPage from "@/components/features/teacher/MyClassesPage";

export default function TherapistSessionsPage() {
  return (
    <ProtectedRoute allowedRoles={["INTERNAL_TEACHER", "EXTERNAL_TEACHER"]}>
      <Suspense fallback={<div>Loading...</div>}>
        <MyClassesPage />
      </Suspense>
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "My Therapy Sessions - Hospital Platform",
  description: "Manage your patient therapy sessions and view schedules",
};
