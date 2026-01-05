"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Monitor,
  Smartphone,
  Tablet,
  Search,
  LogOut,
  Users,
  Clock,
  MapPin,
  AlertTriangle,
  Shield,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from "date-fns";
import { useAuthStore } from "@/stores/auth-store";
import { useWebSocket } from "@/lib/hooks/use-websocket";

// Session within a user
interface Session {
  id: string;
  sessionId: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
  deviceName?: string;
  ipAddress: string;
  lastActive: string;
  createdAt: string;
  expiresAt?: string;
}

// User with their sessions
interface UserWithSessions {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  sessionCount: number;
  sessions: Session[];
}

interface ApiResponse {
  users: UserWithSessions[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminSessionManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const { subscribe } = useWebSocket();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [sessionToTerminate, setSessionToTerminate] = useState<{
    session: Session;
    user: UserWithSessions;
  } | null>(null);
  const [userToTerminateAll, setUserToTerminateAll] =
    useState<UserWithSessions | null>(null);
  const [page, setPage] = useState(1);
  const limit = 50;

  // Determine if user is Super Admin (can see all roles including admin/super admin)
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  // Subscribe to real-time session events
  useEffect(() => {
    const unsubscribeCreated = subscribe("sessionCreated", () => {
      // Refresh sessions list when a new session is created
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
    });

    const unsubscribeTerminated = subscribe("sessionTerminated", () => {
      // Refresh sessions list when a session is terminated
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
    });

    return () => {
      unsubscribeCreated();
      unsubscribeTerminated();
    };
  }, [subscribe, queryClient]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-sessions", page, filterRole],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filterRole !== "all") {
        params.append("role", filterRole);
      }

      const response = await ApiClient.get<ApiResponse>(
        `/admin/security/sessions?${params}`
      );
      return response;
    },
  });

  const terminateSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await ApiClient.delete(`/admin/security/sessions/${sessionId}`);
    },
    onSuccess: () => {
      toast({
        title: "Session Terminated",
        description: "The session has been terminated successfully",
        status: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
      setSessionToTerminate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Terminate Session",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
      });
    },
  });

  const terminateAllUserSessionsMutation = useMutation({
    mutationFn: async (userId: string) => {
      await ApiClient.delete(`/admin/security/sessions/user/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "All Sessions Terminated",
        description: "All sessions for this user have been terminated",
        status: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
      setUserToTerminateAll(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Terminate Sessions",
        description: error.response?.data?.message || "Something went wrong",
        status: "error",
      });
    },
  });

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { color: string; label: string }> = {
      SUPER_ADMIN: { color: "bg-purple-600", label: "Super Admin" },
      ADMIN: { color: "bg-red-500", label: "Admin" },
      INTERNAL_TEACHER: { color: "bg-blue-600", label: "Internal Teacher" },
      EXTERNAL_TEACHER: { color: "bg-blue-400", label: "External Teacher" },
      INTERNAL_STUDENT: { color: "bg-green-600", label: "Internal Student" },
      EXTERNAL_STUDENT: { color: "bg-green-400", label: "External Student" },
    };
    const config = roleConfig[role] || { color: "bg-gray-500", label: role };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";
    return format(date, "MMM dd, HH:mm");
  };

  // Filter users by search query
  const filteredUsers = data?.users?.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.userName.toLowerCase().includes(query) ||
      user.userEmail.toLowerCase().includes(query) ||
      user.sessions.some(
        (s) =>
          s.ipAddress.toLowerCase().includes(query) ||
          s.browser.toLowerCase().includes(query)
      )
    );
  });

  const canManageUser = (user: UserWithSessions) => {
    if (!currentUser) return false;
    // Super Admin can manage Admins, Teachers, Students but not other Super Admins (unless it's themselves)
    if (currentUser.role === "SUPER_ADMIN") {
      if (user.userRole === "SUPER_ADMIN" && user.userId !== currentUser.id)
        return false;
      return true;
    }
    // Admin can manage Teachers and Students and their own sessions
    if (currentUser.role === "ADMIN") {
      if (user.userId === currentUser.id) return true; // their own sessions
      if (
        user.userRole === "INTERNAL_TEACHER" ||
        user.userRole === "EXTERNAL_TEACHER" ||
        user.userRole === "INTERNAL_STUDENT" ||
        user.userRole === "EXTERNAL_STUDENT"
      )
        return true;
      return false;
    }
    return false;
  };

  // Calculate stats
  const totalSessions =
    data?.users?.reduce((acc, u) => acc + u.sessionCount, 0) || 0;
  const adminSessions =
    data?.users
      ?.filter((u) => u.userRole === "ADMIN" || u.userRole === "SUPER_ADMIN")
      .reduce((acc, u) => acc + u.sessionCount, 0) || 0;
  const mobileSessions =
    data?.users?.reduce(
      (acc, u) =>
        acc + u.sessions.filter((s) => s.deviceType === "mobile").length,
      0
    ) || 0;

  return (
    <div className="container max-w-7xl py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Session Management</h1>
        <p className="text-muted-foreground">
          Monitor and manage active user sessions across the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Sessions
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              Total active sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Unique users online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Admin Sessions
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {adminSessions}
            </div>
            <p className="text-xs text-muted-foreground">Elevated privileges</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mobile Sessions
            </CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mobileSessions}</div>
            <p className="text-xs text-muted-foreground">Mobile devices</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            View and manage all active user sessions. Click on a user row to
            expand and see all their sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or IP address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {/* Super Admin: can filter by their own super admin sessions */}
                {isSuperAdmin && (
                  <SelectItem value="SUPER_ADMIN">Super Admin (Me)</SelectItem>
                )}
                {/* Super Admin can see all admins, Admin can filter to see only their own */}
                {isSuperAdmin ? (
                  <SelectItem value="ADMIN">Admin</SelectItem>
                ) : (
                  <SelectItem value="ADMIN">Admin (Me)</SelectItem>
                )}
                <SelectItem value="INTERNAL_TEACHER">
                  Internal Teacher
                </SelectItem>
                <SelectItem value="EXTERNAL_TEACHER">
                  External Teacher
                </SelectItem>
                <SelectItem value="INTERNAL_STUDENT">
                  Internal Student
                </SelectItem>
                <SelectItem value="EXTERNAL_STUDENT">
                  External Student
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const isExpanded = expandedUsers.has(user.userId);
                    const latestSession = user.sessions[0];

                    return (
                      <Collapsible
                        key={user.userId}
                        open={isExpanded}
                        onOpenChange={() => toggleUserExpanded(user.userId)}
                        asChild
                      >
                        <>
                          {/* User Row */}
                          <TableRow className="cursor-pointer hover:bg-muted/50">
                            <TableCell>
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-0 h-6 w-6"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </TableCell>
                            <TableCell>
                              <CollapsibleTrigger asChild>
                                <div className="cursor-pointer">
                                  <div className="font-medium">
                                    {user.userName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {user.userEmail}
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                            </TableCell>
                            <TableCell>{getRoleBadge(user.userRole)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {user.sessionCount}{" "}
                                {user.sessionCount === 1
                                  ? "session"
                                  : "sessions"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {formatDate(latestSession?.lastActive)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={!canManageUser(user)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUserToTerminateAll(user);
                                }}
                              >
                                <LogOut className="h-3 w-3 mr-1" />
                                Logout All
                              </Button>
                            </TableCell>
                          </TableRow>

                          {/* Expanded Sessions */}
                          <CollapsibleContent asChild>
                            <>
                              {user.sessions.map((session) => (
                                <TableRow
                                  key={session.id}
                                  className="bg-muted/30"
                                >
                                  <TableCell></TableCell>
                                  <TableCell colSpan={2}>
                                    <div className="flex items-center gap-3 pl-4">
                                      {getDeviceIcon(session.deviceType)}
                                      <div>
                                        <div className="text-sm font-medium">
                                          {session.browser} on {session.os}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {session.deviceName ||
                                            session.deviceType}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3 text-muted-foreground" />
                                      <code className="text-xs bg-muted px-2 py-1 rounded">
                                        {session.ipAddress}
                                      </code>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <div className="text-xs">
                                        <span className="text-muted-foreground">
                                          Active:{" "}
                                        </span>
                                        {formatDate(session.lastActive)}
                                      </div>
                                      <div className="text-xs">
                                        <span className="text-muted-foreground">
                                          Expires:{" "}
                                        </span>
                                        {formatDate(session.expiresAt)}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={!canManageUser(user)}
                                      onClick={() =>
                                        setSessionToTerminate({ session, user })
                                      }
                                    >
                                      <LogOut className="h-3 w-3 mr-1" />
                                      End
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No active sessions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {data.page} of {data.totalPages} ({data.total} users)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(data.totalPages, p + 1))
                  }
                  disabled={page === data.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terminate Single Session Dialog */}
      <AlertDialog
        open={!!sessionToTerminate}
        onOpenChange={() => setSessionToTerminate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to terminate this session? The user will be
              logged out from this device immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {sessionToTerminate && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-semibold">
                  {sessionToTerminate.user.userName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {sessionToTerminate.user.userEmail}
                </p>
                <p className="text-sm">
                  {sessionToTerminate.session.browser} on{" "}
                  {sessionToTerminate.session.os}
                </p>
                <p className="text-xs text-muted-foreground">
                  IP: {sessionToTerminate.session.ipAddress}
                </p>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                sessionToTerminate &&
                terminateSessionMutation.mutate(sessionToTerminate.session.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Terminate Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Terminate All User Sessions Dialog */}
      <AlertDialog
        open={!!userToTerminateAll}
        onOpenChange={() => setUserToTerminateAll(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate All User Sessions</AlertDialogTitle>
            <AlertDialogDescription>
              This will log out {userToTerminateAll?.userName} from all devices
              ({userToTerminateAll?.sessionCount} sessions). They will need to
              sign in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {userToTerminateAll && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-semibold">{userToTerminateAll.userName}</p>
                <p className="text-sm text-muted-foreground">
                  {userToTerminateAll.userEmail}
                </p>
                <p className="text-sm">
                  {getRoleBadge(userToTerminateAll.userRole)}
                </p>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                userToTerminateAll &&
                terminateAllUserSessionsMutation.mutate(
                  userToTerminateAll.userId
                )
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Terminate All Sessions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
