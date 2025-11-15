"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ImageIcon,
  Upload,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { storageApi } from "@/lib/api/endpoints/storage";
import Image from "next/image";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  maxSizeMB?: number;
  category?:
    | "profile"
    | "exam-submission"
    | "publication"
    | "document"
    | "exam-question"
    | "class-materials";
  aspectRatio?: "square" | "video" | "auto";
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function ImageUpload({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = "Click to upload or drag & drop",
  maxSizeMB = 5,
  category = "exam-question",
  aspectRatio = "auto",
}: ImageUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file (PNG, JPG, GIF)");
        return;
      }

      // Validate file size
      const maxSize = maxSizeMB * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`Image must be less than ${maxSizeMB}MB`);
        return;
      }

      setError(null);
      setStatus("uploading");

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      try {
        // Get presigned URL
        const result = await storageApi.generateUploadUrl({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          category,
        });

        // Upload to presigned URL
        await storageApi.uploadToPresignedUrl(result.uploadUrl, file);

        // Update value with the final URL
        onChange(result.fileUrl);
        setStatus("success");

        // Reset success status after a delay
        setTimeout(() => setStatus("idle"), 2000);
      } catch (err) {
        console.error("Upload failed:", err);
        setError("Failed to upload image. Please try again.");
        setStatus("error");
        setPreview(value || null);
      }
    },
    [category, maxSizeMB, onChange, value]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [disabled, handleFileSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setPreview(null);
    setStatus("idle");
    setError(null);
  };

  const aspectRatioClass = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "min-h-[120px]",
  }[aspectRatio];

  const displayImage = preview || value;

  return (
    <div className={cn("w-full", className)}>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all cursor-pointer overflow-hidden",
          aspectRatioClass,
          isDragging && "border-primary bg-primary/5 scale-[1.02]",
          !isDragging &&
            !displayImage &&
            "border-border hover:border-muted-foreground bg-muted/50 hover:bg-muted",
          displayImage && "border-transparent bg-muted",
          disabled && "opacity-50 cursor-not-allowed",
          status === "error" && "border-red-300 bg-red-50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
          aria-label="Upload image"
        />

        {displayImage ? (
          <>
            <div className="relative w-full h-full min-h-[120px]">
              <Image
                src={displayImage}
                alt="Uploaded image"
                fill
                className="object-contain p-2"
                unoptimized={displayImage.startsWith("data:")}
              />
            </div>

            {/* Overlay controls */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleClick}
                  disabled={disabled || status === "uploading"}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Replace
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleRemove}
                  disabled={disabled || status === "uploading"}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>

            {/* Status indicator */}
            {status === "uploading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Uploading...
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="absolute top-2 right-2">
                <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                  <CheckCircle2 className="h-3 w-3" />
                  Uploaded
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            {status === "uploading" ? (
              <>
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </>
            ) : (
              <>
                <div className="p-3 bg-muted rounded-full">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {placeholder}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, GIF up to {maxSizeMB}MB
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1.5 mt-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
