import { Suspense } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ClassDetailPage from "@/components/features/teacher/ClassDetailPage";

export default function TeacherClassDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <ProtectedRoute allowedRoles={["INTERNAL_TEACHER"]}>
      <Suspense fallback={<div>Loading...</div>}>
        <ClassDetailPage classId={params.id} />
      </Suspense>
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "Class Details - LearnApp Platform",
  description: "View and manage class details",
};
