"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/sign-in");
      return;
    }

    switch (user.role) {
      case "SUPER_ADMIN":
      case "ADMIN":
        router.replace("/admin");
        break;
      case "INTERNAL_TEACHER":
        router.replace("/teacher");
        break;
      case "EXTERNAL_TEACHER":
        router.replace("/teacher/transfers");
        break;
      default:
        router.replace("/sign-in");
        break;
    }
  }, [isLoading, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
