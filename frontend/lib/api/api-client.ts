// lib/api/api-client.ts - COMPLETE UPDATED VERSION
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Circuit Breaker State
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private readonly threshold = 5; // Open circuit after 5 failures
  private readonly timeout = 60000; // Try again after 60 seconds
  private readonly resetTimeout = 30000; // Reset counter after 30 seconds of success

  canRequest(): boolean {
    if (this.state === 'CLOSED') {
      return true;
    }

    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }

    // HALF_OPEN state - allow one request through
    return true;
  }

  onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      console.warn(`Circuit breaker opened after ${this.failureCount} failures. API calls will be blocked for ${this.timeout / 1000}s`);
    }
  }

  getState(): string {
    return this.state;
  }
}

const circuitBreaker = new CircuitBreaker();

export class ApiClient {
  /**
   * Main request method with enhanced error handling and retry logic
   */
  static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Check circuit breaker before making request
    if (!circuitBreaker.canRequest()) {
      throw new Error(
        "Service temporarily unavailable. Too many failed requests. Please try again later."
      );
    }

    const url = `${API_URL}${endpoint}`;
    const maxRetries = 2;
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Add exponential backoff delay between retries (except first attempt)
        if (attempt > 0) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const baseHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };

        const config: RequestInit = {
          ...options,
          headers: {
            ...baseHeaders,
            ...(options.headers as Record<string, string>),
          },
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
          // Try to refresh token on first attempt
          if (attempt === 0) {
            const refreshed = await this.tryRefreshToken();
            if (refreshed) {
              continue; // Retry the original request
            }
          }

          // If refresh failed or we're on second attempt, clear auth and throw
          await this.clearAuthState();
          circuitBreaker.onFailure();
          throw new Error("Authentication required. Please log in again.");
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

        // Handle 404 - Not Found
        if (response.status === 404) {
          circuitBreaker.onFailure();
          throw new Error("Resource not found");
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
          apiError.response = { status: response.status, data: error };
          circuitBreaker.onFailure();
          throw apiError;
        }

        // Handle 204 No Content responses
        if (response.status === 204) {
          circuitBreaker.onSuccess();
          return {} as T;
        }

        // Parse successful response
        const data = await response.json();
        circuitBreaker.onSuccess();
        return data;
      } catch (error: any) {
        lastError = error;

        // If it's a throttling error and we have retries left, continue
        if (
          (error.message?.includes("Too Many Requests") ||
            error.message?.includes("429")) &&
          attempt < maxRetries
        ) {
          continue;
        }

        // For network errors, retry
        if (
          error.name === "TypeError" &&
          error.message.includes("Failed to fetch") &&
          attempt < maxRetries
        ) {
          circuitBreaker.onFailure();
          continue;
        }

        // For authentication errors on final attempt, redirect to login
        if (
          (error.message?.includes("Authentication required") ||
            error.message?.includes("401")) &&
          attempt === maxRetries
        ) {
          this.redirectToLogin();
        }

        // Throw the error for the caller to handle
        circuitBreaker.onFailure();
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
      const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear authentication state from Zustand store
   */
  private static async clearAuthState(): Promise<void> {
    try {
      if (typeof window !== "undefined") {
        // Dynamically import to avoid circular dependencies
        const { useAuthStore } = await import("@/stores/auth-store");
        useAuthStore.getState().clearAuth();
      }
    } catch (error) {
      // Silently handle errors during auth state clearing
    }
  }

  /**
   * Redirect to login page
   */
  private static redirectToLogin(): void {
    if (typeof window !== "undefined") {
      // Use setTimeout to avoid interrupting current execution
      setTimeout(() => {
        window.location.href = "/sign-in";
      }, 100);
    }
  }

  /**
   * GET request
   */
  static async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
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
    options?: RequestInit
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
    options?: RequestInit
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
    options?: RequestInit
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
  static async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
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
    options?: RequestInit
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      method: "POST",
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
      const response = await fetch(`${API_URL}/api/v1/auth/me`, {
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
