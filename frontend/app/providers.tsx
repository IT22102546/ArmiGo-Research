"use client"

import { usePathname } from "next/navigation";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";

// Component to handle global auth redirects
function AuthRedirectHandler() {
  const pathname = usePathname();
  
  // Don't redirect on sign-in/sign-up pages
  const isAuthPage = pathname?.includes("sign-in") || pathname?.includes("sign-up");
  
  if (!isAuthPage) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAuthRedirect();
  }
  
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthRedirectHandler />
      {children}
    </>
  );
}