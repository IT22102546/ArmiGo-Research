"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Lock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Globe,
} from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";
import { handleApiError } from "@/lib/error-handling";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface LoginAttemptsDialogProps {
  open: boolean;
  userId: string | null;
  userName: string;
  onClose: () => void;
}

interface LoginAttempt {
  id: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  location?: string;
  failureReason?: string;
  createdAt: string;
}

interface LoginStats {
  totalAttempts: number;
  successfulLogins: number;
  failedAttempts: number;
  lastSuccessfulLogin?: string;
  suspiciousAttempts: number;
}

const LoginAttemptsDialog: React.FC<LoginAttemptsDialogProps> = ({
  open,
  userId,
  userName,
  onClose,
}) => {
  const t = useTranslations("users");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [stats, setStats] = useState<LoginStats>({
    totalAttempts: 0,
    successfulLogins: 0,
    failedAttempts: 0,
    suspiciousAttempts: 0,
  });

  useEffect(() => {
    if (open && userId) {
      fetchLoginAttempts();
    }
  }, [open, userId]);

  const fetchLoginAttempts = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = (await ApiClient.get(
        `/users/${userId}/login-attempts`
      )) as any;
      setAttempts(response.attempts || []);
      setStats(
        response.stats || {
          totalAttempts: 0,
          successfulLogins: 0,
          failedAttempts: 0,
          suspiciousAttempts: 0,
        }
      );
    } catch (error) {
      handleApiError(
        error,
        "LoginAttemptsDialog",
        "Failed to fetch login attempts"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (success: boolean, suspicious?: boolean) => {
    if (suspicious) {
      return (
        <Badge className="bg-orange-100 text-orange-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {t("modals.loginAttempts.suspicious")}
        </Badge>
      );
    }

    if (success) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t("modals.loginAttempts.success")}
        </Badge>
      );
    }

    return (
      <Badge className="bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        {t("modals.loginAttempts.statusFailed")}
      </Badge>
    );
  };

  const getBrowserInfo = (userAgent: string) => {
    // Simple browser detection
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Unknown";
  };

  const getDeviceInfo = (userAgent: string) => {
    // Simple device detection
    if (userAgent.includes("Mobile")) return "Mobile";
    if (userAgent.includes("Tablet")) return "Tablet";
    return "Desktop";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t("modals.loginAttempts.title", { name: userName })}
          </DialogTitle>
          <DialogDescription>
            {t("modals.loginAttempts.description")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("modals.loginAttempts.totalAttempts")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalAttempts}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("modals.loginAttempts.successful")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.successfulLogins}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("modals.loginAttempts.failed")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.failedAttempts}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("modals.loginAttempts.suspicious")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.suspiciousAttempts}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("modals.loginAttempts.lastLogin")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">
                    {stats.lastSuccessfulLogin
                      ? format(new Date(stats.lastSuccessfulLogin), "PP p")
                      : t("modals.loginAttempts.never")}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Login Attempts Table */}
            <Card>
              <CardHeader>
                <CardTitle>{t("modals.loginAttempts.loginHistory")}</CardTitle>
              </CardHeader>
              <CardContent>
                {attempts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          {t("modals.loginAttempts.dateTime")}
                        </TableHead>
                        <TableHead>
                          {t("modals.loginAttempts.status")}
                        </TableHead>
                        <TableHead>
                          {t("modals.loginAttempts.ipAddress")}
                        </TableHead>
                        <TableHead>
                          {t("modals.loginAttempts.location")}
                        </TableHead>
                        <TableHead>
                          {t("modals.loginAttempts.browser")}
                        </TableHead>
                        <TableHead>
                          {t("modals.loginAttempts.device")}
                        </TableHead>
                        <TableHead>
                          {t("modals.loginAttempts.details")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attempts.map((attempt) => (
                        <TableRow key={attempt.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {format(new Date(attempt.createdAt), "PPP")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(attempt.createdAt), "p")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(attempt.success)}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">
                              {attempt.ipAddress}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {attempt.location ||
                                  t("modals.loginAttempts.unknown")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {getBrowserInfo(attempt.userAgent)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {getDeviceInfo(attempt.userAgent)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {!attempt.success && attempt.failureReason && (
                              <span className="text-sm text-red-600">
                                {attempt.failureReason}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {t("modals.loginAttempts.noAttemptsFound")}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Security Recommendations */}
            {stats.suspiciousAttempts > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-orange-800 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    {t("modals.loginAttempts.securityAlert")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-orange-800">
                    {t("modals.loginAttempts.suspiciousDetected", {
                      count: stats.suspiciousAttempts,
                    })}
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-orange-700">
                    <li>{t("modals.loginAttempts.resetPassword")}</li>
                    <li>{t("modals.loginAttempts.enable2FA")}</li>
                    <li>{t("modals.loginAttempts.contactUser")}</li>
                    <li>{t("modals.loginAttempts.reviewIPs")}</li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoginAttemptsDialog;
