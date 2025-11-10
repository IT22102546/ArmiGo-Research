"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  ShieldOff,
  Key,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertTriangle,
  Smartphone,
} from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TwoFactorManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [disableToken, setDisableToken] = useState("");
  const [regenerateToken, setRegenerateToken] = useState("");
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [generatedBackupCodes, setGeneratedBackupCodes] = useState<string[]>(
    []
  );
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Get 2FA status
  const { data: twoFactorStatus } = useQuery({
    queryKey: ["two-factor-status"],
    queryFn: async () => {
      const response = await ApiClient.get<{
        enabled: boolean;
        method?: string;
      }>("/auth/2fa/status");
      return response;
    },
  });

  // Disable 2FA mutation
  const disableMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await ApiClient.post("/auth/2fa/disable", { token });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Two-Factor Authentication Disabled",
        description: "Your account is no longer protected with 2FA",
        status: "warning",
      });
      setShowDisableDialog(false);
      setDisableToken("");
      queryClient.invalidateQueries({ queryKey: ["two-factor-status"] });
      router.push("/settings/security");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Disable 2FA",
        description:
          error.response?.data?.message || "Invalid verification code",
        status: "error",
      });
    },
  });

  // Regenerate backup codes mutation
  const regenerateMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await ApiClient.post<{ backupCodes: string[] }>(
        "/auth/2fa/regenerate-backup-codes",
        { token }
      );
      return response;
    },
    onSuccess: (data) => {
      setGeneratedBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      toast({
        title: "Backup Codes Regenerated",
        description: `${data.backupCodes.length} new backup codes have been generated`,
        status: "success",
      });
      setShowRegenerateDialog(false);
      setRegenerateToken("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Regenerate Codes",
        description:
          error.response?.data?.message || "Invalid verification code",
        status: "error",
      });
    },
  });

  const handleDisable = () => {
    if (!disableToken || disableToken.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code",
        status: "warning",
      });
      return;
    }
    disableMutation.mutate(disableToken);
  };

  const handleRegenerateRequest = () => {
    setShowRegenerateDialog(true);
  };

  const handleRegenerateConfirm = () => {
    if (!regenerateToken || regenerateToken.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code",
        status: "warning",
      });
      return;
    }
    regenerateMutation.mutate(regenerateToken);
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: "Copied",
      description: "Code copied to clipboard",
      status: "info",
    });
  };

  const downloadBackupCodes = () => {
    if (!generatedBackupCodes || generatedBackupCodes.length === 0) return;

    const content = `LearnApp Platform - Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Keep these codes in a safe place. Each code can only be used once.

${generatedBackupCodes.map((code, i) => `${i + 1}. ${code}`).join("\n")}

These codes can be used to access your account if you lose access to your authenticator app.
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `learnapp-2fa-backup-codes-${Date.now()}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Backup codes saved to your device",
      status: "success",
    });
  };

  if (!twoFactorStatus?.enabled) {
    return (
      <div className="container max-w-4xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>Two-Factor Authentication Not Enabled</CardTitle>
            <CardDescription>
              Protect your account by enabling 2FA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/settings/security/2fa-setup")}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Set Up Two-Factor Authentication
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Two-Factor Authentication</h1>
        <p className="text-muted-foreground">
          Manage your two-factor authentication settings
        </p>
      </div>

      <div className="grid gap-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              2FA is Enabled
            </CardTitle>
            <CardDescription>
              Your account is protected with two-factor authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Authentication Method
                </p>
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 w-fit"
                >
                  <Smartphone className="h-3 w-3" />
                  {twoFactorStatus.method || "TOTP (Authenticator App)"}
                </Badge>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowDisableDialog(true)}
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                Disable 2FA
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Backup Codes Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Backup Codes
            </CardTitle>
            <CardDescription>
              Use backup codes to sign in if you lose access to your
              authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Regenerate Backup Codes</p>
                <p className="text-sm text-muted-foreground">
                  Generate new backup codes for emergency access
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleRegenerateRequest}
                disabled={regenerateMutation.isPending}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${regenerateMutation.isPending ? "animate-spin" : ""}`}
                />
                Regenerate
              </Button>
            </div>

            {showBackupCodes && generatedBackupCodes.length > 0 && (
              <>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    These are your new backup codes. Each code can only be used
                    once. Save them securely.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-3">
                  {generatedBackupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg border"
                    >
                      <span className="font-mono text-sm">{code}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(code, index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={downloadBackupCodes}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Backup Codes
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Security Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">
                  •
                </Badge>
                <span>
                  Keep your backup codes in a secure location, separate from
                  your authenticator app
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">
                  •
                </Badge>
                <span>
                  Regenerate backup codes if you suspect they've been
                  compromised
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">
                  •
                </Badge>
                <span>
                  If you get a new phone, make sure to transfer your
                  authenticator app before resetting your old device
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">
                  •
                </Badge>
                <span>
                  Consider using a password manager that supports TOTP codes as
                  a backup
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              This will make your account less secure. To disable 2FA, please
              enter a verification code from your authenticator app.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Warning: Disabling 2FA will make your account more vulnerable to
              unauthorized access.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="disable-token">Verification Code</Label>
              <Input
                id="disable-token"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={disableToken}
                onChange={(e) =>
                  setDisableToken(e.target.value.replace(/\D/g, ""))
                }
                className="text-center text-2xl font-mono tracking-widest mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDisableDialog(false);
                setDisableToken("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={disableToken.length !== 6 || disableMutation.isPending}
            >
              {disableMutation.isPending ? "Disabling..." : "Disable 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Backup Codes Dialog */}
      <Dialog
        open={showRegenerateDialog}
        onOpenChange={setShowRegenerateDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Backup Codes</DialogTitle>
            <DialogDescription>
              This will invalidate all existing backup codes and generate new
              ones. Enter a verification code from your authenticator app to
              continue.
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your old backup codes will no longer work after regeneration.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="regenerate-token">Verification Code</Label>
              <Input
                id="regenerate-token"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={regenerateToken}
                onChange={(e) =>
                  setRegenerateToken(e.target.value.replace(/\D/g, ""))
                }
                className="text-center text-2xl font-mono tracking-widest mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRegenerateDialog(false);
                setRegenerateToken("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegenerateConfirm}
              disabled={
                regenerateToken.length !== 6 || regenerateMutation.isPending
              }
            >
              {regenerateMutation.isPending
                ? "Regenerating..."
                : "Regenerate Codes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
