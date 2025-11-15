import React from "react";

interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export const Separator: React.FC<SeparatorProps> = ({
  orientation = "horizontal",
  className = "",
}) => {
  return (
    <div
      className={`bg-border ${
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full"
      } ${className}`}
    />
  );
};
