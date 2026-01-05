"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Menu,
  X,
  Shield,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  UserCircle,
  Lock,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { useLogoutMutation } from "@/lib/hooks";
import { GlobalSearch } from "@/components/shared/global-search";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

interface AdminHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function AdminHeader({
  sidebarOpen,
  setSidebarOpen,
}: AdminHeaderProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const { mutate: logout } = useLogoutMutation();
  const t = useTranslations();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-foreground">
            {t("auth.adminPortal")}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Search */}
        <div className="hidden md:block w-64">
          <GlobalSearch />
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={
            theme === "light" ? t("settings.darkMode") : t("settings.lightMode")
          }
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Notifications */}
        <NotificationBell />

        {/* Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={t("common.profile")}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </span>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/admin/profile")}
            >
              <UserCircle className="mr-2 h-4 w-4" />
              <span>{t("common.profile")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/admin/settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>{t("common.settings")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/admin/change-password")}
            >
              <Lock className="mr-2 h-4 w-4" />
              <span>{t("settings.changePassword")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/help")}
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>{t("common.help")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t("common.logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
