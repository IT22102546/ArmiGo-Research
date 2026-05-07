import { create } from 'zustand';

interface User {
  id?: string;
  _id?: string;
  phone: string;
  email?: string | null;
  firstName: string;
  lastName: string;
  role: string;
  dateOfBirth?: string | Date | null;
  status?: string | null;
  username?: string;
  mobile?: string;
  isAdmin?: boolean;
  profilePicture?: string;
}

interface AuthState {
  isSignedIn: boolean;
  currentUser: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  authChecked: boolean;
  signIn: (user: User, accessToken: string, refreshToken: string) => void;
  signOut: () => void;
  checkAuthStatus: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const useAuthStore = create<AuthState>((set, get) => ({
  isSignedIn: false,
  currentUser: null,
  accessToken: null,
  refreshToken: null,
  authChecked: false,

  signIn: (user, accessToken, refreshToken) => {
    const normalizedUser: User = {
      id: user.id || user._id || '',
      _id: user._id || user.id || '',
      phone: user.phone || '',
      email: user.email || null,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || '',
      dateOfBirth: user.dateOfBirth || null,
      status: user.status || null,
      username: user.username || `user_${user.phone}`,
      mobile: user.mobile || user.phone,
      isAdmin: user.isAdmin || false,
      profilePicture: user.profilePicture || undefined,
    };
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    set({
      isSignedIn: true,
      currentUser: normalizedUser,
      accessToken,
      refreshToken,
      authChecked: true,
    });
  },

  signOut: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    set({
      isSignedIn: false,
      currentUser: null,
      accessToken: null,
      refreshToken: null,
      authChecked: true,
    });
  },

  checkAuthStatus: () => {
    const userJson = localStorage.getItem('user');
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const user = userJson ? JSON.parse(userJson) : null;

    // Check if JWT is expired by decoding the payload
    let tokenExpired = false;
    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          tokenExpired = true;
        }
      } catch {
        tokenExpired = true;
      }
    }

    if (user && accessToken && !tokenExpired) {
      set({
        isSignedIn: true,
        currentUser: user,
        accessToken,
        refreshToken,
        authChecked: true,
      });
    } else {
      // Token missing or expired — clear everything so user sees login screen
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      set({
        isSignedIn: false,
        currentUser: null,
        accessToken: null,
        refreshToken: null,
        authChecked: true,
      });
    }
  },

  updateUser: (updates) => {
    const currentUser = get().currentUser;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ currentUser: updatedUser });
    }
  },
}));

export default useAuthStore;
