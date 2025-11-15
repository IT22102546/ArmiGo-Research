/** Error handling utilities: categorize, log, and notify. */

import { toast } from "sonner";
import { useAuthStore, getCurrentUserSignInUrl } from "@/stores/auth-store";
import { createLogger } from "@/lib/utils/logger";
import { shouldShowNotification } from "@/lib/utils/error-suppression";

// Re-export the new API error handler
export * from "./api-error-handler";

const logger = createLogger("ErrorHandler");

export interface ApiError extends Error {
  status?: number;
  code?: string;
  isSessionError?: boolean;
  validationErrors?: Record<string, string[]>;
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

/**
 * Error categories
 */
export enum ErrorCategory {
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  VALIDATION = "validation",
  NETWORK = "network",
  SERVER = "server",
  CLIENT = "client",
  UNKNOWN = "unknown",
}

/**
 * Categorize error based on status code and properties
 */
export function categorizeError(error: ApiError): ErrorCategory {
  if (error.isSessionError || error.status === 401) {
    return ErrorCategory.AUTHENTICATION;
  }

  if (error.status === 403) {
    return ErrorCategory.AUTHORIZATION;
  }

  if (error.status === 422 || error.validationErrors) {
    return ErrorCategory.VALIDATION;
  }

  if (error.status && error.status >= 500) {
    return ErrorCategory.SERVER;
  }

  if (error.status && error.status >= 400 && error.status < 500) {
    return ErrorCategory.CLIENT;
  }

  if (
    !error.status ||
    error.message?.includes("fetch") ||
    error.message?.includes("network")
  ) {
    return ErrorCategory.NETWORK;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Determine error severity
 */
export function determineErrorSeverity(error: ApiError): ErrorSeverity {
  const category = categorizeError(error);

  switch (category) {
    case ErrorCategory.AUTHENTICATION:
    case ErrorCategory.SERVER:
      return ErrorSeverity.CRITICAL;

    case ErrorCategory.AUTHORIZATION:
    case ErrorCategory.NETWORK:
      return ErrorSeverity.ERROR;

    case ErrorCategory.VALIDATION:
      return ErrorSeverity.WARNING;

    default:
      return ErrorSeverity.ERROR;
  }
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: ApiError): string {
  // Handle validation errors
  if (error.validationErrors) {
    const firstField = Object.keys(error.validationErrors)[0];
    const firstError = error.validationErrors[firstField]?.[0];
    return firstError || "Validation failed";
  }

  // Handle session errors
  if (error.isSessionError) {
    return error.message || "Your session has expired. Please log in again.";
  }

  // Handle specific status codes
  if (error.status) {
    switch (error.status) {
      case 401:
        return "Authentication required. Please log in.";
      case 403:
        return "You do not have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 429:
        return "Too many requests. Please try again later.";
      case 500:
        return "Server error. Please try again later.";
      case 503:
        return "Service temporarily unavailable. Please try again later.";
    }
  }

  // Handle network errors
  if (error.message?.includes("fetch") || error.message?.includes("network")) {
    return "Network error. Please check your connection.";
  }

  // Default to error message
  return error.message || "An unexpected error occurred";
}

/**
 * Log error to console (can be extended to send to logging service)
 */
export function logError(error: ApiError, context?: Record<string, any>) {
  const category = categorizeError(error);
  const severity = determineErrorSeverity(error);

  const logData = {
    message: error.message,
    category,
    severity,
    status: error.status,
    code: error.code,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  };

  const showStack = process.env.NODE_ENV === "development";
  const logPayload: Record<string, unknown> = {
    message: logData.message,
    category: logData.category,
    status: logData.status,
    code: logData.code,
    context: logData.context,
    timestamp: logData.timestamp,
  };

  if (showStack && logData.stack) {
    logPayload.stack = logData.stack;
  }

  if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.ERROR) {
    logger.error("❌ Error:", logPayload);
  } else if (severity === ErrorSeverity.WARNING) {
    logger.warn("⚠️ Warning:", logPayload);
  } else {
    logger.log("ℹ️ Info:", logPayload);
  }
}

/**
 * Display error notification to user
 * Accepts unknown for convenience in catch blocks
 */
export function notifyError(error: unknown, customMessage?: string) {
  const apiError = error as ApiError;
  const message = customMessage || formatErrorMessage(apiError);
  const severity = determineErrorSeverity(apiError);

  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.ERROR:
      // For network/server errors, avoid spamming toasts - only show once in window
      if (
        (apiError.status &&
          (apiError.status >= 500 || apiError.status === 503)) ||
        !apiError.status ||
        message.toLowerCase().includes("network")
      ) {
        if (shouldShowNotification("backend_unreachable", 30_000)) {
          toast.error(message);
        }
      } else {
        toast.error(message);
      }
      break;
    case ErrorSeverity.WARNING:
      toast.warning(message);
      break;
    case ErrorSeverity.INFO:
      toast.info(message);
      break;
  }
}

/**
 * Handle authentication errors (redirect to login if needed)
 */
export function handleAuthError(error: ApiError) {
  const category = categorizeError(error);

  if (category === ErrorCategory.AUTHENTICATION) {
    // Get redirect URL before clearing auth
    const redirectUrl = getCurrentUserSignInUrl();

    // Clear auth state
    const clearAuth = useAuthStore.getState().clearAuth;
    clearAuth(error.message);

    // Redirect to role-specific login page
    if (typeof window !== "undefined") {
      window.location.href = redirectUrl;
    }
  }
}

/**
 * Main error handler - centralized error processing
 */
export function handleError(
  error: unknown,
  context?: Record<string, any>,
  customMessage?: string
): void {
  // Convert to ApiError if not already
  const apiError = error as ApiError;

  // Log the error
  logError(apiError, context);

  // Handle authentication errors
  handleAuthError(apiError);

  // Notify user
  notifyError(apiError, customMessage);
}

/**
 * Create error handler for React Query
 */
export function createQueryErrorHandler(context?: Record<string, any>) {
  return (error: unknown) => {
    handleError(error, context);
  };
}

/**
 * Retry function for queries
 */
export function shouldRetryQuery(
  failureCount: number,
  error: unknown
): boolean {
  const apiError = error as ApiError;

  // Don't retry authentication or authorization errors
  if (apiError.status === 401 || apiError.status === 403) {
    return false;
  }

  // Don't retry client errors (4xx)
  if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
    return false;
  }

  // Retry up to 2 times for server errors and network errors
  return failureCount < 2;
}

/**
 * Error boundary fallback
 */
export function getErrorBoundaryFallback(error: Error) {
  return {
    title: "Something went wrong",
    message: formatErrorMessage(error as ApiError),
    action: "Try refreshing the page",
  };
}
