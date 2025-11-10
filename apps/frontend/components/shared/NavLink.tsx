"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface NavLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number | string;
  disabled?: boolean;
}

export function NavLink({
  href,
  icon: Icon,
  label,
  badge,
  disabled,
}: NavLinkProps) {
  const pathname = usePathname();
  // For exact matches like /admin, only highlight if pathname is exactly /admin
  // For other routes, also check if it starts with href/
  const isActive =
    href === "/admin" || href === "/teacher" || href === "/student"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  if (disabled) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground cursor-not-allowed opacity-50">
        <Icon className="h-5 w-5" />
        <span className="text-sm">{label}</span>
        {badge !== undefined && (
          <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2 rounded-lg text-foreground hover:bg-muted transition-all duration-200 group",
        isActive && "bg-primary/10 text-primary font-medium"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 group-hover:scale-110 transition-transform",
          isActive && "text-primary"
        )}
      />
      <span className="text-sm">{label}</span>
      {badge !== undefined && (
        <span
          className={cn(
            "ml-auto text-xs px-2 py-0.5 rounded-full",
            isActive ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

interface NavSectionProps {
  title: string;
  children: React.ReactNode;
}

export function NavSection({ title, children }: NavSectionProps) {
  return (
    <div className="space-y-1">
      <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function NavDivider() {
  return <div className="my-4 border-t border-border" />;
}
