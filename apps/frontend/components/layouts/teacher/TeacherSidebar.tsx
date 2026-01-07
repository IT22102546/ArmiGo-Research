"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useLogoutMutation } from "@/lib/hooks";
import { NavLink, NavSection } from "@/components/shared";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Clock,
  Calendar,
  LogOut,
  UserPlus,
  BookOpen,
  BookLockIcon,
  MessageCircle,
  Upload,
  BarChart3,
  FileText,
  Bell,
  Video,
  Settings,
} from "lucide-react";

export default function TeacherSidebar({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const user = useAuthStore((state) => state.user);
  const { mutate: logout } = useLogoutMutation();
  const t = useTranslations();

  // Navigation configuration for internal teachers
  const navigationConfig = {
    main: [
      { href: "/teacher", icon: LayoutDashboard, label: t("nav.dashboard") },
      { href: "/teacher/classes", icon: Calendar, label: "My Sessions" },

      {
        href: "/teacher/marking",
        icon: FileText,
        label: "Live Progress Tracking",
      },
      {
        href: "/teacher/materials",
        icon: Upload,
        label: "Educational Materials",
      },
      { href: "/teacher/attendance", icon: Clock, label: t("nav.attendance") },
      { href: "/teacher/recordings", icon: Video, label: t("nav.recordings") },
    ],
    communication: [
      {
        href: "/teacher/notifications",
        icon: Bell,
        label: t("nav.notifications"),
      },
    ],
    other: [
      {
        href: "/teacher/analytics",
        icon: BarChart3,
        label: t("nav.analytics"),
      },

      { href: "/teacher/profile", icon: UserPlus, label: t("nav.profile") },
      { href: "/teacher/settings", icon: Settings, label: t("nav.settings") },
    ],
  };

  // Navigation configuration for external teachers (restricted access)
  const externalTeacherConfig = {
    main: [
      { href: "/teacher", icon: LayoutDashboard, label: t("nav.dashboard") },
      { href: "/teacher/profile", icon: UserPlus, label: t("nav.profile") },
      {
        href: "/teacher/transfers",
        icon: ArrowLeftRight,
        label: t("nav.mutualTransfer"),
      },
    ],
  };

  // Check if user is external teacher (restricted access)
  const isExternalTeacher = user?.role === "EXTERNAL_TEACHER";

  if (collapsed) {
    return null;
  }

  // Logout button component to avoid duplication
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

  // If external teacher, show restricted sidebar
  if (isExternalTeacher) {
    return (
      <div className="w-full md:w-64 bg-background border-r border-border h-full flex flex-col">
        <div className="p-4 space-y-4 overflow-y-auto flex-1 sidebar-scroll">
          <NavSection title={t("sidebar.navigations")}>
            {externalTeacherConfig.main.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </NavSection>
        </div>
        <LogoutButton />
      </div>
    );
  }

  // Full sidebar for internal teachers
  return (
    <div className="w-full md:w-64 bg-background border-r border-border h-full flex flex-col">
      <div className="p-4 space-y-4 overflow-y-auto flex-1 sidebar-scroll">
        <NavSection title={t("sidebar.main")}>
          {navigationConfig.main.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </NavSection>

        <NavSection title={t("sidebar.communication")}>
          {navigationConfig.communication.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </NavSection>

        <NavSection title={t("sidebar.other")}>
          {navigationConfig.other.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </NavSection>
      </div>
      <LogoutButton />
    </div>
  );
}
