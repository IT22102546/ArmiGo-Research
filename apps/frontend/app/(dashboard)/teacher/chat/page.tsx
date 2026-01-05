import { Suspense } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import TeacherChatPage from "@/components/features/teacher/TeacherChatPage";

export default function ChatPage() {
  return (
    <ProtectedRoute allowedRoles={["INTERNAL_TEACHER"]}>
      <Suspense fallback={<div>Loading...</div>}>
        <TeacherChatPage />
      </Suspense>
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "Student Chat - LearnApp Platform",
  description: "Communicate with your students",
};
