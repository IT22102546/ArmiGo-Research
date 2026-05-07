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

    console.log("🔍 Redirecting user with role:", user.role);

    // ARMIGO ROLE REDIRECTS
    switch (user.role) {
      case "SUPER_ADMIN":
        router.replace("/dashboard/admin");
        break;
      case "HOSPITAL_ADMIN":
        router.replace("/dashboard/admin");
        break;
      case "PARENT":
        router.replace("/parent-dashboard");
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