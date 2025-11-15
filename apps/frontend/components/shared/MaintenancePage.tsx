"use client";

import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface MaintenancePageProps {
  onRetry?: () => void;
  error?: string | null;
}

export function MaintenancePage({ onRetry, error }: MaintenancePageProps) {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (onRetry) {
      onRetry();
      setCountdown(30);
    }
  }, [countdown, onRetry]);

  const handleManualRetry = () => {
    setCountdown(30);
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardContent className="pt-12 pb-8 px-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-destructive/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative bg-destructive/10 p-6 rounded-full">
                <ServerCrash className="h-16 w-16 text-destructive" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                System Under Maintenance
              </h1>
              <p className="text-muted-foreground text-lg">
                We&apos;re currently performing maintenance on our systems
              </p>
            </div>

            {/* Additional Info */}
            <div className="pt-4 space-y-2 text-sm text-muted-foreground">
              <p>
                If this issue persists, please contact your system
                administrator.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
