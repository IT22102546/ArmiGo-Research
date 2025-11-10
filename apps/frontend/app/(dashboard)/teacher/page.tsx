"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import TeacherDashboard from "@/components/features/teacher/TeacherDashboard";

function TeacherDashboardContent() {
  const router = useRouter();
  const { user } = useAuthStore();

  const isExternalTeacher = user?.role === "EXTERNAL_TEACHER";

  return (
    <>
      {/* External teachers see limited dashboard */}
      {isExternalTeacher && (
        <div className="space-y-6">
          <div className="bg-card rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">
              Welcome, External Teacher
            </h2>
            <p className="text-muted-foreground mb-6">
              As an external teacher, you have access to the mutual transfer
              system. Use this platform to find and request transfers with other
              teachers.
            </p>
            <button
              onClick={() => router.push("/teacher/transfers")}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Go to Mutual Transfers
            </button>
          </div>
        </div>
      )}

      {/* Internal teachers see full dashboard */}
      {!isExternalTeacher && <TeacherDashboard />}
    </>
  );
}

export default function TeacherPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              Loading teacher dashboard...
            </p>
          </div>
        </div>
      }
    >
      <TeacherDashboardContent />
    </Suspense>
  );
}
