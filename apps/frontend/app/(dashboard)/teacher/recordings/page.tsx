import { Suspense } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RecordingsPage from "@/components/features/teacher/RecordingsPage";

export default function TeacherRecordingsPage() {
  return (
    <ProtectedRoute allowedRoles={["INTERNAL_TEACHER"]}>
      <Suspense fallback={<div>Loading...</div>}>
        <RecordingsPage />
      </Suspense>
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "Recordings - LearnApp Platform",
  description: "Access and share session recordings",
};
