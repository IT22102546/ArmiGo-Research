"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Prevent static generation since this uses dynamic layout
export const dynamic = 'force-dynamic';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      {/* Error Icon */}
      <div className="relative mb-8">
        <div className="p-6 rounded-full bg-destructive/10 animate-pulse">
          <AlertTriangle className="h-16 w-16 text-destructive" />
        </div>
      </div>

      {/* Content */}
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Something went wrong!
        </h1>
        <p className="text-muted-foreground">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>

        {/* Error digest for debugging */}
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono bg-muted px-3 py-2 rounded">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <Button variant="outline" onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
        <Button asChild className="gap-2">
          <Link href="/">
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      {/* Support link */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Need help? Contact our support team
        </p>
        <a
          href="mailto:support@learnapp.com"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          <Bug className="h-4 w-4" />
          Report this issue
        </a>
      </div>
    </div>
  );
}
