// lib/api/api-client.ts - PERFORMANCE OPTIMIZED VERSION
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_PREFIX = "/api/v1";

// Extended RequestInit with params support
export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, any>;
  responseType?: "json" | "blob";
  skipRetry?: boolean; // Allow skipping retry for non-critical requests
}

// Circuit Breaker State - OPTIMIZED
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private readonly threshold =
    Number(process.env.NEXT_PUBLIC_CIRCUIT_BREAKER_THRESHOLD) || 7; // Increased from 5 to 7
  private readonly timeout =
    Number(process.env.NEXT_PUBLIC_CIRCUIT_BREAKER_TIMEOUT) || 30000; // Reduced from 60s to 30s for faster recovery
  private readonly resetTimeout = 30000;

  canRequest(): boolean {
    if (this.state === "CLOSED") {
      return true;
    }

    if (this.state === "OPEN") {
      const now = Date.now();
      if (now - this.lastFailureTime > this.timeout) {
        this.state = "HALF_OPEN";
        return true;
      }
      return false;
    }

    // HALF_OPEN state - allow one request through
    return true;
  }

  onSuccess(): void {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = "OPEN";
    }
  }

  getState(): string {
    return this.state;
  }
}

const circuitBreaker = new CircuitBreaker();

export class ApiClient {
  /**
   * Main request method with error handling and retry logic
   * OPTIMIZED: Reduced retry delays, faster failure handling
   */
  static async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    // Check circuit breaker before making request
    if (!circuitBreaker.canRequest()) {
      throw new Error(
        "Service temporarily unavailable. Too many failed requests. Please try again later."
      );
    }

    // Extract params and build query string
    const { params, skipRetry, ...fetchOptions } = options;
    let queryString = "";
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle array values for specific parameters
          if (Array.isArray(value)) {
            value.forEach((item) => {
              searchParams.append(key, String(item));
            });
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
      queryString = `?${searchParams.toString()}`;
    }

    // Automatically prepend API_PREFIX if not already present
    const normalizedEndpoint = endpoint.startsWith(API_PREFIX)
      ? endpoint
      : endpoint.startsWith("/")
        ? `${API_PREFIX}${endpoint}`
        : `${API_PREFIX}/${endpoint}`;

    const url = `${API_URL}${normalizedEndpoint}${queryString}`;

    // PERFORMANCE: Reduced max retries from 2 to 1 for faster failure response
    const maxRetries = skipRetry ? 0 : 1;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // PERFORMANCE: Reduced exponential backoff delays
        if (attempt > 0) {
          const delay = Math.min(500 * Math.pow(2, attempt - 1), 2000); // Max 2 seconds (reduced from 5s)
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const baseHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };

        // If a form data body is being sent, avoid forcing Content-Type header
        const isFormData = fetchOptions.body instanceof FormData;
        const headers = {
          ...(isFormData ? {} : baseHeaders),
          ...(fetchOptions.headers as Record<string, string>),
        } as Record<string, string>;

        const config: RequestInit = {
          ...fetchOptions,
          headers,
          credentials: "include", // This sends cookies with the request
        };

        const response = await fetch(url, config);

        // Handle throttling errors - retry with delay
        if (response.status === 429) {
          lastError = new Error("Too Many Requests - Please try again later");
          continue;
        }

        // Handle 401 - Authentication required
        if (response.status === 401) {
          // Parse error response to get specific session error details
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.message ||
            "Authentication required. Please log in again.";

          // Don't try to refresh on auth endpoints (login, register, refresh itself)
          const isAuthEndpoint =
            endpoint.includes("/auth/login") ||
            endpoint.includes("/auth/register") ||
            endpoint.includes("/auth/refresh") ||
            endpoint.includes("/auth/forgot-password") ||
            endpoint.includes("/auth/reset-password");

          // Try to refresh token on first attempt ONLY (but not for auth endpoints)
          if (attempt === 0 && !isAuthEndpoint) {
            const refreshed = await this.tryRefreshToken();
            if (refreshed) {
              // Retry the original request with new tokens
              continue;
            }
          }

          // If refresh failed or we're on second attempt, clear auth and throw with specific message
          // Only clear auth state if NOT on an auth endpoint (otherwise login/register would clear state)
          if (!isAuthEndpoint) {
            await this.clearAuthState(errorMessage);
          }

          circuitBreaker.onFailure();

          // Create error with session-specific message from backend
          const authError: any = new Error(errorMessage);
          authError.code = errorData.code;
          authError.isSessionError = errorMessage
            .toLowerCase()
            .includes("session");
          throw authError;
        }

