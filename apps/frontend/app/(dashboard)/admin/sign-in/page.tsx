"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createLogger } from "@/lib/utils/logger";
import { getErrorMessage } from "@/lib/error-handling";
const logger = createLogger("AdminSignIn");
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Shield } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useLoginMutation } from "@/lib/hooks/queries/useAuth";

export default function AdminSignIn() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const user = useAuthStore((state) => state.user);
  const sessionError = useAuthStore((state) => state.sessionError);

  const { mutate: login, isPending } = useLoginMutation();
  const router = useRouter();

  const isAuthenticated = user !== null;

  // Display session error if present (but only once, when component mounts)
  useEffect(() => {
    if (sessionError) {
      setError(sessionError);
      // Clear session error after displaying
      useAuthStore.setState({ sessionError: null });
    }
  }, []); // Empty deps - run only once on mount

  // Redirect if already authenticated (both for fresh logins and existing sessions)
  useEffect(() => {
    if (isAuthenticated && user) {
      const userRole = user.role;
      logger.log("✅ User authenticated, redirecting based on role...");

      // Perform redirect based on role
      if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
        router.replace("/admin");
      } else if (
        userRole === "INTERNAL_TEACHER" ||
        userRole === "EXTERNAL_TEACHER"
      ) {
        router.replace("/teacher");
      } else {
        // Non-admin users should not access admin portal - redirect to home
        router.replace("/");
      }
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    logger.log("📝 Form submitted, calling login...");

    try {
      // Send allowedRoles to backend for admin portal validation
      login(
        {
          identifier,
          password,
          allowedRoles: ["SUPER_ADMIN", "ADMIN"],
        },
        {
          onSuccess: () => {
            console.log("✅ Login successful");
            // Redirect will happen automatically via useEffect
          },
          onError: (err: any) => {
            logger.error("❌ Login failed:", getErrorMessage(err));
            // Handle different error types with specific admin-focused messages
            if (err.response?.status === 401) {
              setError("Invalid credentials");
            } else if (err.response?.status === 429) {
              setError(
                "Too many login attempts. Please wait a few minutes and try again."
              );
            } else if (err.response?.status === 403) {
              setError("Invalid credentials");
            } else if (err.response?.status >= 500) {
              setError(
                "Server error. Please try again later or contact support."
              );
            } else if (err.message?.toLowerCase().includes("credentials")) {
              setError("Invalid credentials");
            } else if (err.message?.toLowerCase().includes("network")) {
              setError("Network error. Please check your internet connection.");
            } else if (err.message) {
              setError(err.message);
            } else {
              setError(
                "Failed to sign in. Please try again or contact support."
              );
            }
          },
        }
      );
    } catch (err) {
      logger.error("❌ Unexpected error:", getErrorMessage(err));
    }
  };

  // Show loading state while authenticating
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Signing in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full md:w-5/12 items-center justify-center bg-background p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-primary">Admin Portal</h1>
            </div>
            <p className="text-muted-foreground">Sign in to admin dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="identifier"
                className="text-sm font-medium text-foreground"
              >
                Phone Number or Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Enter Phone (+94712345678) or Email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-10 h-12 rounded-lg border-input"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter Your Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 rounded-lg border-input"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
              disabled={isPending}
            >
              {isPending ? "Signing in..." : "Sign in"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Need Doctor Access?{" "}
              <a
                href="/sign-in"
                className="text-primary font-medium hover:underline"
              >
                Doctor Portal
              </a>
            </p>
          </form>
        </div>
      </div>

      <div
        className="hidden md:flex md:w-7/12 items-center justify-center relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, hsl(260 90% 50%), hsl(260 85% 55%))",
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative z-10 text-center px-12">
          <Shield className="h-24 w-24 text-white mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-2">
            ArmiGo Platform
            <span className="block mt-2">Admin Control Center</span>
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Manage and Monitor the Entire Platform
          </p>

          <div className="mt-8 flex justify-center">
            <div className="w-full max-w-2xl h-auto rounded-lg shadow-2xl bg-white/10 p-8">
              <p className="text-white text-lg">
                Secure access to administrative functions and platform
                management
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
