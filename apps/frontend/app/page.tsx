"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthRedirect } from "@/hooks/use-auth-redirect";

export default function Home() {
  const router = useRouter();

  // Automatically redirect authenticated users to their dashboard
  useAuthRedirect();

  useEffect(() => {
    // Redirect to sign-in page by default
    router.push("/sign-in");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
