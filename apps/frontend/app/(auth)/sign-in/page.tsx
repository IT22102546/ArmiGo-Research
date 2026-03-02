"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createLogger } from "@/lib/utils/logger";
import { getErrorMessage } from "@/lib/error-handling";
const logger = createLogger("SignInPage");
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Lock, Shield, Mail } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useLoginMutation } from "@/lib/hooks/queries/useAuth";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import styles from "./sign-in.module.css";

export default function SignIn() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const t = useTranslations();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const userRole = user.role;
      logger.log(
        "✅ User authenticated, redirecting to appropriate dashboard..."
      );

      // ARMIGO ROLE REDIRECTS
      if (userRole === "SUPER_ADMIN") {
        router.replace("/dashboard");
      } else if (userRole === "HOSPITAL_ADMIN") {
        router.replace("/hospital"); // You'll need to create this route
      } else if (userRole === "PARENT") {
        router.replace("/parent"); // You'll need to create this route
      } else {
        // Fallback
        router.replace("/");
      }
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    logger.log("📝 Form submitted, calling login...");

    try {
      // Remove allowedRoles or update it for ArmiGo
      login(
        {
          identifier,
          password,
          // allowedRoles: ["INTERNAL_TEACHER", "EXTERNAL_TEACHER"], // REMOVE THIS
        },
        {
          onSuccess: () => {
            console.log("✅ Login successful");
            // Redirect will happen automatically via useEffect
          },
          onError: (err: any) => {
            logger.error("❌ Login failed:", getErrorMessage(err));
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
      logger.error("❌ Unexpected login error:", getErrorMessage(err));
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full md:w-5/12 items-center justify-center bg-background p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-primary">
                {t("auth.welcomeBack")}
              </h1>
              <p className="text-muted-foreground">{t("auth.loginSubtitle")}</p>
            </div>
            <LanguageSwitcher />
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
                {t("auth.email")} / {t("auth.phone")}
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
                {t("auth.password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={t("auth.password")}
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
              {isPending ? t("common.loading") : t("auth.signIn")}
            </Button>

            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Other Options
                  </span>
                </div>
              </div>

              <Link
                href="/admin/sign-in"
                className="flex items-center justify-center gap-2 w-full h-10 text-sm font-medium text-muted-foreground hover:text-primary border border-border rounded-lg hover:border-primary transition-colors"
              >
                <Shield className="h-4 w-4" />
                Admin Login
              </Link>

              {/* Update this link for hospital registration */}
              <Link
                href="/sign-up/hospital"
                className="flex items-center justify-center gap-2 w-full h-10 text-sm font-medium text-muted-foreground hover:text-primary border border-border rounded-lg hover:border-primary transition-colors"
              >
                <Phone className="h-4 w-4" />
                Hospital Registration
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* eslint-disable-next-line */}
      <div
        className={`hidden md:flex md:w-7/12 items-center justify-center relative overflow-hidden ${styles.signInContainer}`}
      >
        <div className="absolute inset-0 opacity-10">
          {/* eslint-disable-next-line */}
          <div className={styles.formWrapper} />
        </div>

        <div className="relative z-10 text-center px-12">
          <h2 className="text-4xl font-bold text-white mb-2">
            Welcome to <span className="block">ArmiGo Portal</span>
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Rehabilitation through play for little heroes
          </p>

          <div className="mt-8 flex justify-center">
            <div className="w-full max-w-2xl rounded-lg shadow-2xl bg-white/10 p-8">
              <p className="text-white text-lg">
                Empowering children with hemiplegia through innovative IoT devices and engaging VR games.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}