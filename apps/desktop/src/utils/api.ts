import useAuthStore from '../stores/authStore';

// In dev the Vite proxy intercepts /api/** → https://api.armigorehab.com/**
// In prod VITE_API_URL is the full base URL, endpoints already start with /api/v1/...
const API_BASE = (import.meta.env.VITE_API_URL as string) ?? '';

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

  // API_BASE is '' in dev (proxy handles it) or full URL in prod
  // Endpoints always start with /api/v1/... so no double-prefix
  const url = API_BASE ? `${API_BASE}${endpoint}` : endpoint;
  const response = await fetch(url, { ...options, headers });
  return response;
};
