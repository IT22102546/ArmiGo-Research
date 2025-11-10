// In your utils/api.ts or wherever apiFetch is defined
import useAuthStore from "../stores/authStore";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  // Get token directly from the auth store
  const authState = useAuthStore.getState();
    const url = `${API_BASE_URL}${endpoint}`;

  // Try different ways to get the token
  let token = null;
  if (authState.getToken && typeof authState.getToken === 'function') {
    token = authState.getToken();
  } else if (authState.accessToken) {
    token = authState.accessToken;
  } else if (authState.currentUser?.token) {
    token = authState.currentUser.token;
  }
  
  console.log('🔍 [API FETCH] Token check:', {
    hasToken: !!token,
    tokenLength: token?.length,
    endpoint: endpoint
  });

  const headers = {
    'Content-Type': 'application/json',
    'x-client-type': 'mobile',
    ...options.headers,
  };

  // ADD Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('⚠️ [API FETCH] No token available for request to:', endpoint);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  console.log('📡 Response for', endpoint, ':', response.status);
  return response;
};