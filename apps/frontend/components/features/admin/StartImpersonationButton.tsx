"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface StartImpersonationButtonProps {
  userId: string;
  userName: string;
  userRole: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function StartImpersonationButton({
  userId,
  userName,
  userRole,
  variant = "outline",
  size = "sm",
}: StartImpersonationButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const { setUser, user: currentUser } = useAuthStore();

  // Start impersonation mutation
  const startImpersonation = useMutation({
    mutationFn: async () => {
      const response = (await ApiClient.post(
        `/auth/impersonate/${userId}`
      )) as {
        data: {
          impersonationToken: string;
          targetUser: any;
          expiresIn: number;
        };
      };
      return response.data;
    },
    onSuccess: (data) => {
      // Update auth store with impersonated user
      setUser(data.targetUser);
      toast.success(`Now viewing as ${userName}`);
      setShowDialog(false);

      // Redirect to home or dashboard
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to start impersonation");
    },
  });

  const handleStartImpersonation = () => {
    startImpersonation.mutate();
  };

  // Check if current user can impersonate
  const canImpersonate =
    currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN";

  // Cannot impersonate super admins unless you are a super admin
  const cannotImpersonateTarget =
    userRole === "SUPER_ADMIN" && currentUser?.role !== "SUPER_ADMIN";

  if (!canImpersonate) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowDialog(true)}
        disabled={cannotImpersonateTarget}
        className="gap-2"
      >
        <Eye className="h-4 w-4" />
        View as User
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Confirm Impersonation
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                You are about to view the system as <strong>{userName}</strong>{" "}
                (Role: {userRole}).
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 space-y-2">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-500">
                  Important:
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1 list-disc list-inside">
                  <li>All actions will be performed as this user</li>
                  <li>Impersonation session expires in 1 hour</li>
                  <li>This action will be logged for security audit</li>
                  <li>A banner will show that you're in impersonation mode</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={startImpersonation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartImpersonation}
              disabled={startImpersonation.isPending}
              className="gap-2"
            >
              {startImpersonation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Start Impersonation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
