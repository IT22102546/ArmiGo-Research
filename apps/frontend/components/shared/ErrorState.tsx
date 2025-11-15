"use client";

import React from "react";
import { LucideIcon, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ErrorStateProps {
  title?: string;
  message?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "card" | "inline";
  className?: string;
}

export function ErrorState({
  title,
  message,
  icon: Icon = AlertCircle,
  action,
  variant = "default",
  className,
}: ErrorStateProps) {
  const t = useTranslations("shared.errorState");
  const displayTitle = title || t("title");
  const displayMessage = message || t("message");
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 text-destructive p-3 rounded-lg bg-destructive/10",
          className
        )}
        role="alert"
      >
        <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-sm font-medium">{displayTitle}</p>
          {displayMessage && (
            <p className="text-sm opacity-80">{displayMessage}</p>
          )}
        </div>
        {action && (
          <Button variant="ghost" size="sm" onClick={action.onClick}>
            <RefreshCw className="h-4 w-4 mr-1" />
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-lg border border-destructive/20 bg-destructive/5 p-6",
          className
        )}
        role="alert"
      >
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-destructive/10">
            <Icon className="h-6 w-6 text-destructive" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-destructive">{displayTitle}</h3>
            {displayMessage && (
              <p className="mt-1 text-sm text-muted-foreground">
                {displayMessage}
              </p>
            )}
            {action && (
              <Button
                variant="outline"
                size="sm"
                onClick={action.onClick}
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {action.label}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="alert"
    >
      <div className="rounded-full bg-destructive/10 p-6 mb-4">
        <Icon className="h-10 w-10 text-destructive" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {displayTitle}
      </h3>
      {displayMessage && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {displayMessage}
        </p>
      )}
      {action && (
        <Button variant="outline" onClick={action.onClick}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
