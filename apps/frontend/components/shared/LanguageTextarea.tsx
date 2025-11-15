"use client";

import React, { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getLanguageAttributes } from "@/lib/utils/fonts";
import { cn } from "@/lib/utils";
import { Keyboard } from "lucide-react";
import {
  VirtualKeyboard,
  type KeyboardLanguage,
} from "@/components/shared/VirtualKeyboard";

interface LanguageTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  mediumName?: string;
  showVirtualKeyboard?: boolean;
}

/**
 * Language-aware Textarea component with optional virtual keyboard
 * Automatically applies language code, text direction, and font based on selected medium
 *
 * Usage:
 * <LanguageTextarea
 *   mediumName="Tamil"
 *   placeholder="Type in Tamil..."
 *   showVirtualKeyboard={true}
 * />
 */
export const LanguageTextarea = React.forwardRef<
  HTMLTextAreaElement,
  LanguageTextareaProps
>(
  (
    {
      mediumName = "English",
      className,
      showVirtualKeyboard = false,
      ...props
    },
    ref
  ) => {
    const langAttrs = getLanguageAttributes(mediumName);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mergedRef = ref || textareaRef;

    // Determine if we should show keyboard button
    // Show button when showVirtualKeyboard is true, regardless of medium loading
    const shouldShowKeyboard = showVirtualKeyboard;

    // Map medium name to keyboard language
    const getKeyboardLanguage = (): KeyboardLanguage => {
      if (mediumName?.toLowerCase() === "tamil") return "tamil";
      if (mediumName?.toLowerCase() === "sinhala") return "sinhala";
      return "english";
    };

    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Textarea
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
              className="h-10 w-10 p-0 mt-1"
            >
              <Keyboard className="h-4 w-4" />
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

LanguageTextarea.displayName = "LanguageTextarea";
