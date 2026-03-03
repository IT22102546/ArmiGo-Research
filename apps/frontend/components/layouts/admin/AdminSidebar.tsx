"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useLogoutMutation } from "@/lib/hooks";
import { NavLink, NavSection } from "@/components/shared";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Bell,
  BarChart3,
  Video,
  Building2,
  BookLockIcon,
  ArrowLeftRight,
  LogOut,
  Layers,
  School,
  Award,
  MessageCircle,
  ClipboardList,
  CalendarClock,
  Map,
  MapPin,
  Building,
  UserPlus,
  HelpCircle,
  Lock,
} from "lucide-react";

export default function AdminSidebar({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const user = useAuthStore((state) => state.user);
  const userRoles = Array.isArray((user as any)?.roles)
    ? ((user as any).roles as string[])
    : [user?.role].filter(Boolean) as string[];
  const isHospitalScopedUser =
    userRoles.includes("HOSPITAL_ADMIN") && user?.email !== "armigo@gmail.com";
  const { mutate: logout } = useLogoutMutation();
  const t = useTranslations();

  const navigationConfig = {
    dashboard: [
      { href: "/admin", icon: LayoutDashboard, label: t("nav.dashboard") },
    ],
    users: [
      {
        href: "/admin/students",
        icon: Users,
        label: "Children Management",
      },
      {
        href: "/admin/teachers",
        icon: Users,
        label: "Physiotherapy Management",
      },
      {
        href: "/admin/enrollments",
        icon: UserPlus,
        label: "Admission Tracking",
      },
    ],
    geography: [
      { href: "/admin/provinces", icon: Map, label: t("nav.provinces") },
      { href: "/admin/districts", icon: MapPin, label: t("nav.districts") },
      { href: "/admin/zones", icon: MapPin, label: t("nav.zones") },
      {
        href: "/admin/hospitals",
        icon: Building2,
        label: "Hospitals",
      },
    ],
    academics: [
      { href: "/admin/grade", icon: Award, label: t("nav.grades") },
      { href: "/admin/subjects", icon: BookOpen, label: t("nav.subjects") },
      { href: "/admin/batches", icon: Layers, label: t("nav.batches") },
      { href: "/admin/mediums", icon: Building2, label: t("nav.mediums") },
      {
        href: "/admin/academic-year",
        icon: Calendar,
        label: t("nav.academicYears"),
      },
    ],
    classes: [
      { href: "/admin/timetable", icon: Clock, label: "Session Schedule" },
      {
        href: "/admin/teacher-assignments",
        icon: ClipboardList,
        label: "Physiotherapy Assignments",
      },
      {
        href: "/admin/teachers/availability",
        icon: CalendarClock,
        label: "Physiotherapy Availability",
      },
    ],
    exams: [
      {
        href: "/admin/exam-management",
        icon: BookLockIcon,
        label: t("nav.exams"),
      },
      {
        href: "/admin/exam-approvals",
        icon: FileText,
        label: t("nav.examApprovals"),
      },
      { href: "/admin/marking", icon: FileText, label: t("nav.marking") },
      {
        href: "/admin/rankings",
        icon: BarChart3,
        label: t("nav.rankingsResults"),
      },
      {
        href: "/admin/live-proctoring",
        icon: Video,
        label: t("nav.liveProctoring"),
      },
    ],
    content: [
      {
        href: "/admin/announcements",
        icon: Bell,
        label: t("nav.announcements"),
      },
      {
        href: "/admin/notifications",
        icon: Bell,
        label: t("nav.notifications"),
      },
      {
        href: "/admin/publications",
        icon: BookOpen,
        label: t("nav.publications"),
      },
      
    ],
  };

  if (collapsed) {
    return null;
  }

  const LogoutButton = () => (
    <div className="pt-4 border-t border-border sticky bottom-0 bg-background p-4">
      <button
        onClick={() => logout()}
        className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-foreground hover:bg-muted transition-all duration-200 group"
      >
        <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
        <span className="text-sm">{t("common.signOut")}</span>
      </button>
    </div>
  );

  return (
    <div className="w-full md:w-64 bg-background border-r border-border h-full flex flex-col">
      <div className="p-4 space-y-4 overflow-y-auto flex-1 sidebar-scroll">
        <NavSection title={t("sidebar.overview")}>
          {navigationConfig.dashboard.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </NavSection>

        <NavSection title="Patients & Physiotherapy">
          {navigationConfig.users.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </NavSection>

        <NavSection title="Sessions & Scheduling">
          {navigationConfig.classes.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </NavSection>

        <NavSection title={t("sidebar.contentResources")}>
          {navigationConfig.content.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </NavSection>

        {!isHospitalScopedUser ? (
          <NavSection title={t("sidebar.geographyLocations")}>
            {navigationConfig.geography.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </NavSection>
        ) : null}

      </div>
      <LogoutButton />
    </div>
  );
}
