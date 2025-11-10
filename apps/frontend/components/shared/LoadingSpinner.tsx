"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

export function LoadingSpinner({
  size = "md",
  text,
  fullScreen = false,
  overlay = false,
  className,
}: LoadingSpinnerProps) {
  const t = useTranslations("shared.loading");
  const displayText = text ?? t("text");

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className
      )}
      role="status"
      aria-label={displayText}
    >
      <Loader2
        className={cn("animate-spin text-primary", sizeClasses[size])}
        aria-hidden="true"
      />
      {text && (
        <p
          className={cn(
            "text-muted-foreground animate-pulse",
            textSizeClasses[size]
          )}
        >
          {text}
        </p>
      )}
      <span className="sr-only">{displayText}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-40">
        {content}
      </div>
    );
  }

  return content;
}

// Inline loading for buttons
interface ButtonLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export function ButtonLoading({
  loading,
  children,
  loadingText,
}: ButtonLoadingProps) {
  const t = useTranslations("shared.loading");

  if (loading) {
    return (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        <span>{loadingText || t("text")}</span>
      </>
    );
  }
  return <>{children}</>;
}

// Page loading wrapper
interface PageLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  text?: string;
  minHeight?: string;
}

export function PageLoading({
  loading,
  children,
  skeleton,
  text,
  minHeight = "min-h-[400px]",
}: PageLoadingProps) {
  const t = useTranslations("shared.loading");
  const displayText = text ?? t("text");

  if (loading) {
    if (skeleton) {
      return <>{skeleton}</>;
    }
    return (
      <div className={cn("flex items-center justify-center", minHeight)}>
        <LoadingSpinner size="lg" text={displayText} />
      </div>
    );
  }
  return <>{children}</>;
}

export default LoadingSpinner;
