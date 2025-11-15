"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShieldCheck,
  Smartphone,
  Key,
  Copy,
  Check,
  Download,
  ArrowLeft,
  AlertTriangle,
  QrCode,
} from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";

interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export default function TwoFactorSetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [verificationToken, setVerificationToken] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("qr");

  // Generate 2FA secret
  const {
    data: setupData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["two-factor-setup"],
    queryFn: async () => {
      const response =
        await ApiClient.post<TwoFactorSetupResponse>("/auth/2fa/setup");
      return response;
    },
  });

  // Verify and enable 2FA
  const verifyMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await ApiClient.post("/auth/2fa/verify", { token });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Two-Factor Authentication Enabled",
        description: "Your account is now protected with 2FA",
        status: "success",
      });
      router.push("/settings/security");
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description:
          error.response?.data?.message || "Invalid verification code",
        status: "error",
      });
    },
  });

  const handleVerify = () => {
    if (!verificationToken || verificationToken.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code",
        status: "error",
      });
      return;
    }
    verifyMutation.mutate(verificationToken);
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
    if (!setupData) return;

    const content = `LearnApp Platform - Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Keep these codes in a safe place. Each code can only be used once.

${setupData.backupCodes.map((code, i) => `${i + 1}. ${code}`).join("\n")}

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

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>Setting up Two-Factor Authentication...</CardTitle>
            <CardDescription>
              Please wait while we generate your 2FA setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to generate 2FA setup. Please try again or contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Security Settings
        </Button>
        <h1 className="text-3xl font-bold mb-2">
          Set Up Two-Factor Authentication
        </h1>
        <p className="text-muted-foreground">
          Add an extra layer of security to your account by enabling 2FA
        </p>
      </div>

      <div className="grid gap-6">
        {/* Warning Alert */}
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription>
            Two-factor authentication adds an extra layer of security to your
            account by requiring a verification code in addition to your
            password when signing in.
          </AlertDescription>
        </Alert>

        {/* Main Setup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Configure Your Authenticator App
            </CardTitle>
            <CardDescription>
              Use an authenticator app like Google Authenticator, Microsoft
              Authenticator, or Authy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="qr">
                  <QrCode className="mr-2 h-4 w-4" />
                  Scan QR Code
                </TabsTrigger>
                <TabsTrigger value="manual">
                  <Key className="mr-2 h-4 w-4" />
                  Manual Entry
                </TabsTrigger>
              </TabsList>

              <TabsContent value="qr" className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Open your authenticator app</li>
                    <li>Select "Add Account" or "Scan QR Code"</li>
                    <li>Scan the QR code below</li>
                    <li>Enter the 6-digit code from your app to verify</li>
                  </ol>
                </div>

                {setupData && (
                  <div className="flex justify-center p-6 bg-white rounded-lg border">
                    <img
                      src={setupData.qrCode}
                      alt="2FA QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  If you can't scan the QR code, you can manually enter this
                  secret key into your authenticator app:
                </div>

                {setupData && (
                  <div className="space-y-2">
                    <Label>Secret Key</Label>
                    <div className="flex gap-2">
                      <Input
                        value={setupData.secret}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(setupData.secret, -1)}
                      >
                        {copiedIndex === -1 ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Account name: LearnApp Platform
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <Separator className="my-6" />

            {/* Verification Input */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="token">Verification Code</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="token"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={verificationToken}
                    onChange={(e) =>
                      setVerificationToken(e.target.value.replace(/\D/g, ""))
                    }
                    className="text-center text-2xl font-mono tracking-widest"
                  />
                  <Button
                    onClick={handleVerify}
                    disabled={
                      verificationToken.length !== 6 || verifyMutation.isPending
                    }
                    size="lg"
                  >
                    {verifyMutation.isPending
                      ? "Verifying..."
                      : "Verify & Enable"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
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
              Save these codes in a safe place. You can use them to sign in if
              you lose access to your authenticator app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Each backup code can only be used
                once. Store them securely and treat them like passwords.
              </AlertDescription>
            </Alert>

            {setupData && (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {setupData.backupCodes.map((code, index) => (
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
            <CardTitle className="text-lg">Security Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">
                  1
                </Badge>
                <span>
                  Store your backup codes in a secure password manager or safe
                  location
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">
                  2
                </Badge>
                <span>
                  Never share your verification codes or backup codes with
                  anyone
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">
                  3
                </Badge>
                <span>
                  If you lose access to your authenticator app, use a backup
                  code to sign in
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">
                  4
                </Badge>
                <span>
                  You can regenerate backup codes from your security settings at
                  any time
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
