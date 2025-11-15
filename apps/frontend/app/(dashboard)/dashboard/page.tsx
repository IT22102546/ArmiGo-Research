"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Loader2 } from "lucide-react";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/sign-in");
      return;
    }

    switch (user.role) {
      case "ADMIN":
      case "SUPER_ADMIN":
        router.replace("/admin");
        break;
      case "INTERNAL_TEACHER":
      case "EXTERNAL_TEACHER":
        router.replace("/teacher");
        break;
      case "INTERNAL_STUDENT":
      case "EXTERNAL_STUDENT":
        router.replace("/marketplace");
        break;
      default:
        router.replace("/");
        break;
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
