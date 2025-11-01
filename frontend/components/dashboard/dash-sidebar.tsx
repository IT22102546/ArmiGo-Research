"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import {
  LayoutDashboard,
  ArrowLeftRight,
  History,
  Clock,
  Calendar,
  Users,
  LogOut,
  ChevronDown,
  ChevronRight,
  UserPlus,
  BookOpen,
  BookCopy,
  BookOpenText,
  BookAIcon,
  UserCheck,
  MessageCircle,
  BookLockIcon,
} from "lucide-react";

export default function DashSidebar({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  // Zustand store instead of context
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams?.get("tab");
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    registration: false,
  });

  // Check if we're on dashboard without a tab parameter
  const isOnDashboard = pathname === "/dashboard" && !tab;

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev],
    }));
  };

  // Check user roles
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isTeacher =
    user?.role === "INTERNAL_TEACHER" || user?.role === "EXTERNAL_TEACHER";
  const isStudent =
    user?.role === "INTERNAL_STUDENT" || user?.role === "EXTERNAL_STUDENT";

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      show: true, // Always show dashboard for all roles
    },
    {
      id: "profile",
      label: "Profile",
      icon: UserPlus,
      href: "/dashboard?tab=profile",
      show: true, // Always show profile for all roles
    },
    {
      id: "transfers",
      label: "Mutual Transfer",
      icon: ArrowLeftRight,
      href: "/dashboard?tab=transfers",
      show: isAdmin || isTeacher, // Show for admin and teacher
    },
    {
      id: "bookings",
      label: "History",
      icon: History,
      href: "/dashboard?tab=bookings",
      show: isAdmin, // Show only for admin
    },
  ];

  const chatItems = [
    {
      id: "admin-chat",
      label: "Admin Chat",
      icon: MessageCircle,
      href: "/dashboard?tab=admin-chat",
      show: isAdmin, // Show only for admin
    },
    {
      id: "approve-chat",
      label: "Approve Chat",
      icon: MessageCircle,
      href: "/dashboard?tab=approve-chat",
      show: isAdmin || isTeacher, // Show for admin and teacher
    },
  ];

  const registrationItems = [
    {
      id: "student-enrollment",
      label: "Student Enrollment",
      icon: UserCheck,
      href: "/dashboard?tab=student-enrollment",
      show: isAdmin, // Show only for admin
    },
    {
      id: "grade",
      label: "Grade",
      icon: ChevronRight,
      href: "/dashboard?tab=grade",
      show: isAdmin, // Show only for admin
    },
    {
      id: "medium",
      label: "Medium",
      icon: ChevronRight,
      href: "/dashboard?tab=medium",
      show: isAdmin, // Show only for admin
    },
    {
      id: "districts",
      label: "Districts",
      icon: ChevronRight,
      href: "/dashboard?tab=districts",
      show: isAdmin, // Show only for admin
    },
    {
      id: "zones",
      label: "Zones",
      icon: ChevronRight,
      href: "/dashboard?tab=zones",
      show: isAdmin, // Show only for admin
    },
  ];

  const academicItems = [
    {
      id: "student-attendance",
      label: "Student Attendance",
      icon: Clock,
      href: "/dashboard?tab=student-attendance",
      show: isAdmin || isTeacher, // Show for admin and teacher
    },
    {
      id: "exam",
      label: "Exams Creation",
      icon: BookOpen,
      href: "/dashboard?tab=exam",
      show: isAdmin || isTeacher, // Show for admin and teacher
    },
    {
      id: "my-exam",
      label: isAdmin ? "Exams" : "My Exams",
      icon: BookLockIcon,
      href: "/dashboard?tab=my-exam",
      show: isAdmin || isTeacher, // Show for admin and teacher
    },
    {
      id: "allocations",
      label: "Allocations",
      icon: Calendar,
      href: "/dashboard?tab=allocations",
      show: isAdmin || isTeacher, // Show for admin and teacher
    },
    {
      id: "seminar",
      label: "Seminar",
      icon: Users,
      href: "/dashboard?tab=seminar",
      show: isAdmin || isTeacher, // Show for admin and teacher
    },
    {
      id: "publications",
      label: "Publications",
      icon: BookCopy,
      href: "/dashboard?tab=publications",
      show: isAdmin || isTeacher, // Show for admin and teacher
    },
    {
      id: "class-management",
      label: "Class Management",
      icon: BookOpenText,
      href: "/dashboard?tab=class-management",
      show: isAdmin, // Show only for admin
    },
    {
      id: "subject-management",
      label: "Subject Management",
      icon: BookAIcon,
      href: "/dashboard?tab=subject-management",
      show: isAdmin, // Show only for admin
    },
  ];

  // Filter items based on user role
  const filteredNavigationItems = navigationItems.filter((item) => item.show);
  const filteredChatItems = chatItems.filter((item) => item.show);
  const filteredRegistrationItems = registrationItems.filter(
    (item) => item.show
  );
  const filteredAcademicItems = academicItems.filter((item) => item.show);

  // Hide entire sections if no items are available
  const showRegistrationSection =
    isAdmin && filteredRegistrationItems.length > 0;
  const showChatSection = filteredChatItems.length > 0;
  const showAcademicSection = filteredAcademicItems.length > 0;

  if (collapsed) {
    return null;
  }

  // If user is student, hide all sections except dashboard
  if (isStudent) {
    return (
      <div className="w-full md:w-64 bg-background border-r border-border h-full flex flex-col">
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Navigations
            </h3>
            <div className="space-y-0.5">
              {navigationItems
                .filter((item) => item.id === "dashboard" || item.id === "profile") // Show dashboard and profile for students
                .map((item) => (
                  <Link key={item.id} href={item.href} className="block">
                    <div
                      className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg transition-all duration-200 ${
                        item.id === "dashboard" && isOnDashboard
                          ? "bg-primary/10 text-primary font-medium"
                          : tab === item.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  </Link>
                ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border sticky bottom-0 bg-background">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-foreground hover:bg-muted transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-64 bg-background border-r border-border h-full flex flex-col">
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
            Navigations
          </h3>
          <div className="space-y-0.5">
            {filteredNavigationItems.map((item) => (
              <Link key={item.id} href={item.href} className="block">
                <div
                  className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg transition-all duration-200 ${
                    item.id === "dashboard" && isOnDashboard
                      ? "bg-primary/10 text-primary font-medium"
                      : tab === item.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm">{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {showRegistrationSection && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Registration
            </h3>
            <div className="space-y-0.5">
              <div
                className="cursor-pointer"
                onClick={() => toggleSection("registration")}
              >
                <div className="flex items-center justify-between w-full px-4 py-2 rounded-lg transition-all duration-200 hover:bg-muted">
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-5 w-5" />
                    <span className="text-sm">Registration</span>
                  </div>
                  {expandedSections.registration ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </div>

              {expandedSections.registration && (
                <div className="ml-4 space-y-0.5 border-l border-border pl-2">
                  {filteredRegistrationItems.map((item) => (
                    <Link key={item.id} href={item.href} className="block">
                      <div
                        className={`flex items-center gap-3 w-full px-4 py-1.5 rounded-lg transition-all duration-200 ${
                          tab === item.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {showChatSection && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Chats
            </h3>
            <div className="space-y-0.5">
              {filteredChatItems.map((item) => (
                <Link key={item.id} href={item.href} className="block">
                  <div
                    className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg transition-all duration-200 ${
                      tab === item.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {showAcademicSection && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Academic
            </h3>
            <div className="space-y-0.5">
              {filteredAcademicItems.map((item) => (
                <Link key={item.id} href={item.href} className="block">
                  <div
                    className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg transition-all duration-200 ${
                      tab === item.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-border sticky bottom-0 bg-background">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-foreground hover:bg-muted transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
