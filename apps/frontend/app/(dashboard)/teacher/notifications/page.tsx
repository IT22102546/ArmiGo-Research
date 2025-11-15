import { Suspense } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import TeacherNotificationsPage from "@/components/features/teacher/TeacherNotificationsPage";

export default function NotificationsPage() {
  return (
    <ProtectedRoute allowedRoles={["INTERNAL_TEACHER"]}>
      <Suspense fallback={<div>Loading...</div>}>
        <TeacherNotificationsPage />
      </Suspense>
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "Notifications - LearnApp Platform",
  description: "View and manage your notifications",
};
