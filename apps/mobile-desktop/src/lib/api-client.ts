/** Mobile/Desktop API client. */
const API_URL = process.env.REACT_APP_API_URL;

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export class MobileApiClient {
  /**
   * Main request method - uses httpOnly cookies for authentication
   */
  static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;

    const baseHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...baseHeaders,
        ...(options.headers as Record<string, string>),
      },
      credentials: "include", // Important: Send cookies with request
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 - token might be expired, try to refresh
      if (response.status === 401) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          // Retry the original request
          const retryResponse = await fetch(url, config);
          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }
        // If refresh failed or retry failed, throw error
        throw new Error("Authentication required");
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "An error occurred",
        }));
        throw new Error(
          error.message || `HTTP error! status: ${response.status}`
        );
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
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
      return response.ok;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  static async post<T>(endpoint: string, data?: any): Promise<T> {
    const options: RequestInit = {
      method: "POST",
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    return this.request<T>(endpoint, options);
  }

  static async put<T>(endpoint: string, data?: any): Promise<T> {
    const options: RequestInit = {
      method: "PUT",
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    return this.request<T>(endpoint, options);
  }

  static async patch<T>(endpoint: string, data?: any): Promise<T> {
    const options: RequestInit = {
      method: "PATCH",
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    return this.request<T>(endpoint, options);
  }

  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  static async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${API_URL}${endpoint}`;

    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: "Upload failed",
      }));
      throw new Error(error.message);
    }

    return await response.json();
  }
}

// Export API URL for other uses
export { API_URL };
