import useAuthStore from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const authState = useAuthStore.getState();
  const token = authState.accessToken;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-client-type': 'desktop',
  };

  if (options.headers && typeof options.headers === 'object') {
    Object.assign(headers, options.headers as Record<string, string>);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, { ...options, headers });
  return response;
};
