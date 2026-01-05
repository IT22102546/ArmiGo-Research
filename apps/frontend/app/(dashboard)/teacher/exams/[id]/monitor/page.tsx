import { Suspense } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LiveExamMonitoring from "@/components/features/teacher/LiveExamMonitoring";

export default function ExamMonitoringPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <ProtectedRoute allowedRoles={["INTERNAL_TEACHER"]}>
      <Suspense fallback={<div>Loading...</div>}>
        <LiveExamMonitoring examId={params.id} />
      </Suspense>
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "Exam Monitoring - LearnApp Platform",
  description: "Monitor live exam sessions",
};
