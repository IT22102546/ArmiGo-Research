"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLanguageAttributes } from "@/lib/utils/fonts";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Keyboard,
  Image as ImageIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  VirtualKeyboard,
  type KeyboardLanguage,
} from "@/components/shared/VirtualKeyboard";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  showFormatting?: boolean;
  label?: string;
  style?: React.CSSProperties;
  mediumName?: string;
  showVirtualKeyboard?: boolean;
  onImageUploadClick?: () => void;
}

interface FormatButton {
  icon: React.ElementType;
  label: string;
  command: string;
  value?: string;
  shortcut?: string;
}

const FORMAT_BUTTONS: FormatButton[] = [
  { icon: Bold, label: "Bold", command: "bold", shortcut: "Ctrl+B" },
  { icon: Italic, label: "Italic", command: "italic", shortcut: "Ctrl+I" },
  {
    icon: Underline,
    label: "Underline",
    command: "underline",
    shortcut: "Ctrl+U",
  },
  { icon: Strikethrough, label: "Strikethrough", command: "strikeThrough" },
];

const LIST_BUTTONS: FormatButton[] = [
  { icon: List, label: "Bullet List", command: "insertUnorderedList" },
  { icon: ListOrdered, label: "Numbered List", command: "insertOrderedList" },
];

const ALIGN_BUTTONS: FormatButton[] = [
  { icon: AlignLeft, label: "Align Left", command: "justifyLeft" },
  { icon: AlignCenter, label: "Align Center", command: "justifyCenter" },
  { icon: AlignRight, label: "Align Right", command: "justifyRight" },
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  rows = 3,
  disabled = false,
  className,
  showFormatting = true,
  label,
  style,
  mediumName,
  showVirtualKeyboard = false,
  onImageUploadClick,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>(
    {}
  );
  const isInternalUpdate = useRef(false);
  const langAttrs = getLanguageAttributes(mediumName);

  // Determine if we should show keyboard button
  // Show button when showVirtualKeyboard is true, regardless of medium loading
  const shouldShowKeyboard = showVirtualKeyboard;

  // Debug logging
  useEffect(() => {
    if (showVirtualKeyboard) {
      console.log("[RichTextEditor] Debug:", {
        showVirtualKeyboard,
        mediumName,
        isTamilOrSinhala: ["Tamil", "Sinhala"].includes(mediumName || ""),
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

  // Check which formats are active at cursor position
  const updateActiveFormats = useCallback(() => {
    const formats: Record<string, boolean> = {};

    // Check text formatting states
    formats.bold = document.queryCommandState("bold");
    formats.italic = document.queryCommandState("italic");
    formats.underline = document.queryCommandState("underline");
    formats.strikeThrough = document.queryCommandState("strikeThrough");

    // Check list states
    formats.insertUnorderedList = document.queryCommandState(
      "insertUnorderedList"
    );
    formats.insertOrderedList = document.queryCommandState("insertOrderedList");

    // Check alignment states
    formats.justifyLeft = document.queryCommandState("justifyLeft");
    formats.justifyCenter = document.queryCommandState("justifyCenter");
    formats.justifyRight = document.queryCommandState("justifyRight");

    setActiveFormats(formats);
  }, []);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      // Only update if value is different from current content
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
    isInternalUpdate.current = false;
  }, [value]);

  const execCommand = useCallback(
    (command: string, value?: string) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
      // Update active formats after command execution
      setTimeout(() => updateActiveFormats(), 0);
    },
    [updateActiveFormats]
  );

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      const html = editorRef.current.innerHTML;
      // Convert empty editor to empty string
      const cleanHtml =
        html === "<br>" || html === "<div><br></div>" ? "" : html;
      onChange(cleanHtml);
      // Update active formats after input
      updateActiveFormats();
    }
  }, [onChange, updateActiveFormats]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Handle keyboard shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            execCommand("bold");
            break;
          case "i":
            e.preventDefault();
            execCommand("italic");
            break;
          case "u":
            e.preventDefault();
            execCommand("underline");
            break;
        }
      }
      // Update active formats after key events
      setTimeout(() => updateActiveFormats(), 0);
    },
    [execCommand, updateActiveFormats]
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    // Get plain text to avoid pasting styled content from other sources
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }, []);

  const minHeight = rows * 24 + 16; // Approximate line height + padding

  const isEmpty = !value || value === "<br>" || value === "<div><br></div>";

  return (
    <div className={cn("space-y-0", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground mb-2 block">
          {label}
        </label>
      )}

      {/* Formatting Toolbar */}
      {showFormatting && (
        <div className="flex flex-wrap items-center gap-1 p-1.5 border border-b-0 rounded-t-md bg-muted/30">
          <TooltipProvider delayDuration={300}>
            {/* Text Formatting */}
            {FORMAT_BUTTONS.map((btn) => (
              <Tooltip key={btn.command}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0",
                      activeFormats[btn.command] &&
                        "bg-gray-300 dark:bg-gray-600"
                    )}
                    onClick={() => execCommand(btn.command, btn.value)}
                    disabled={disabled}
                  >
                    <btn.icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {btn.label}
                  {btn.shortcut && (
                    <span className="ml-2 text-muted-foreground">
                      {btn.shortcut}
                    </span>
                  )}
                </TooltipContent>
              </Tooltip>
            ))}

            <div className="w-px h-6 bg-border mx-1" />

            {/* List Formatting */}
            {LIST_BUTTONS.map((btn) => (
              <Tooltip key={btn.command}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0",
                      activeFormats[btn.command] &&
                        "bg-gray-300 dark:bg-gray-600"
                    )}
                    onClick={() => execCommand(btn.command)}
                    disabled={disabled}
                  >
                    <btn.icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {btn.label}
                </TooltipContent>
              </Tooltip>
            ))}

            <div className="w-px h-6 bg-border mx-1" />

            {/* Alignment */}
            {ALIGN_BUTTONS.map((btn) => (
              <Tooltip key={btn.command}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0",
                      activeFormats[btn.command] &&
                        "bg-gray-300 dark:bg-gray-600"
                    )}
                    onClick={() => execCommand(btn.command)}
                    disabled={disabled}
                  >
                    <btn.icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {btn.label}
                </TooltipContent>
              </Tooltip>
            ))}

            {shouldShowKeyboard && (
              <>
                <div className="w-px h-6 bg-border mx-1" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsKeyboardOpen(!isKeyboardOpen)}
                      className="h-8 w-8 p-0"
                      title={`Toggle ${mediumName} Virtual Keyboard`}
                    >
                      <Keyboard className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Toggle Virtual Keyboard
                  </TooltipContent>
                </Tooltip>

                {onImageUploadClick && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onImageUploadClick}
                        className="h-8 w-8 p-0"
                        title="Upload Image"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Upload Image
                    </TooltipContent>
                  </Tooltip>
                )}
              </>
            )}
          </TooltipProvider>
        </div>
      )}

      {/* Editor Area */}
      <div className="relative">
        <div
          ref={editorRef}
          lang={langAttrs.lang}
          dir={langAttrs.dir}
          contentEditable={!disabled}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onKeyUp={() => updateActiveFormats()}
          onMouseUp={() => updateActiveFormats()}
          onPaste={handlePaste}
          onFocus={() => {
            setIsFocused(true);
            updateActiveFormats();
          }}
          onBlur={() => {
            setIsFocused(false);
            setActiveFormats({});
          }}
          className={cn(
            "w-full px-3 py-2 text-sm bg-background border rounded-md",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "overflow-y-auto",
            showFormatting && "rounded-t-none",
            disabled && "opacity-50 cursor-not-allowed bg-muted",
            // Rich text content styles
            "[&_b]:font-bold [&_strong]:font-bold",
            "[&_i]:italic [&_em]:italic",
            "[&_u]:underline",
            "[&_s]:line-through [&_strike]:line-through",
            "[&_ul]:list-disc [&_ul]:ml-5 [&_ul]:my-1",
            "[&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:my-1",
            "[&_li]:my-0.5"
          )}
          style={{
            minHeight: `${minHeight}px`,
            fontFamily: langAttrs.style.fontFamily,
            ...style,
          }}
          suppressContentEditableWarning
        />

        {/* Placeholder */}
        {isEmpty && !isFocused && (
          <div className="absolute top-2 left-3 text-sm text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}

        {/* Virtual Keyboard */}
        {shouldShowKeyboard && (
          <VirtualKeyboard
            language={getKeyboardLanguage()}
            isOpen={isKeyboardOpen}
            onClose={() => setIsKeyboardOpen(false)}
            targetElement={editorRef.current}
          />
        )}
      </div>
    </div>
  );
}
