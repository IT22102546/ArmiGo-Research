"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";
import { usersApi } from "@/lib/api/endpoints/users";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";

const logger = createLogger("ResetPasswordModal");

interface ResetPasswordModalProps {
  open: boolean;
  userId: string | null;
  userName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  open,
  userId,
  userName,
  onClose,
  onSuccess,
}) => {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    onClose();
  };

  const validatePassword = (): boolean => {
    if (!newPassword.trim()) {
      toast.error(t("modals.resetPassword.passwordRequired"));
      return false;
    }

    if (newPassword.length < 8) {
      toast.error(t("modals.resetPassword.passwordMinLength"));
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("modals.resetPassword.passwordsDoNotMatch"));
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!userId || !validatePassword()) return;

    setLoading(true);
    try {
      await usersApi.resetPassword(userId, newPassword);

      handleApiSuccess("Password reset successfully");
      handleClose();
      onSuccess?.();
    } catch (error) {
      handleApiError(
        error,
        "ResetPasswordModal.handleSubmit",
        "Failed to reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            {t("modals.resetPassword.title")}
          </DialogTitle>
          <DialogDescription>
            {t("modals.resetPassword.description", { name: userName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">
              {t("modals.resetPassword.newPassword")}{" "}
              <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("modals.resetPassword.placeholder")}
                disabled={loading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {t("modals.resetPassword.minLength")}
            </p>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {t("modals.resetPassword.confirmPassword")}{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("modals.resetPassword.confirmPlaceholder")}
              disabled={loading}
            />
          </div>

          {/* Warning Message */}
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
            <p className="text-sm text-yellow-800">
              <strong>{tCommon("warning")}:</strong>{" "}
              {t("modals.resetPassword.warning")}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {tCommon("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("modals.resetPassword.resetting")}
              </>
            ) : (
              <>
                <KeyRound className="mr-2 h-4 w-4" />
                {t("modals.resetPassword.resetButton")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordModal;
