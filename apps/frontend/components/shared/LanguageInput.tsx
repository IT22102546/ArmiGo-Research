"use client";

import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getLanguageAttributes } from "@/lib/utils/fonts";
import { cn } from "@/lib/utils";
import { Keyboard, Image as ImageIcon } from "lucide-react";
import {
  VirtualKeyboard,
  type KeyboardLanguage,
} from "@/components/shared/VirtualKeyboard";

interface LanguageInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mediumName?: string;
  showVirtualKeyboard?: boolean;
  onImageUploadClick?: () => void;
}

/**
 * Language-aware Input component with optional virtual keyboard
 * Automatically applies language code, text direction, and font based on selected medium
 *
 * Usage:
 * <LanguageInput
 *   mediumName="Tamil"
 *   placeholder="Type in Tamil..."
 *   showVirtualKeyboard={true}
 * />
 */
export const LanguageInput = React.forwardRef<
  HTMLInputElement,
  LanguageInputProps
>(
  (
    {
      mediumName = "English",
      className,
      showVirtualKeyboard = false,
      onImageUploadClick,
      ...props
    },
    ref
  ) => {
    const langAttrs = getLanguageAttributes(mediumName);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const mergedRef = ref || inputRef;

    // Determine if we should show keyboard button
    // Show button when showVirtualKeyboard is true, regardless of medium loading
    const shouldShowKeyboard = showVirtualKeyboard;

    // Debug logging
    React.useEffect(() => {
      if (showVirtualKeyboard) {
        console.log("[LanguageInput] Debug:", {
          showVirtualKeyboard,
          mediumName,
          isTamilOrSinhala: ["Tamil", "Sinhala"].includes(mediumName),
          shouldShowKeyboard,
        });
      }
    }, [showVirtualKeyboard, mediumName]);

    // Map medium name to keyboard language
    const getKeyboardLanguage = (): KeyboardLanguage => {
      if (mediumName?.toLowerCase() === "tamil") return "tamil";
      if (mediumName?.toLowerCase() === "sinhala") return "sinhala";
      return "english";
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            ref={mergedRef}
            lang={langAttrs.lang}
            dir={langAttrs.dir}
            className={cn("flex-1", className)}
            style={{
              ...langAttrs.style,
              ...props.style,
            }}
            {...props}
          />
          {shouldShowKeyboard && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsKeyboardOpen(!isKeyboardOpen)}
              title={`Toggle ${mediumName} Virtual Keyboard`}
              className="h-10 w-10 p-0"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
          )}
          {onImageUploadClick && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onImageUploadClick}
              title="Upload Image"
              className="h-10 w-10 p-0"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

        {shouldShowKeyboard && (
          <VirtualKeyboard
            language={getKeyboardLanguage()}
            isOpen={isKeyboardOpen}
            onClose={() => setIsKeyboardOpen(false)}
            targetElement={
              typeof mergedRef === "object" ? mergedRef?.current : null
            }
          />
        )}
      </div>
    );
  }
);

LanguageInput.displayName = "LanguageInput";
