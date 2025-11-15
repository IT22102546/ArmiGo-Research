"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/lib/hooks/use-toast";
import { ApiClient } from "@/lib/api";
import {
  Shield,
  ShieldAlert,
  ShieldOff,
  Clock,
  History,
  ArrowLeft,
  Calendar as CalendarIcon,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface UserRestrictions {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    accountLocked: boolean;
    accountLockedUntil: string | null;
    accountLockedReason: string | null;
  };
  isBlocked: boolean;
  blockReason: string | null;
  blockedUntil: string | null;
  isSuspended: boolean;
}

interface RestrictionLog {
  id: string;
  action: string;
  details: any;
  createdAt: string;
  ipAddress: string | null;
}

export default function UserRestrictionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blockDuration, setBlockDuration] = useState<string>("permanent");
  const [customDuration, setCustomDuration] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendUntil, setSuspendUntil] = useState<Date | undefined>(undefined);

  // Fetch user restrictions
  const { data: restrictions, isLoading } = useQuery({
    queryKey: ["user-restrictions", userId],
    queryFn: async () => {
      const response = await ApiClient.get<UserRestrictions>(
        `/admin/users/${userId}/restrictions`
      );
      return response; // ApiClient returns typed data directly
    },
  });

  // Fetch restriction history
  const { data: history } = useQuery({
    queryKey: ["restriction-history", userId],
    queryFn: async () => {
      const response = await ApiClient.get<{
        logs: RestrictionLog[];
        pagination: any;
      }>(`/admin/users/${userId}/restrictions/history`);
      return response; // ApiClient returns typed data directly
    },
  });

  // Block user mutation
  const blockMutation = useMutation({
    mutationFn: async (data: { reason: string; duration?: number }) => {
      const response = await ApiClient.post(
        `/admin/users/${userId}/restrictions/block`,
        data
      );
      return response;
    },
    onSuccess: () => {
      toast({
        title: "User blocked",
        description: "User login has been blocked successfully",
        status: "success",
      });
      queryClient.invalidateQueries({
        queryKey: ["user-restrictions", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["restriction-history", userId],
      });
      setShowBlockDialog(false);
      setBlockReason("");
      setBlockDuration("permanent");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to block user",
        description: error.response?.data?.message || "An error occurred",
        status: "error",
      });
    },
  });

  // Unblock user mutation
  const unblockMutation = useMutation({
    mutationFn: async () => {
      const response = await ApiClient.post(
        `/admin/users/${userId}/restrictions/unblock`
      );
      return response;
    },
    onSuccess: () => {
      toast({
        title: "User unblocked",
        description: "User login has been unblocked successfully",
        status: "success",
      });
      queryClient.invalidateQueries({
        queryKey: ["user-restrictions", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["restriction-history", userId],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to unblock user",
        description: error.response?.data?.message || "An error occurred",
        status: "error",
      });
    },
  });

  // Suspend user mutation
  const suspendMutation = useMutation({
    mutationFn: async (data: { reason: string; until: string }) => {
      const response = await ApiClient.post(
        `/admin/users/${userId}/restrictions/suspend`,
        data
      );
      return response;
    },
    onSuccess: () => {
      toast({
        title: "User suspended",
        description: "User has been suspended successfully",
        status: "success",
      });
      queryClient.invalidateQueries({
        queryKey: ["user-restrictions", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["restriction-history", userId],
      });
      setShowSuspendDialog(false);
      setSuspendReason("");
      setSuspendUntil(undefined);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to suspend user",
        description: error.response?.data?.message || "An error occurred",
        status: "error",
      });
    },
  });

  const handleBlock = () => {
    if (!blockReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for blocking this user",
        status: "warning",
      });
      return;
    }

    const duration =
      blockDuration === "permanent"
        ? undefined
        : blockDuration === "custom"
          ? parseInt(customDuration)
          : parseInt(blockDuration);

    blockMutation.mutate({ reason: blockReason, duration });
  };

  const handleSuspend = () => {
    if (!suspendReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for suspending this user",
        status: "warning",
      });
      return;
    }

    if (!suspendUntil) {
      toast({
        title: "Date required",
        description:
          "Please select a date until which the user should be suspended",
        status: "warning",
      });
      return;
    }

    suspendMutation.mutate({
      reason: suspendReason,
      until: suspendUntil.toISOString(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Login Restrictions</h1>
          <p className="text-muted-foreground">
            Manage login restrictions for {restrictions?.user.firstName}{" "}
            {restrictions?.user.lastName}
          </p>
        </div>
      </div>

      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
          <CardDescription>
            View the current restriction status for this user
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Account Status</Label>
              <div className="flex items-center gap-2">
                {restrictions?.user.status === "ACTIVE" ? (
                  <Badge variant="default" className="bg-green-500">
                    <Shield className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : restrictions?.user.status === "SUSPENDED" ? (
                  <Badge variant="destructive">
                    <ShieldOff className="h-3 w-3 mr-1" />
                    Suspended
                  </Badge>
                ) : (
                  <Badge variant="secondary">{restrictions?.user.status}</Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Login Access</Label>
              <div className="flex items-center gap-2">
                {restrictions?.isBlocked ? (
                  <Badge variant="destructive">
                    <ShieldAlert className="h-3 w-3 mr-1" />
                    Blocked
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-green-500">
                    <Shield className="h-3 w-3 mr-1" />
                    Allowed
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {restrictions?.isBlocked && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium">
                <ShieldAlert className="h-4 w-4" />
                Login Blocked
              </div>
              {restrictions.blockReason && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Reason
                  </Label>
                  <p className="text-sm">{restrictions.blockReason}</p>
                </div>
              )}
              {restrictions.blockedUntil && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Blocked until{" "}
                  {format(new Date(restrictions.blockedUntil), "PPP p")}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {restrictions?.isBlocked ? (
              <Button
                onClick={() => unblockMutation.mutate()}
                disabled={unblockMutation.isPending}
                variant="default"
                className="gap-2"
              >
                {unblockMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                Unblock Login
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => setShowBlockDialog(true)}
                  variant="destructive"
                  className="gap-2"
                >
                  <ShieldOff className="h-4 w-4" />
                  Block Login
                </Button>
                <Button
                  onClick={() => setShowSuspendDialog(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Suspend Account
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Restriction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <CardTitle>Restriction History</CardTitle>
          </div>
          <CardDescription>
            View all past restriction actions for this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history?.logs && history.logs.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.logs.map((log: RestrictionLog) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.createdAt), "PPP p")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.action === "ACCOUNT_UNBLOCKED"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {log.details?.reason && (
                            <p>Reason: {log.details.reason}</p>
                          )}
                          {log.details?.duration && (
                            <p className="text-muted-foreground">
                              Duration: {log.details.duration}
                            </p>
                          )}
                          {log.details?.blockedUntil && (
                            <p className="text-muted-foreground">
                              Until:{" "}
                              {format(
                                new Date(log.details.blockedUntil),
                                "PPP"
                              )}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.ipAddress || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No restriction history found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block User Login</DialogTitle>
            <DialogDescription>
              Prevent this user from logging into the system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="block-reason">Reason *</Label>
              <Textarea
                id="block-reason"
                placeholder="Enter the reason for blocking this user..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="block-duration">Duration</Label>
              <Select value={blockDuration} onValueChange={setBlockDuration}>
                <SelectTrigger id="block-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="168">1 week</SelectItem>
                  <SelectItem value="720">30 days</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {blockDuration === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="custom-duration">Hours</Label>
                <Input
                  id="custom-duration"
                  type="number"
                  placeholder="Enter hours"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlock}
              disabled={blockMutation.isPending}
            >
              {blockMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Block User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User Account</DialogTitle>
            <DialogDescription>
              Temporarily suspend this user's account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="suspend-reason">Reason *</Label>
              <Textarea
                id="suspend-reason"
                placeholder="Enter the reason for suspension..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Suspend Until *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !suspendUntil && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {suspendUntil ? (
                      format(suspendUntil, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={suspendUntil}
                    onSelect={setSuspendUntil}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSuspendDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={suspendMutation.isPending}
            >
              {suspendMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Suspend Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