        // Handle 403 - Forbidden
        if (response.status === 403) {
          const errorData = await response.json().catch(() => ({}));
          circuitBreaker.onFailure();
          throw new Error(
            errorData.message ||
              "You don't have permission to access this resource"
          );
        }

        // Handle 404 - Not Found: parse response body and include backend message if available
        if (response.status === 404) {
          circuitBreaker.onFailure();
          // Try to parse response body for a detailed error message
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData?.message || errorData?.error || "Resource not found";
          const notFoundError: any = new Error(errorMessage);
          notFoundError.code = errorData?.code || "RESOURCE_NOT_FOUND";
          notFoundError.status = 404;
          notFoundError.response = { status: 404, data: errorData };
          throw notFoundError;
        }

        // Handle 500 - Server Error
        if (response.status >= 500) {
          lastError = new Error("Server error - Please try again later");
          circuitBreaker.onFailure();
          continue; // Retry on server errors
        }

        if (!response.ok) {
          const error = await response.json().catch(() => ({
            message: `HTTP error! status: ${response.status}`,
          }));

          // Create error object with response status for better error handling
          const apiError: any = new Error(
            error.message || `HTTP error! status: ${response.status}`
          );
          apiError.status = response.status;
          apiError.code = error.code || `HTTP_${response.status}`;
          apiError.response = { status: response.status, data: error };
          circuitBreaker.onFailure();
          throw apiError;
        }

        // Handle 204 No Content responses
        if (response.status === 204) {
          circuitBreaker.onSuccess();
          return {} as T;
        }

        // Handle blob response type if requested
        if ((options as ApiRequestOptions).responseType === "blob") {
          const blob = await response.blob();
          circuitBreaker.onSuccess();
          return blob as unknown as T;
        }

        // Parse successful response
        const data = await response.json();
        circuitBreaker.onSuccess();

        // Backend wraps responses in { success: true, data: {...} }
        // Unwrap if present, otherwise return raw data
        if (
          data &&
          typeof data === "object" &&
          "success" in data &&
          "data" in data
        ) {
          return data.data as T;
        }

