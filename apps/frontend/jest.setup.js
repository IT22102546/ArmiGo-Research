require("@testing-library/jest-dom");

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
global.sessionStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Mock next/router
jest.mock("next/router", () => ({
  useRouter() {
    return {
      route: "/",
      pathname: "/",
      query: {},
      asPath: "/",
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

// Mock next-intl globally
jest.mock("next-intl", () => ({
  useTranslations: () => (key) => key,
  useLocale: () => "en",
  useMessages: () => ({}),
  useNow: () => new Date(),
  useTimeZone: () => "UTC",
}));

// Mock @tanstack/react-query
jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: undefined, isLoading: false, error: null }),
  useMutation: () => ({ mutate: jest.fn(), isLoading: false }),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
  }),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }) => children,
}));

// Mock child components that are used in headers
jest.mock("@/components/shared/global-search", () => ({
  GlobalSearch: () => null,
}));

jest.mock("@/components/shared/LanguageSwitcher", () => ({
  __esModule: true,
  default: () => null,
  LanguageSwitcher: () => null,
}));

jest.mock("@/components/shared/NotificationBell", () => ({
  NotificationBell: () => null,
}));

// Mock lib/hooks
jest.mock("@/lib/hooks", () => ({
  useLogoutMutation: () => ({
    mutate: jest.fn(),
    isLoading: false,
  }),
}));

// Mock zustand stores
jest.mock("@/stores/auth-store", () => ({
  useAuthStore: jest.fn(() => ({
    user: {
      id: "1",
      name: "Test User",
      email: "test@test.com",
      role: "ADMIN",
      firstName: "Test",
      lastName: "User",
    },
    logout: jest.fn(),
  })),
}));

jest.mock("@/stores/ui-store", () => ({
  useUIStore: jest.fn(() => ({
    toggleSidebar: jest.fn(),
    isSidebarOpen: false,
    theme: "light",
    setTheme: jest.fn(),
    toggleTheme: jest.fn(),
  })),
}));
