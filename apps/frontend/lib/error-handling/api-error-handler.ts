"use client";

// lib/error-handling/api-error-handler.ts
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("ApiErrorHandler");

export interface ApiError extends Error {
  status?: number;
  code?: string;
  response?: {
    status: number;
    data?: { message?: string };
  };
  isSessionError?: boolean;
}

/**
 * Safely cast an unknown error to ApiError for type-safe property access.
 * Always use this helper when handling caught errors.
 */
export function asApiError(error: unknown): ApiError {
  return error as ApiError;
}

/**
 * Centralized error handler for API errors
 * Shows appropriate toast messages based on error type and logs errors
 */
export function handleApiError(
  error: unknown,
  context?: string,
  customMessage?: string
): void {
  // Cast to ApiError for type safety
  const apiError = error as ApiError;

  // Build context prefix for logging
  const contextPrefix = context ? `[${context}] ` : "";

  // Log the error with full details
  logger.error(`${contextPrefix}API Error:`, {
    message: apiError.message,
    status: apiError.status,
    code: apiError.code,
    response: apiError.response,
  });

  // Don't show toast for authentication errors (handled by ApiClient)
  if (apiError.status === 401 || apiError.isSessionError) {
    return;
  }

  // Determine user-friendly message based on error type
  let userMessage: string;

  if (customMessage) {
    userMessage = customMessage;
  } else if (apiError.status === 403) {
    userMessage = "You don't have permission to perform this action";
  } else if (apiError.status === 404) {
    userMessage = apiError.message || "Resource not found";
  } else if (apiError.status === 409) {
    userMessage =
      apiError.message || "A conflict occurred. The resource may already exist";
  } else if (apiError.status === 422) {
    userMessage = apiError.message || "Invalid data provided";
  } else if (apiError.status === 429) {
    userMessage = "Too many requests. Please try again later";
  } else if (apiError.status && apiError.status >= 500) {
    userMessage = "Server error. Please try again later";
  } else if (
    apiError.name === "NetworkError" ||
    apiError.message?.includes("Network error")
  ) {
    userMessage = "Network error. Please check your connection";
  } else {
    // Use the error message from the backend if available
    userMessage = apiError.message || "An unexpected error occurred";
  }

  // Show toast with appropriate styling
  if (apiError.status && apiError.status >= 500) {
    toast.error(userMessage, {
      description: "Our team has been notified. Please try again later.",
    });
  } else {
    toast.error(userMessage);
  }
}

/**
 * Handle successful API operations with toast notifications
 */
export function handleApiSuccess(message: string, description?: string): void {
  toast.success(message, description ? { description } : undefined);
}

/**
 * Extract user-friendly error message from error object
 * Without showing a toast (for use in components that want custom toast logic)
 */
export function getErrorMessage(error: unknown): string {
  const apiError = error as ApiError;

  if (apiError.status === 403) {
    return "You don't have permission to perform this action";
  } else if (apiError.status === 404) {
    return apiError.message || "Resource not found";
  } else if (apiError.status === 409) {
    return apiError.message || "A conflict occurred";
  } else if (apiError.status === 422) {
    return apiError.message || "Invalid data provided";
  } else if (apiError.status === 429) {
    return "Too many requests. Please try again later";
  } else if (apiError.status && apiError.status >= 500) {
    return "Server error. Please try again later";
  } else if (
    apiError.name === "NetworkError" ||
    apiError.message?.includes("Network error")
  ) {
    return "Network error. Please check your connection";
  } else {
    return apiError.message || "An unexpected error occurred";
  }
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return Boolean(error && typeof error === "object" && "status" in error);
}
