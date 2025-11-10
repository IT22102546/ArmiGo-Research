
// In your utils/api.ts or wherever apiFetch is defined
import useAuthStore from "../stores/authStore";


// utils/api.ts
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;


export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get token from SecureStore
  const accessToken = await SecureStore.getItemAsync("access_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-client-type": "mobile",
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }), // CRITICAL: Add token
    ...(options.headers as Record<string, string>),
  };

  try {
    const response = await fetch(url, {
      headers,
      credentials: "include",
      ...options,
    });

    return response;
  } catch (error) {
    console.error(`❌ API Error for ${endpoint}:`, error);
    throw error;
  }
};;
