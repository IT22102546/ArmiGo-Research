"use client";

import { useTranslations } from "next-intl";
import {
  Menu,
  X,
  Shield,
  Sun,
  Moon,
  LogOut,
  User,
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
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const { mutate: logout } = useLogoutMutation();
  const t = useTranslations();

  const handleLogout = () => {
    logout();
  };

  const profileInitials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.trim();
  const displayName =
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "User";
  const displayEmail = user?.email || "";

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-3 sm:px-4 gap-2">
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
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

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="hidden sm:inline text-base lg:text-lg font-semibold text-foreground truncate">
            {t("auth.adminPortal")}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
        {/* Global Search */}
        <div className="hidden lg:block w-56 xl:w-64">
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
                ) : profileInitials ? (
                  <span className="text-sm font-medium uppercase">
                    {profileInitials}
                  </span>
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1 min-w-0">
                <p className="text-sm font-medium leading-none truncate">
                  {displayName}
                </p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {displayEmail}
                </p>
              </div>
            </DropdownMenuLabel>
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
