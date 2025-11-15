"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserX, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ImpersonationStatus {
  isImpersonating: boolean;
  originalUser?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  impersonatedUser?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  startTime?: string;
  timeElapsed?: number;
  timeRemaining?: number;
}

export function ImpersonationBanner() {
  const { setUser, user } = useAuthStore();

  // Check impersonation status - only if user is logged in
  const { data: status } = useQuery({
    queryKey: ["impersonation-status"],
    queryFn: async () => {
      try {
        const response = (await ApiClient.get(
          "/auth/impersonation-status"
        )) as {
          data: ImpersonationStatus;
        };
        return response.data || { isImpersonating: false };
      } catch {
        // Return default value if endpoint fails
        return { isImpersonating: false };
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!user, // Only run query if user is logged in
    retry: false, // Don't retry on auth errors
  });

  // Stop impersonation mutation
  const stopImpersonation = useMutation({
    mutationFn: async () => {
      const response = (await ApiClient.post("/auth/stop-impersonate")) as {
        data: { accessToken: string; user: any };
      };
      return response.data;
    },
    onSuccess: (data) => {
      // Update auth store with original user
      setUser(data.user);
      toast.success("Successfully returned to your account");
      // Reload to refresh all contexts
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to stop impersonation");
    },
  });

  const handleStopImpersonation = () => {
    if (
      window.confirm(
        "Are you sure you want to exit impersonation mode and return to your account?"
      )
    ) {
      stopImpersonation.mutate();
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  if (!status?.isImpersonating) {
    return null;
  }

  return (
    <Alert className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-none rounded-none mb-0 shadow-lg">
      <AlertTriangle className="h-5 w-5 text-white" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4 flex-1">
          <div>
            <p className="font-semibold text-base">Impersonation Mode Active</p>
            <p className="text-sm text-white/90">
              Viewing as: {status.impersonatedUser?.firstName}{" "}
              {status.impersonatedUser?.lastName} (
              {status.impersonatedUser?.email})
            </p>
          </div>
          {status.timeRemaining && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>Time remaining: {formatTime(status.timeRemaining)}</span>
            </div>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleStopImpersonation}
          disabled={stopImpersonation.isPending}
          className="gap-2 bg-background text-red-600 hover:bg-muted dark:text-red-400"
        >
          <UserX className="h-4 w-4" />
          Exit Impersonation
        </Button>
      </AlertDescription>
    </Alert>
  );
}
