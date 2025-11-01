"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store"; 

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Using Zustand store
  const { user, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check authentication on mount
    const initializeAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        // Auth check failed - will redirect if needed
      } finally {
        setIsChecking(false);
      }
    };

    initializeAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isChecking && !user) {
      // User is not authenticated, redirect to login
      router.push("/sign-in");
    }
  }, [user, isLoading, isChecking, router]);

  // Show loading state while checking authentication
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, don't render children (will redirect)
  if (!user) {
    return null;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}