        return data;
      } catch (error) {
        lastError = error;

        // Type-safe error handling
        const err = error as Error & { response?: { status: number } };
        const message = err?.message || "";
        const name = err?.name || "";

        // If it's a throttling error and we have retries left, continue
        if (
          (message.includes("Too Many Requests") || message.includes("429")) &&
          attempt < maxRetries
        ) {
          continue;
        }

        // For network errors, retry
        if (
          name === "TypeError" &&
          message.includes("Failed to fetch") &&
          attempt < maxRetries
        ) {
          circuitBreaker.onFailure();
          continue;
        }

        // For authentication errors on final attempt, redirect to login
        if (
          (message.includes("Authentication required") ||
            message.includes("401")) &&
          attempt === maxRetries
        ) {
          this.redirectToLogin();
        }

        // Throw the error for the caller to handle
        circuitBreaker.onFailure();
        // If it's a native network error, map to a sanitized NetworkError so that UI
        // can decide whether to suppress toasts and show a friendly message.
        if (name === "TypeError" && message.includes("Failed to fetch")) {
          const networkErr: Error & { name: string } = new Error(
            "Network error: Could not reach server"
          );
          networkErr.name = "NetworkError";
          throw networkErr;
        }

        // If the error comes from server with 5xx, ensure we don't forward raw stack traces
        if (err?.response?.status && err.response.status >= 500) {
          throw new Error("Server error - Please try again later");
        }

        throw error;
      }
    }

    throw lastError!;
  }

  /**
   * Try to refresh the access token using the refresh token cookie
   */
  private static async tryRefreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}${API_PREFIX}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        return true;
      }

      // Handle specific error codes
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));

        // "NO_REFRESH_TOKEN" is expected when user has no session - don't log as error
        if (errorData.code === "NO_REFRESH_TOKEN") {
          // This is expected - user doesn't have a session, needs to login
          return false;
        }

        // Other 401 errors (invalid/expired token) - also expected
        console.info("Session expired or invalid - user needs to re-login");
        return false;
      }

      return false;
    } catch (error) {
      // Network error or other issues - fail silently
      return false;
    }
  }

  /**
   * Clear authentication state from Zustand store
   */
  private static async clearAuthState(reason?: string): Promise<void> {
    try {
      if (typeof window !== "undefined") {
        // Dynamically import to avoid circular dependencies
        const { useAuthStore } = await import("@/stores/auth-store");
        useAuthStore.getState().clearAuth(reason);
      }
    } catch (error) {
      // Silently handle errors during auth state clearing
    }
  }

  /**
   * Redirect to login page
   */
  private static async redirectToLogin(): Promise<void> {
    if (typeof window !== "undefined") {
      // Use setTimeout to avoid interrupting current execution
      setTimeout(async () => {
        try {
          // Dynamically import to avoid circular dependencies
          const { getCurrentUserSignInUrl } =
            await import("@/stores/auth-store");
          window.location.href = getCurrentUserSignInUrl();
        } catch {
          // Fallback to default sign-in if import fails
          window.location.href = "/sign-in";
        }
      }, 100);
    }
  }

  /**
   * GET request
   */
  static async get<T>(
    endpoint: string,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "GET",
    });
  }

  /**
   * POST request
   */
  static async post<T>(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<T> {
    const requestOptions: RequestInit = {
      ...options,
      method: "POST",
    };

    if (data) {
      requestOptions.body = JSON.stringify(data);
    }

    return this.request<T>(endpoint, requestOptions);
  }

  /**
   * PUT request
   */
  static async put<T>(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<T> {
    const requestOptions: RequestInit = {
      ...options,
      method: "PUT",
    };

    if (data) {
      requestOptions.body = JSON.stringify(data);
    }

    return this.request<T>(endpoint, requestOptions);
  }

  /**
   * PATCH request
   */
  static async patch<T>(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<T> {
    const requestOptions: RequestInit = {
      ...options,
      method: "PATCH",
    };

    if (data) {
      requestOptions.body = JSON.stringify(data);
    }

    return this.request<T>(endpoint, requestOptions);
  }

  /**
   * DELETE request
   */
  static async delete<T>(
    endpoint: string,
    options?: ApiRequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  }

  /**
   * File upload with FormData
   */
  static async uploadFile<T>(
    endpoint: string,
    formData: FormData,
    options?: RequestInit & { method?: string }
  ): Promise<T> {
    // Normalize endpoint to include API_PREFIX if not present (same behavior as request())
    const normalizedEndpoint = endpoint.startsWith(API_PREFIX)
      ? endpoint
      : endpoint.startsWith("/")
        ? `${API_PREFIX}${endpoint}`
        : `${API_PREFIX}/${endpoint}`;
    const url = `${API_URL}${normalizedEndpoint}`;

    const config: RequestInit = {
      ...options,
      method: (options?.method as string) || "POST",
      credentials: "include",
      body: formData,
      // Don't set Content-Type for FormData - browser sets it with boundary
    };

    try {
      const response = await fetch(url, config);

      // Handle authentication errors
      if (response.status === 401) {
        await this.clearAuthState();
        throw new Error("Authentication required. Please log in again.");
      }

      if (response.status === 403) {
        throw new Error("You don't have permission to upload files");
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Upload failed",
        }));
        throw new Error(
          error.message || `Upload failed with status ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Download file
   */
  static async downloadFile(
    endpoint: string,
    filename?: string,
    options?: RequestInit
  ): Promise<Blob> {
    const url = `${API_URL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      method: "GET",
      credentials: "include",
    };

    try {
      const response = await fetch(url, config);

      // Handle authentication errors
      if (response.status === 401) {
        await this.clearAuthState();
        throw new Error("Authentication required. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();

      // Auto-download if filename provided
      if (filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      return blob;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Health check - test API connectivity
   */
  static async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${API_URL}/api/v1/health`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Health check failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error("API server is not reachable");
    }
  }

  /**
   * Test authentication status
   */
  static async testAuth(): Promise<{ authenticated: boolean; user?: any }> {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/profile`, {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        return { authenticated: false };
      }

      if (!response.ok) {
        throw new Error(`Auth test failed with status ${response.status}`);
      }

      const user = await response.json();
      return { authenticated: true, user };
    } catch (error) {
      return { authenticated: false };
    }
  }
}

// Export a singleton instance for convenience
export const apiClient = new ApiClient();

/**
 * Build a complete API URL from an endpoint path
 * Automatically prepends API_URL and API_PREFIX if needed
 */
export function buildApiUrl(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;

  // Check if endpoint already starts with API_PREFIX
  const needsPrefix = !cleanEndpoint.startsWith(API_PREFIX.slice(1));

  // Build the full URL
  if (needsPrefix) {
    return `${API_URL}${API_PREFIX}/${cleanEndpoint}`;
  }

  return `${API_URL}/${cleanEndpoint}`;
}
