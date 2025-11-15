"use client";

import React from "react";
import { LucideIcon, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "card" | "minimal" | "illustration";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: {
    container: "py-8",
    icon: "h-8 w-8",
    iconWrapper: "p-4",
    title: "text-base",
    description: "text-sm max-w-xs",
  },
  md: {
    container: "py-12",
    icon: "h-10 w-10",
    iconWrapper: "p-6",
    title: "text-lg",
    description: "text-sm max-w-sm",
  },
  lg: {
    container: "py-16",
    icon: "h-12 w-12",
    iconWrapper: "p-8",
    title: "text-xl",
    description: "text-base max-w-md",
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  variant = "default",
  size = "md",
  className,
}) => {
  const sizes = sizeConfig[size];

  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center text-center",
          sizes.container,
          className
        )}
      >
        <Icon
          className={cn("text-muted-foreground/50 mb-3", sizes.icon)}
          aria-hidden="true"
        />
        <p className="text-muted-foreground">{title}</p>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center text-center border-2 border-dashed border-muted rounded-lg",
          sizes.container,
          "px-6",
          className
        )}
      >
        <div className="rounded-full bg-muted/50 p-4 mb-4">
          <Icon
            className={cn("text-muted-foreground", sizes.icon)}
            aria-hidden="true"
          />
        </div>
        <h3 className={cn("font-semibold mb-2", sizes.title)}>{title}</h3>
        {description && (
          <p className={cn("text-muted-foreground mb-6", sizes.description)}>
            {description}
          </p>
        )}
        {action && (
          <Button
            onClick={action.onClick}
            size={size === "sm" ? "sm" : "default"}
          >
            {action.icon && <action.icon className="h-4 w-4 mr-2" />}
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 text-center",
        sizes.container,
        className
      )}
    >
      <div
        className={cn(
          "rounded-full bg-muted mb-4 transition-transform hover:scale-105",
          sizes.iconWrapper
        )}
      >
        <Icon
          className={cn("text-muted-foreground", sizes.icon)}
          aria-hidden="true"
        />
      </div>
      <h3 className={cn("font-semibold mb-2", sizes.title)}>{title}</h3>
      {description && (
        <p className={cn("text-muted-foreground mb-6", sizes.description)}>
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button onClick={action.onClick}>
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
