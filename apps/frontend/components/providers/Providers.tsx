"use client";

import { AuthInitializer } from "@/components/auth/AuthInitializer";
import { ThemeProvider } from "./ThemeProvider";
import { StripeProvider } from "./StripeProvider";
import { HealthCheckProvider } from "./HealthCheckProvider";
import { useSession } from "@/lib/hooks";
import { QueryProvider } from "@/lib/query";
import { NotificationsProvider } from "@/lib/hooks/use-notifications";

// Providers component - handles global auth state initialization and monitoring
function AuthMonitors() {
  // Consolidated session management (validation + token refresh)
  useSession();

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <StripeProvider>
          <HealthCheckProvider>
            <AuthInitializer />
            <AuthMonitors />
            <NotificationsProvider>{children}</NotificationsProvider>
          </HealthCheckProvider>
        </StripeProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
