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
  CreditCard,
  FileText,
  Bell,
  Settings,
  Shield,
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
  AlertTriangle,
  Receipt,
  ClipboardList,
  CalendarClock,
  FolderOpen,
  RefreshCw,
  Map,
  MapPin,
  Building,
  UserPlus,
  HelpCircle,
} from "lucide-react";

export default function AdminSidebar({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const user = useAuthStore((state) => state.user);
  const { mutate: logout } = useLogoutMutation();
  const t = useTranslations();

  const navigationConfig = {
    dashboard: [
      { href: "/admin", icon: LayoutDashboard, label: t("nav.dashboard") },
    ],
    users: [
      {
        href: "/admin/students",
        icon: GraduationCap,
        label: t("nav.studentManagement"),
      },
      {
        href: "/admin/teachers",
        icon: Users,
        label: t("nav.teacherManagement"),
      },
      {
        href: "/admin/enrollments",
        icon: UserPlus,
        label: t("nav.enrollmentTracking"),
      },
    ],
    geography: [
      { href: "/admin/provinces", icon: Map, label: t("nav.provinces") },
      { href: "/admin/districts", icon: MapPin, label: t("nav.districts") },
      { href: "/admin/zones", icon: MapPin, label: t("nav.zones") },
      {
        href: "/admin/institutions",
        icon: Building,
        label: t("nav.institutions"),
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
      { href: "/admin/classes", icon: School, label: t("nav.classes") },
      { href: "/admin/timetable", icon: Clock, label: t("nav.timetable") },
      {
        href: "/admin/class-rescheduling",
        icon: RefreshCw,
        label: t("nav.classRescheduling"),
      },
      {
        href: "/admin/teacher-assignments",
        icon: Calendar,
        label: t("nav.teacherAssignments"),
      },
      {
        href: "/admin/teachers/availability",
        icon: CalendarClock,
        label: t("nav.teacherLeaves"),
      },
      {
        href: "/admin/attendance",
        icon: ClipboardList,
        label: t("nav.attendance"),
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
    payments: [
      { href: "/admin/payments", icon: CreditCard, label: t("nav.payments") },
      { href: "/admin/invoices", icon: Receipt, label: t("nav.invoices") },
      {
        href: "/admin/payments/reconciliation",
        icon: ClipboardList,
        label: t("nav.reconciliation"),
      },
      {
        href: "/admin/wallet-management",
        icon: CreditCard,
        label: t("nav.wallets"),
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
        href: "/admin/course-materials",
        icon: FolderOpen,
        label: t("nav.courseMaterials"),
      },
      {
        href: "/admin/publications",
        icon: BookOpen,
        label: t("nav.publications"),
      },
    ],
    system: [
      { href: "/admin/settings", icon: Settings, label: t("nav.settings") },
      {
        href: "/admin/security/sessions",
        icon: Shield,
        label: t("nav.securitySessions"),
      },
      {
        href: "/admin/security-audit",
        icon: FileText,
        label: t("nav.auditLogs"),
      },
      {
        href: "/admin/system/errors",
        icon: AlertTriangle,
        label: t("nav.errorLogs"),
      },
      { href: "/admin/system/jobs", icon: Clock, label: t("nav.jobsMonitor") },
      {
        href: "/admin/chat",
        icon: MessageCircle,
        label: t("nav.chatModeration"),
      },
      {
        href: "/admin/mutual-transfers",
        icon: ArrowLeftRight,
        label: t("nav.mutualTransfers"),
      },
      {
        href: "/admin/feature-flags",
        icon: Settings,
        label: t("nav.featureFlags"),
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

        <NavSection title={t("sidebar.usersEnrollments")}>
          {navigationConfig.users.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </NavSection>

        <NavSection title={t("sidebar.classesScheduling")}>
          {navigationConfig.classes.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </NavSection>

        <NavSection title={t("sidebar.examsAssessments")}>
          {navigationConfig.exams.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </NavSection>

        <NavSection title={t("sidebar.paymentsFinance")}>
          {navigationConfig.payments.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </NavSection>

        <NavSection title={t("sidebar.contentResources")}>
          {navigationConfig.content.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </NavSection>

        <NavSection title={t("sidebar.geographyLocations")}>
          {navigationConfig.geography.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </NavSection>

        <NavSection title={t("sidebar.academicStructure")}>
          {navigationConfig.academics.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </NavSection>

        <NavSection title={t("sidebar.systemSettings")}>
          {navigationConfig.system.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </NavSection>
      </div>
      <LogoutButton />
    </div>
  );
}
