"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  variant?: "default" | "gradient" | "minimal";
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  variant = "default",
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 transition-all duration-300",
        variant === "gradient" &&
          "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg p-6",
        variant === "minimal" && "border-b pb-4",
        variant === "default" && "space-y-1",
        className
      )}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          className={cn(
            "flex items-center gap-2 text-sm mb-3",
            variant === "gradient"
              ? "text-primary-foreground/80"
              : "text-muted-foreground"
          )}
          aria-label="Breadcrumb"
        >
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span
                  className={
                    variant === "gradient"
                      ? "text-primary-foreground"
                      : "text-foreground"
                  }
                >
                  {crumb.label}
                </span>
              )}
              {index < breadcrumbs.length - 1 && (
                <span aria-hidden="true">/</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className={cn(
                "p-2 rounded-lg",
                variant === "gradient"
                  ? "bg-white/10"
                  : "bg-primary/10 text-primary"
              )}
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
          )}
          <div>
            <h1
              className={cn(
                "font-bold tracking-tight",
                variant === "gradient" ? "text-3xl" : "text-2xl lg:text-3xl"
              )}
            >
              {title}
            </h1>
            {description && (
              <p
                className={cn(
                  "mt-1",
                  variant === "gradient"
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground"
                )}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;
