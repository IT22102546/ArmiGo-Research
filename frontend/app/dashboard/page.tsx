"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashHeader from "@/components/dashboard/dash-header";
import DashSidebar from "@/components/dashboard/dash-sidebar";
import DashGrade from "./pages/registration/grade";
import DashDistricts from "./pages/registration/districts";
import DashMedium from "./pages/registration/medium";
import DashZones from "./pages/registration/zones";
import DashTransfers from "./pages/registration/transfers";
import DashStudentEnrollment from "./pages/registration/enrollment";
import DashExams from "./pages/academic/dashexams";
import DashSeminar from "./pages/academic/dashseminar";
import DashAllocations from "./pages/academic/dashallocations";
import DashPublications from "./pages/academic/dashpublications";
import DashClassManagement from "./pages/academic/class-management";
import DashSubjects from "./pages/academic/dashsubjects";
import AdminChat from "./pages/chat/adminChat";
import ChatApprove from "./pages/chat/chatApprove";
import AttendanceDashboard from "./pages/academic/dashattendance";
import MyExams from "./pages/academic/myexams";
import ProfilePage from "./pages/profile/profile";
import AdminAnalytics from "./pages/analytics/admin-analytics";
import { useAuthStore } from "@/stores/auth-store";

function DashboardContent() {
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuthStore();

  // Check if user is admin
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-gray-100">
      <DashHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex h-[calc(100vh-4rem)]">
        <div
          className={`${
            sidebarOpen ? "w-64" : "w-14"
          } transition-all duration-300 overflow-hidden border-r border-border`}
        >
          <DashSidebar collapsed={!sidebarOpen} />
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {!tab && (
              <>
                {isAdmin ? (
                  <AdminAnalytics />
                ) : (
                  <div className="text-center py-12">
                    <h1 className="text-3xl font-bold text-foreground mb-4">
                      Welcome to LearnUp Platform
                    </h1>
                    <p className="text-muted-foreground">
                      Select an option from the sidebar to get started
                    </p>
                  </div>
                )}
              </>
            )}

            {tab === "profile" && <ProfilePage />}

            {tab === "transfers" && <DashTransfers />}

            {tab === "grade" && <DashGrade />}

            {tab === "medium" && <DashMedium />}

            {tab === "districts" && <DashDistricts />}

            {tab === "zones" && <DashZones />}

            {tab === "student-attendance" && <AttendanceDashboard />}

            {tab === "exam" && <DashExams onExamCreated={() => {}} onCancel={() => {}} />}

            {tab === "my-exam" && <MyExams />}

            {tab === "allocations" && <DashAllocations />}

            {tab === "seminar" && <DashSeminar />}

            {tab === "publications" && <DashPublications />}

            {tab === "class-management" && <DashClassManagement />}

            {tab === "subject-management" && <DashSubjects />}

            {tab === "student-enrollment" && <DashStudentEnrollment />}

            {tab === "student-profile" && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Student Profile</h2>
                <p className="text-muted-foreground">Student profile content</p>
              </div>
            )}

            {tab === "admin-chat" && <AdminChat />}

            {tab === "approve-chat" && <ChatApprove />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div>Loading...</div>}>
        <DashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
