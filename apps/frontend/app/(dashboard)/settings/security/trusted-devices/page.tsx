"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  Trash2,
  Shield,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface Device {
  id: string;
  deviceId: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
  ipAddress: string;
  location?: string;
  isTrusted: boolean;
  isCurrentDevice: boolean;
  lastActive: string;
  createdAt: string;
}

export default function TrustedDevicesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deviceToRemove, setDeviceToRemove] = useState<Device | null>(null);

  const { data: devices, isLoading } = useQuery({
    queryKey: ["trusted-devices"],
    queryFn: async () => {
      const response = await ApiClient.get<Device[]>("/auth/devices");
      return response || [];
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      await ApiClient.delete(`/auth/devices/${deviceId}`);
    },
    onSuccess: () => {
      toast({
        title: "Device Removed",
        description: "The device has been removed from your trusted devices",
        status: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["trusted-devices"] });
      setDeviceToRemove(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Remove Device",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
      });
    },
  });

  const toggleTrustMutation = useMutation({
    mutationFn: async ({
      deviceId,
      trusted,
    }: {
      deviceId: string;
      trusted: boolean;
    }) => {
      await ApiClient.patch(`/auth/devices/${deviceId}`, {
        isTrusted: trusted,
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.trusted ? "Device Trusted" : "Trust Removed",
        description: variables.trusted
          ? "This device is now trusted"
          : "This device is no longer trusted",
        status: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["trusted-devices"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Device",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
      });
    },
  });

  const removeAllMutation = useMutation({
    mutationFn: async () => {
      await ApiClient.delete("/auth/devices/all");
    },
    onSuccess: () => {
      toast({
        title: "All Devices Removed",
        description: "All devices except the current one have been removed",
        status: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["trusted-devices"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Remove Devices",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
      });
    },
  });

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "mobile":
        return <Smartphone className="h-8 w-8" />;
      case "tablet":
        return <Tablet className="h-8 w-8" />;
      default:
        return <Monitor className="h-8 w-8" />;
    }
  };

  return (
    <div className="container max-w-6xl py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Trusted Devices</h1>
        <p className="text-muted-foreground">
          Manage devices that have accessed your account
        </p>
      </div>

      {/* Stats Card */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trusted</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {devices?.filter((d) => d.isTrusted).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Untrusted</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {devices?.filter((d) => !d.isTrusted).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Devices</CardTitle>
              <CardDescription>
                Devices that have recently accessed your account
              </CardDescription>
            </div>
            {devices && devices.length > 1 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeAllMutation.mutate()}
                disabled={removeAllMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove All Others
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : devices && devices.length > 0 ? (
            <div className="grid gap-4">
              {devices.map((device) => (
                <Card
                  key={device.id}
                  className={`${device.isCurrentDevice ? "border-primary" : ""} ${!device.isTrusted ? "border-orange-300" : ""}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          {getDeviceIcon(device.deviceType)}
                        </div>
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">
                              {device.browser} on {device.os}
                            </h3>
                            {device.isCurrentDevice && (
                              <Badge variant="default">Current Device</Badge>
                            )}
                            {device.isTrusted ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 border-green-200"
                              >
                                <Shield className="mr-1 h-3 w-3" />
                                Trusted
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-orange-50 border-orange-200"
                              >
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Untrusted
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {device.location || "Unknown location"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                Last active:{" "}
                                {format(
                                  new Date(device.lastActive),
                                  "MMM dd, yyyy"
                                )}
                              </span>
                            </div>
                            <div>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {device.ipAddress}
                              </code>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Added on{" "}
                            {format(
                              new Date(device.createdAt),
                              "MMMM dd, yyyy 'at' hh:mm a"
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {!device.isCurrentDevice && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                toggleTrustMutation.mutate({
                                  deviceId: device.id,
                                  trusted: !device.isTrusted,
                                })
                              }
                              disabled={toggleTrustMutation.isPending}
                            >
                              {device.isTrusted
                                ? "Remove Trust"
                                : "Trust Device"}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeviceToRemove(device)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No devices found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">About Trusted Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
              <span>
                Trusted devices can access your account without additional
                verification
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
              <span>
                You can remove any device from this list to revoke its access
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
              <span>
                Removing a device will log it out and require re-authentication
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-500" />
              <span>
                If you see an unfamiliar device, remove it immediately and
                change your password
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Remove Device Dialog */}
      <AlertDialog
        open={!!deviceToRemove}
        onOpenChange={() => setDeviceToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Device</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this device? This will log out any
              active sessions on this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deviceToRemove && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-semibold">
                  {deviceToRemove.browser} on {deviceToRemove.os}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {deviceToRemove.location || "Unknown location"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  IP: {deviceToRemove.ipAddress}
                </p>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deviceToRemove && removeMutation.mutate(deviceToRemove.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Device
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
