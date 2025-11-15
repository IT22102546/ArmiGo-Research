import { Suspense } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminChatModerationPage from "@/components/admin/AdminChatModerationPage";

export default function ChatModerationPage() {
  return (
    <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <Suspense fallback={<div>Loading...</div>}>
        <AdminChatModerationPage />
      </Suspense>
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "Chat Moderation - LearnApp Platform",
  description: "Moderate chat messages across the platform",
};
