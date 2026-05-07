// app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    // Wait for loading to finish
    if (isLoading) return;

    // If no user, send them to sign-in
    if (!user) {
      router.replace("/sign-in");
      return;
    }

    // User is authenticated, send them to the correct dashboard
    // This acts as a safety net.
    switch (user.role) {
      case "SUPER_ADMIN":
      case "ADMIN":
        router.replace("/admin");
        break;
      case "HOSPITAL_ADMIN":
        router.replace("/admin");
        break;
      // ... other roles ...
      default:
        router.replace("/sign-in");
    }
  }, [isLoading, user, router]);

  // Show a loading spinner
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}