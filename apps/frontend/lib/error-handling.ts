export interface ApiError {
  message?: string;
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
    status?: number;
  };
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  const apiError = error as ApiError;

  if (apiError?.response?.data?.message) {
    return apiError.response.data.message;
  } else if (apiError?.response?.data?.error) {
    return apiError.response.data.error;
  } else if (apiError?.message) {
    return apiError.message;
  } else if (error instanceof Error) {
    return error.message;
  }

  return "An error occurred";
}

/**
 * Coerce value to ApiError type
 */
export function asApiError(error: unknown): ApiError {
  return error as ApiError;
}

/**
 * Notify error using console and optional toast
 */
export function notifyError(
  error: unknown,
  context?: string,
  fallbackMessage?: string
): void {
  const message = fallbackMessage || getErrorMessage(error);

  console.error(`${context || "Error"}:`, {
    error,
    message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle API errors and display appropriate error messages
 * @param error - The error object from the API call
 * @param context - Optional context for logging
 * @param fallbackMessage - Optional fallback message
 * @returns Error message string
 */
export function handleApiError(
  error: unknown,
  context?: string,
  fallbackMessage: string = "An error occurred"
): string {
  const apiError = error as ApiError;
  let errorMessage = fallbackMessage;

  // Try to extract meaningful error message
  if (apiError?.response?.data?.message) {
    errorMessage = apiError.response.data.message;
  } else if (apiError?.response?.data?.error) {
    errorMessage = apiError.response.data.error;
  } else if (apiError?.message) {
    errorMessage = apiError.message;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  // Log error with context
  console.error(`${context || "API Error"}:`, {
    error,
    message: errorMessage,
    timestamp: new Date().toISOString(),
  });

  return errorMessage;
}

/**
 * Handle API success messages
 * @param message - Success message to display
 * @param context - Optional context for logging
 */
export function handleApiSuccess(message: string, context?: string): void {
  console.log(`${context || "API Success"}:`, {
    message,
    timestamp: new Date().toISOString(),
  });
}
