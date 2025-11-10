import { Suspense } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MarkingQueuePage from "@/components/features/marking/MarkingQueuePageNew";

export default function TeacherMarkingPage() {
  return (
    <ProtectedRoute allowedRoles={["INTERNAL_TEACHER"]}>
      <Suspense fallback={<div>Loading...</div>}>
        <MarkingQueuePage />
      </Suspense>
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "Marking - LearnApp Platform",
  description: "Mark and grade student submissions",
};
