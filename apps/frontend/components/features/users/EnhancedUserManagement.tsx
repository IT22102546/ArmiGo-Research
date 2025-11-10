"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  UserX,
  UserCheck,
  Key,
  Lock,
  Wallet,
  CreditCard,
  Clock,
  ShieldCheck,
  Download,
  RefreshCw,
  Plus,
  AlertCircle,
  Users,
  UserPlus,
  GraduationCap,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  Send,
  History,
  FileText,
  Settings,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Fingerprint,
  Shield,
  Building,
  UserCog,
  ClipboardList,
  MessageSquare,
  Bell,
  Smartphone,
  Globe,
  MoreHorizontal,
  Copy,
  ExternalLink,
  ChevronDown,
  SlidersHorizontal,
  LayoutGrid,
  List,
  X,
} from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";
import { gradesApi } from "@/lib/api/endpoints/grades";
import { mediumsApi } from "@/lib/api/endpoints/mediums";
import { toast } from "sonner";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
import { getDisplayName } from "@/lib/utils/display";
import { cn } from "@/lib/utils";
import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  subDays,
} from "date-fns";
import UserWalletDialog from "./UserWalletDialog";
import UserPaymentsDialog from "./UserPaymentsDialog";
import LoginAttemptsDialog from "./LoginAttemptsDialog";
import EditUserModal from "./EditUserModal";
import { CreateUserModal } from "./CreateUserModal";
import { Upload } from "lucide-react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
  lastLogin?: string;
  avatar?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  teachingSubjects?: any[];
  studentProfile?: {
    grade?: any;
    medium?: any;
    batch?: any;
    studentId?: string;
    guardianName?: string;
    guardianPhone?: string;
    faceVerified?: boolean;
    schoolName?: string;
  };
  teacherProfile?: {
    specialization?: string;
    experience?: number;
    employeeId?: string;
    department?: string;
    qualifications?: string[];
    canCreateExams?: boolean;
    canMonitorExams?: boolean;
  };
  district?: { name: string };
  wallet?: {
    balance: number;
    frozen?: boolean;
  };
  _count?: {
    enrollments?: number;
    examAttempts?: number;
    payments?: number;
  };
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  verifiedUsers: number;
  unverifiedUsers: number;
}

interface Filters {
  search: string;
  status: string;
  grade: string;
  medium: string;
  zone: string;
  batch: string;
  dateRange: string;
  verified: string;
  hasWallet: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface BulkAction {
  type:
    | "activate"
    | "deactivate"
    | "delete"
    | "export"
    | "sendNotification"
    | "resetPassword";
  userIds: string[];
}

interface QuickViewUser extends User {
  enrollments?: any[];
  recentPayments?: any[];
  attendanceRate?: number;
  examAverage?: number;
}

interface GrantAccessDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

const GrantAccessDialog: React.FC<GrantAccessDialogProps> = ({
  open,
  user,
  onClose,
  onSuccess,
}) => {
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState("");
  const [resourceType, setResourceType] = useState("EXAM");
  const [loading, setLoading] = useState(false);

  const handleGrant = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await ApiClient.post(`/users/${user.id}/grant-temporary-access`, {
        days,
        reason,
        resourceType,
      });
      handleApiSuccess(
        `Granted ${days} days of temporary access to ${user.firstName}`
      );
      onSuccess();
      onClose();
    } catch (error) {
      handleApiError(error, "GrantAccessDialog", "Failed to grant access");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Grant Temporary Access
          </DialogTitle>
          <DialogDescription>
            Grant temporary access to {user?.firstName} {user?.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Access Type</Label>
            <Select value={resourceType} onValueChange={setResourceType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXAM">Exam Access</SelectItem>
                <SelectItem value="CLASS">Class Access</SelectItem>
                <SelectItem value="COURSE_MATERIAL">
                  Course Materials
                </SelectItem>
                <SelectItem value="VIDEO_RECORDING">
                  Video Recordings
                </SelectItem>
                <SelectItem value="ASSIGNMENT">Assignments</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Number of Days</Label>
            <Input
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 7)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Access will expire on{" "}
              {format(new Date(Date.now() + days * 24 * 60 * 60 * 1000), "PPP")}
            </p>
          </div>
          <div>
            <Label>Reason (Optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for granting access..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleGrant} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Grant Access
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ResetPasswordDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  open,
  user,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  const handleReset = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await ApiClient.post(`/users/${user.id}/reset-password`, { sendEmail });
      handleApiSuccess(
        sendEmail
          ? `Password reset link sent to ${user.email}`
          : `Password reset successfully`
      );
      onClose();
    } catch (error) {
      handleApiError(error, "ResetPasswordDialog", "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Reset password for {user?.firstName} {user?.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sendEmail"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="h-4 w-4"
              aria-label="send email checkbox"
            />
            <Label htmlFor="sendEmail">Send reset link via email</Label>
          </div>
          {!sendEmail && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Password will be reset to default. User will be required to
                change on next login.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleReset} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Reset Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const EnhancedUserManagement: React.FC = () => {
  const router = useRouter();
  const t = useTranslations("users");
  const [activeTab, setActiveTab] = useState<string>("INTERNAL_STUDENT");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState<Array<{ id: string; name: string }>>([]);
  const [mediums, setMediums] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "ALL",
    grade: "ALL",
    medium: "ALL",
    zone: "",
    batch: "ALL",
    dateRange: "ALL",
    verified: "ALL",
    hasWallet: "ALL",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  // UI states
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [quickViewUser, setQuickViewUser] = useState<QuickViewUser | null>(
    null
  );
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [loadingQuickView, setLoadingQuickView] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    suspendedUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Dialog states
  const [grantAccessDialog, setGrantAccessDialog] = useState(false);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [walletDialog, setWalletDialog] = useState(false);
  const [paymentsDialog, setPaymentsDialog] = useState(false);
  const [loginAttemptsDialog, setLoginAttemptsDialog] = useState(false);
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [createUserModal, setCreateUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<
    BulkAction["type"] | null
  >(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const roleLabels: Record<string, string> = {
    INTERNAL_STUDENT: t("tabs.internalStudents"),
    EXTERNAL_STUDENT: t("tabs.externalStudents"),
    INTERNAL_TEACHER: t("tabs.internalTeachers"),
    EXTERNAL_TEACHER: t("tabs.externalTeachers"),
  };

  const roleIcons: Record<string, React.ReactNode> = {
    INTERNAL_STUDENT: <GraduationCap className="h-4 w-4" />,
    EXTERNAL_STUDENT: <BookOpen className="h-4 w-4" />,
    INTERNAL_TEACHER: <Users className="h-4 w-4" />,
    EXTERNAL_TEACHER: <UserCog className="h-4 w-4" />,
  };

  useEffect(() => {
    fetchGrades();
    fetchMediums();
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchStats();
    setSelectedUsers([]); // Clear selection when tab changes
  }, [activeTab, pagination.page, pagination.limit]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = (await ApiClient.get(
        `/users/stats?role=${activeTab}`
      )) as any;
      setStats(
        response || {
          totalUsers: 0,
          activeUsers: 0,
          pendingUsers: 0,
          suspendedUsers: 0,
          newUsersToday: 0,
          newUsersThisWeek: 0,
          verifiedUsers: 0,
          unverifiedUsers: 0,
        }
      );
    } catch (error) {
      // Stats endpoint might not exist yet, silently fail
      console.debug("Stats endpoint not available");
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchQuickViewData = async (user: User) => {
    setLoadingQuickView(true);
    setQuickViewUser(user);
    setQuickViewOpen(true);
    try {
      const [enrollments, payments] = await Promise.all([
        activeTab.includes("STUDENT")
          ? ApiClient.get(`/users/${user.id}/enrollments?limit=5`)
          : Promise.resolve([]),
        activeTab.includes("STUDENT")
          ? ApiClient.get(`/users/${user.id}/payments?limit=5`)
          : Promise.resolve([]),
      ]);
      setQuickViewUser({
        ...user,
        enrollments: (enrollments as any)?.data || enrollments || [],
        recentPayments: (payments as any)?.data || payments || [],
      });
    } catch (error) {
      console.debug("Quick view data not fully available");
    } finally {
      setLoadingQuickView(false);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await gradesApi.getAll();
      setGrades(response?.grades || []);
    } catch (error) {
      console.error("Failed to fetch grades:", error);
    }
  };

  const fetchMediums = async () => {
    try {
      const response = await mediumsApi.getAll();
      setMediums(response?.mediums || []);
    } catch (error) {
      console.error("Failed to fetch mediums:", error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        role: activeTab,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status &&
          filters.status !== "ALL" && { status: filters.status }),
        ...(filters.grade &&
          filters.grade !== "ALL" && { grade: filters.grade }),
        ...(filters.medium &&
          filters.medium !== "ALL" && { medium: filters.medium }),
        ...(filters.zone && { zone: filters.zone }),
      });

      const response = (await ApiClient.get(`/users?${params}`)) as any;

      // Handle both response formats: direct array or paginated object
      if (Array.isArray(response)) {
        // Direct array response
        setUsers(response);
        setPagination((prev) => ({
          ...prev,
          total: response.length,
          pages: 1,
        }));
      } else {
        // Paginated response object
        setUsers(response.data || []);
        setPagination((prev) => ({
          ...prev,
          total: response.total || 0,
          pages: response.pagination?.pages || 0,
        }));
      }
    } catch (error) {
      handleApiError(error, "EnhancedUserManagement", "Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "ALL",
      grade: "ALL",
      medium: "ALL",
      zone: "",
      batch: "ALL",
      dateRange: "ALL",
      verified: "ALL",
      hasWallet: "ALL",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkAction = async (actionType: BulkAction["type"]) => {
    if (selectedUsers.length === 0) {
      toast.error("Please select users first");
      return;
    }
    setBulkActionType(actionType);
    setBulkActionDialog(true);
  };

  const executeBulkAction = async () => {
    if (!bulkActionType || selectedUsers.length === 0) return;

    setBulkActionLoading(true);
    try {
      switch (bulkActionType) {
        case "activate":
          await ApiClient.post("/users/bulk-action", {
            userIds: selectedUsers,
            action: "activate",
          });
          handleApiSuccess(`${selectedUsers.length} users activated`);
          break;
        case "deactivate":
          await ApiClient.post("/users/bulk-action", {
            userIds: selectedUsers,
            action: "deactivate",
          });
          handleApiSuccess(`${selectedUsers.length} users deactivated`);
          break;
        case "sendNotification":
          await ApiClient.post("/users/bulk-notification", {
            userIds: selectedUsers,
          });
          handleApiSuccess(
            `Notification sent to ${selectedUsers.length} users`
          );
          break;
        case "resetPassword":
          await ApiClient.post("/users/bulk-reset-password", {
            userIds: selectedUsers,
          });
          handleApiSuccess(`Password reset for ${selectedUsers.length} users`);
          break;
        case "export":
          const blob = (await ApiClient.request("/users/export", {
            method: "POST",
            body: JSON.stringify({ userIds: selectedUsers }),
            responseType: "blob",
          })) as Blob;
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `selected_users_${new Date().toISOString().split("T")[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          handleApiSuccess(`Exported ${selectedUsers.length} users`);
          break;
        case "delete":
          await ApiClient.post("/users/bulk-delete", {
            userIds: selectedUsers,
          });
          handleApiSuccess(`${selectedUsers.length} users deleted`);
          break;
      }
      setSelectedUsers([]);
      fetchUsers();
      fetchStats();
    } catch (error) {
      handleApiError(
        error,
        "EnhancedUserManagement",
        `Failed to ${bulkActionType} users`
      );
    } finally {
      setBulkActionLoading(false);
      setBulkActionDialog(false);
      setBulkActionType(null);
    }
  };

  const handleStatusToggle = async (user: User) => {
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await ApiClient.patch(`/users/${user.id}`, { status: newStatus });
      handleApiSuccess(
        `User ${newStatus === "ACTIVE" ? "activated" : "deactivated"} successfully`
      );
      fetchUsers();
    } catch (error) {
      handleApiError(
        error,
        "EnhancedUserManagement",
        "Failed to update user status"
      );
    }
  };

  const handleDelete = async (user: User) => {
    if (
      !confirm(
        `Are you sure you want to delete ${user.firstName} ${user.lastName}?`
      )
    )
      return;

    try {
      await ApiClient.delete(`/users/${user.id}`);
      handleApiSuccess("User deleted successfully");
      fetchUsers();
    } catch (error) {
      handleApiError(error, "EnhancedUserManagement", "Failed to delete user");
    }
  };

  const handleExport = async () => {
    try {
      const params = {
        role: activeTab,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
      };

      const blob = (await ApiClient.request("/users/export", {
        method: "GET",
        params,
        responseType: "blob",
      })) as Blob;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      handleApiSuccess("Users exported successfully");
    } catch (error) {
      handleApiError(error, "EnhancedUserManagement", "Failed to export users");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: any; color: string; icon: React.ReactNode }
    > = {
      ACTIVE: {
        variant: "default",
        color:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        icon: <CheckCircle2 className="h-3 w-3" />,
      },
      SUSPENDED: {
        variant: "destructive",
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        icon: <Ban className="h-3 w-3" />,
      },
      PENDING: {
        variant: "secondary",
        color:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: <Clock className="h-3 w-3" />,
      },
      INACTIVE: {
        variant: "outline",
        color:
          "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
        icon: <XCircle className="h-3 w-3" />,
      },
    };

    const config = variants[status] || variants.INACTIVE;
    return (
      <Badge
        className={cn(config.color, "flex items-center gap-1")}
        variant={config.variant}
      >
        {config.icon}
        {status}
      </Badge>
    );
  };

  const getVerificationBadges = (user: User) => {
    const badges: React.ReactNode[] = [];

    if (user.emailVerified) {
      badges.push(
        <TooltipProvider key="email">
          <Tooltip>
            <TooltipTrigger>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              >
                <Mail className="h-3 w-3" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Email Verified</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (user.phoneVerified) {
      badges.push(
        <TooltipProvider key="phone">
          <Tooltip>
            <TooltipTrigger>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              >
                <Phone className="h-3 w-3" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Phone Verified</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (user.twoFactorEnabled) {
      badges.push(
        <TooltipProvider key="2fa">
          <Tooltip>
            <TooltipTrigger>
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
              >
                <Shield className="h-3 w-3" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>2FA Enabled</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (user.studentProfile?.faceVerified) {
      badges.push(
        <TooltipProvider key="face">
          <Tooltip>
            <TooltipTrigger>
              <Badge
                variant="outline"
                className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
              >
                <Fingerprint className="h-3 w-3" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Face Verified</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return badges.length > 0 ? (
      <div className="flex items-center gap-1">{badges}</div>
    ) : (
      <span className="text-xs text-muted-foreground">Not verified</span>
    );
  };

  const getLastLoginDisplay = (user: User) => {
    const lastLogin = user.lastLogin || user.lastLoginAt;
    if (!lastLogin) {
      return (
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Never logged in
        </span>
      );
    }

    const loginDate = new Date(lastLogin);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let statusColor = "text-green-600 dark:text-green-400";
    if (diffDays > 30) {
      statusColor = "text-red-600 dark:text-red-400";
    } else if (diffDays > 7) {
      statusColor = "text-yellow-600 dark:text-yellow-400";
    }

    return (
      <div className="flex flex-col">
        <span className={cn("text-sm font-medium", statusColor)}>
          {formatDistanceToNow(loginDate, { addSuffix: true })}
        </span>
        <span className="text-xs text-muted-foreground">
          {format(loginDate, "PPp")}
        </span>
      </div>
    );
  };

  const renderUserInfo = (user: User) => {
    const isStudent = activeTab.includes("STUDENT");
    const isTeacher = activeTab.includes("TEACHER");

    return (
      <div className="flex flex-col">
        <span className="font-medium">
          {user.firstName} {user.lastName}
        </span>
        <span className="text-sm text-muted-foreground">{user.email}</span>
        {isStudent && user.studentProfile?.studentId && (
          <Badge variant="outline" className="font-mono text-xs bg-primary/5 border-primary/20 text-primary w-fit mt-1">
            {user.studentProfile.studentId}
          </Badge>
        )}
        {isTeacher && user.teacherProfile?.employeeId && (
          <span className="text-xs text-muted-foreground">
            ID: {user.teacherProfile.employeeId}
          </span>
        )}
      </div>
    );
  };

  const renderRoleSpecificInfo = (user: User) => {
    if (activeTab.includes("STUDENT") && user.studentProfile) {
      return (
        <div className="flex flex-col gap-1">
          {user.studentProfile.grade && (
            <span className="text-sm">
              Grade: {getDisplayName(user.studentProfile.grade)}
            </span>
          )}
          {user.studentProfile.batch && (
            <span className="text-sm text-muted-foreground">
              Batch:{" "}
              {typeof user.studentProfile.batch === "object" &&
              user.studentProfile.batch
                ? user.studentProfile.batch.name
                : user.studentProfile.batch}
            </span>
          )}
        </div>
      );
    }

    if (activeTab.includes("TEACHER") && user.teacherProfile) {
      return (
        <div className="flex flex-col gap-1">
          {user.teacherProfile.specialization && (
            <span className="text-sm">
              {user.teacherProfile.specialization}
            </span>
          )}
          {user.teacherProfile.experience && (
            <span className="text-sm text-muted-foreground">
              {user.teacherProfile.experience} years exp.
            </span>
          )}
        </div>
      );
    }

    return <span className="text-sm text-muted-foreground">-</span>;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                {t("management.title")}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t("management.subtitle")}
              </p>
            </div>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        fetchUsers();
                        fetchStats();
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("management.refreshData")}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                {t("management.exportAll")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/users/bulk-upload")}
              >
                <Upload className="h-4 w-4 mr-2" />
                {t("management.bulkUpload")}
              </Button>
              <Button type="button" onClick={() => setCreateUserModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("management.addUser")}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("stats.total")}
                </p>
                <p className="text-2xl font-bold">
                  {loadingStats ? "-" : stats.totalUsers}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("stats.active")}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {loadingStats ? "-" : stats.activeUsers}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("stats.pending")}
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {loadingStats ? "-" : stats.pendingUsers}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("stats.suspended")}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {loadingStats ? "-" : stats.suspendedUsers}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Ban className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("stats.newToday")}
                </p>
                <p className="text-2xl font-bold">
                  {loadingStats ? "-" : stats.newUsersToday}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("stats.thisWeek")}
                </p>
                <p className="text-2xl font-bold">
                  {loadingStats ? "-" : stats.newUsersThisWeek}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("stats.verified")}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {loadingStats ? "-" : stats.verifiedUsers}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("stats.unverified")}
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {loadingStats ? "-" : stats.unverifiedUsers}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger
            value="INTERNAL_STUDENT"
            className="flex items-center gap-2"
          >
            <GraduationCap className="h-4 w-4" />
            <span className="hidden md:inline">
              {t("tabs.internalStudents")}
            </span>
            <span className="md:hidden">{t("tabs.internalShort")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="EXTERNAL_STUDENT"
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden md:inline">
              {t("tabs.externalStudents")}
            </span>
            <span className="md:hidden">{t("tabs.externalShort")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="INTERNAL_TEACHER"
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">
              {t("tabs.internalTeachers")}
            </span>
            <span className="md:hidden">{t("tabs.intTeachersShort")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="EXTERNAL_TEACHER"
            className="flex items-center gap-2"
          >
            <UserCog className="h-4 w-4" />
            <span className="hidden md:inline">
              {t("tabs.externalTeachers")}
            </span>
            <span className="md:hidden">{t("tabs.extTeachersShort")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  {t("filters.title")}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  {showAdvancedFilters
                    ? t("filters.simple")
                    : t("filters.advanced")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <Label>{t("filters.search")}</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("management.searchPlaceholder")}
                      value={filters.search}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          search: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button onClick={handleSearch}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>{t("filters.status")}</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("filters.allStatuses")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">{t("filters.all")}</SelectItem>
                      <SelectItem value="ACTIVE">
                        {t("stats.active")}
                      </SelectItem>
                      <SelectItem value="SUSPENDED">
                        {t("stats.suspended")}
                      </SelectItem>
                      <SelectItem value="PENDING">
                        {t("stats.pending")}
                      </SelectItem>
                      <SelectItem value="INACTIVE">
                        {t("status.inactive")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {activeTab.includes("STUDENT") && (
                  <div>
                    <Label>{t("filters.grade")}</Label>
                    <Select
                      value={filters.grade}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, grade: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("filters.allGrades")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">{t("filters.all")}</SelectItem>
                        {grades
                          .filter((grade) => grade.id)
                          .map((grade) => (
                            <SelectItem key={grade.id} value={grade.id}>
                              {grade.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>{t("filters.medium")}</Label>
                  <Select
                    value={filters.medium}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, medium: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("filters.allMediums")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">{t("filters.all")}</SelectItem>
                      {mediums
                        .filter((medium) => medium.id)
                        .map((medium) => (
                          <SelectItem key={medium.id} value={medium.id}>
                            {medium.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <Label>{t("filters.verificationStatus")}</Label>
                    <Select
                      value={filters.verified}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, verified: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("filters.all")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">{t("filters.all")}</SelectItem>
                        <SelectItem value="VERIFIED">
                          {t("stats.verified")}
                        </SelectItem>
                        <SelectItem value="UNVERIFIED">
                          {t("stats.unverified")}
                        </SelectItem>
                        <SelectItem value="EMAIL_VERIFIED">
                          {t("filters.emailVerified")}
                        </SelectItem>
                        <SelectItem value="PHONE_VERIFIED">
                          {t("filters.phoneVerified")}
                        </SelectItem>
                        <SelectItem value="2FA_ENABLED">
                          {t("filters.twoFAEnabled")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t("filters.registrationDate")}</Label>
                    <Select
                      value={filters.dateRange}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, dateRange: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("filters.allTime")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">
                          {t("filters.allTime")}
                        </SelectItem>
                        <SelectItem value="TODAY">
                          {t("filters.today")}
                        </SelectItem>
                        <SelectItem value="WEEK">
                          {t("filters.thisWeekFilter")}
                        </SelectItem>
                        <SelectItem value="MONTH">
                          {t("filters.thisMonth")}
                        </SelectItem>
                        <SelectItem value="QUARTER">
                          {t("filters.thisQuarter")}
                        </SelectItem>
                        <SelectItem value="YEAR">
                          {t("filters.thisYear")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {activeTab.includes("STUDENT") && (
                    <div>
                      <Label>{t("filters.walletStatus")}</Label>
                      <Select
                        value={filters.hasWallet}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, hasWallet: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("filters.all")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">
                            {t("filters.all")}
                          </SelectItem>
                          <SelectItem value="HAS_WALLET">
                            {t("filters.hasWallet")}
                          </SelectItem>
                          <SelectItem value="NO_WALLET">
                            {t("filters.noWallet")}
                          </SelectItem>
                          <SelectItem value="POSITIVE_BALANCE">
                            {t("filters.positiveBalance")}
                          </SelectItem>
                          <SelectItem value="ZERO_BALANCE">
                            {t("filters.zeroBalance")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label>{t("filters.sortBy")}</Label>
                    <div className="flex gap-2">
                      <Select
                        value={filters.sortBy}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, sortBy: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="createdAt">
                            {t("filters.registrationDateSort")}
                          </SelectItem>
                          <SelectItem value="lastLogin">
                            {t("filters.lastLoginSort")}
                          </SelectItem>
                          <SelectItem value="firstName">
                            {t("filters.nameSort")}
                          </SelectItem>
                          <SelectItem value="email">
                            {t("filters.emailSort")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            sortOrder:
                              prev.sortOrder === "asc" ? "desc" : "asc",
                          }))
                        }
                      >
                        {filters.sortOrder === "asc" ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setViewMode(viewMode === "table" ? "grid" : "table")
                    }
                  >
                    {viewMode === "table" ? (
                      <>
                        <LayoutGrid className="h-4 w-4 mr-2" />{" "}
                        {t("filters.gridView")}
                      </>
                    ) : (
                      <>
                        <List className="h-4 w-4 mr-2" />{" "}
                        {t("filters.tableView")}
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    {t("filters.clearFilters")}
                  </Button>
                  <Button onClick={handleSearch}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t("filters.applyFilters")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions Bar */}
          {selectedUsers.length > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                      {selectedUsers.length} {t("bulkActions.selected")}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUsers([])}
                    >
                      {t("bulkActions.clearSelection")}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction("activate")}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      {t("bulkActions.activate")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction("deactivate")}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      {t("bulkActions.deactivate")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction("sendNotification")}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      {t("bulkActions.sendNotification")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction("export")}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t("bulkActions.export")}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleBulkAction("resetPassword")}
                        >
                          <Key className="h-4 w-4 mr-2" />
                          {t("bulkActions.resetPasswords")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleBulkAction("delete")}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t("bulkActions.deleteSelected")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {roleIcons[activeTab]}
                  <span>{roleLabels[activeTab]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {pagination.total} {t("pagination.users")}
                  </Badge>
                  {users.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                      {selectedUsers.length === users.length
                        ? t("table.deselectAll")
                        : t("table.selectAll")}
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col justify-center items-center py-12 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">
                    {t("table.loadingUsers")}
                  </p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">
                    {t("table.noUsers")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("table.adjustFilters")}
                  </p>
                  <div className="flex gap-2 justify-center mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/admin/users/bulk-upload")}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {t("management.bulkUpload")}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCreateUserModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("management.addUser")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              selectedUsers.length === users.length &&
                              users.length > 0
                            }
                            onCheckedChange={handleSelectAll}
                            aria-label={t("table.selectAll")}
                          />
                        </TableHead>
                        <TableHead>{t("table.user")}</TableHead>
                        <TableHead>{t("table.roleInfo")}</TableHead>
                        <TableHead>{t("table.status")}</TableHead>
                        <TableHead>{t("table.verification")}</TableHead>
                        <TableHead>{t("table.lastLogin")}</TableHead>
                        <TableHead>{t("table.district")}</TableHead>
                        {activeTab.includes("STUDENT") && (
                          <TableHead>{t("table.wallet")}</TableHead>
                        )}
                        <TableHead className="text-right">
                          {t("table.actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow
                          key={user.id}
                          className={cn(
                            selectedUsers.includes(user.id) && "bg-primary/5"
                          )}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={() => handleSelectUser(user.id)}
                              aria-label={`${t("table.select")} ${user.firstName} ${user.lastName}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                  {user.firstName?.[0]}
                                  {user.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              {renderUserInfo(user)}
                            </div>
                          </TableCell>
                          <TableCell>{renderRoleSpecificInfo(user)}</TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell>{getVerificationBadges(user)}</TableCell>
                          <TableCell>{getLastLoginDisplay(user)}</TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {user.district?.name || "-"}
                            </span>
                          </TableCell>
                          {activeTab.includes("STUDENT") && (
                            <TableCell>
                              {user.wallet ? (
                                <div className="flex flex-col">
                                  <span
                                    className={cn(
                                      "text-sm font-medium",
                                      (user.wallet.balance || 0) > 0
                                        ? "text-green-600"
                                        : "text-muted-foreground"
                                    )}
                                  >
                                    Rs.{" "}
                                    {(
                                      user.wallet.balance || 0
                                    ).toLocaleString()}
                                  </span>
                                  {user.wallet.frozen && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-blue-50 text-blue-700"
                                    >
                                      Frozen
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  {t("table.noWallet")}
                                </span>
                              )}
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => fetchQuickViewData(user)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {t("actions.quickView")}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-56"
                                >
                                  <DropdownMenuLabel>
                                    {t("table.actions")}
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (activeTab.includes("STUDENT")) {
                                        router.push(
                                          `/admin/students/${user.id}`
                                        );
                                      } else {
                                        router.push(
                                          `/admin/teachers/${user.id}`
                                        );
                                      }
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    {t("actions.viewProfile")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setEditUserDialog(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    {t("actions.editUser")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleStatusToggle(user)}
                                  >
                                    {user.status === "ACTIVE" ? (
                                      <>
                                        <UserX className="h-4 w-4 mr-2" />
                                        {t("actions.deactivateUser")}
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="h-4 w-4 mr-2" />
                                        {t("actions.activateUser")}
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setResetPasswordDialog(true);
                                    }}
                                  >
                                    <Key className="h-4 w-4 mr-2" />
                                    {t("actions.resetPassword")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setLoginAttemptsDialog(true);
                                    }}
                                  >
                                    <Lock className="h-4 w-4 mr-2" />
                                    {t("actions.viewLoginAttempts")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {activeTab.includes("STUDENT") && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedUser(user);
                                          setWalletDialog(true);
                                        }}
                                      >
                                        <Wallet className="h-4 w-4 mr-2" />
                                        {t("actions.viewWallet")}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedUser(user);
                                          setPaymentsDialog(true);
                                        }}
                                      >
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        {t("actions.viewPayments")}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedUser(user);
                                          setGrantAccessDialog(true);
                                        }}
                                      >
                                        <Clock className="h-4 w-4 mr-2" />
                                        {t("actions.grantAccess")}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                    </>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(user)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {t("actions.deleteUser")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {!loading && users.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    {t("pagination.showing")}{" "}
                    {(pagination.page - 1) * pagination.limit + 1}{" "}
                    {t("pagination.to")}{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    {t("pagination.of")} {pagination.total}{" "}
                    {t("pagination.users")}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: 1 }))
                      }
                      disabled={pagination.page === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page - 1,
                        }))
                      }
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2 px-3">
                      <span className="text-sm">
                        {t("pagination.page")} {pagination.page}{" "}
                        {t("pagination.of")} {pagination.pages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: prev.page + 1,
                        }))
                      }
                      disabled={pagination.page >= pagination.pages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: prev.pages }))
                      }
                      disabled={pagination.page >= pagination.pages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <GrantAccessDialog
        open={grantAccessDialog}
        user={selectedUser}
        onClose={() => {
          setGrantAccessDialog(false);
          setSelectedUser(null);
        }}
        onSuccess={fetchUsers}
      />

      <ResetPasswordDialog
        open={resetPasswordDialog}
        user={selectedUser}
        onClose={() => {
          setResetPasswordDialog(false);
          setSelectedUser(null);
        }}
      />

      <UserWalletDialog
        open={walletDialog}
        userId={selectedUser?.id || null}
        userName={
          selectedUser
            ? `${selectedUser.firstName} ${selectedUser.lastName}`
            : ""
        }
        onClose={() => {
          setWalletDialog(false);
          setSelectedUser(null);
        }}
      />

      <UserPaymentsDialog
        open={paymentsDialog}
        userId={selectedUser?.id || null}
        userName={
          selectedUser
            ? `${selectedUser.firstName} ${selectedUser.lastName}`
            : ""
        }
        onClose={() => {
          setPaymentsDialog(false);
          setSelectedUser(null);
        }}
      />

      <LoginAttemptsDialog
        open={loginAttemptsDialog}
        userId={selectedUser?.id || null}
        userName={
          selectedUser
            ? `${selectedUser.firstName} ${selectedUser.lastName}`
            : ""
        }
        onClose={() => {
          setLoginAttemptsDialog(false);
          setSelectedUser(null);
        }}
      />

      <EditUserModal
        open={editUserDialog}
        user={selectedUser}
        onClose={() => {
          setEditUserDialog(false);
          setSelectedUser(null);
        }}
        onSuccess={() => {
          fetchUsers();
          fetchStats();
        }}
      />

      <CreateUserModal
        isOpen={createUserModal}
        onClose={() => setCreateUserModal(false)}
        onSuccess={() => {
          fetchUsers();
          fetchStats();
        }}
      />

      {/* Quick View Sidebar */}
      <Sheet open={quickViewOpen} onOpenChange={setQuickViewOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              {quickViewUser && (
                <>
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={quickViewUser.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                      {quickViewUser.firstName?.[0]}
                      {quickViewUser.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {quickViewUser.firstName} {quickViewUser.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground font-normal">
                      {quickViewUser.email}
                    </p>
                  </div>
                </>
              )}
            </SheetTitle>
            <SheetDescription>{t("quickView.description")}</SheetDescription>
          </SheetHeader>

          {loadingQuickView ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            quickViewUser && (
              <div className="mt-6 space-y-6">
                {/* Status and Actions */}
                <div className="flex items-center justify-between">
                  {getStatusBadge(quickViewUser.status)}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQuickViewOpen(false);
                        setSelectedUser(quickViewUser);
                        setEditUserDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {t("quickView.edit")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setQuickViewOpen(false);
                        if (activeTab.includes("STUDENT")) {
                          router.push(`/admin/students/${quickViewUser.id}`);
                        } else {
                          router.push(`/admin/teachers/${quickViewUser.id}`);
                        }
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {t("quickView.fullProfile")}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Contact Information */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {t("quickView.contactInformation")}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">
                        {t("quickView.phone")}
                      </p>
                      <p className="font-medium">
                        {quickViewUser.phone || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {t("quickView.email")}
                      </p>
                      <p className="font-medium truncate">
                        {quickViewUser.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {t("quickView.district")}
                      </p>
                      <p className="font-medium">
                        {quickViewUser.district?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {t("quickView.registered")}
                      </p>
                      <p className="font-medium">
                        {quickViewUser.createdAt
                          ? format(new Date(quickViewUser.createdAt), "PP")
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Verification Status */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {t("quickView.verificationStatus")}
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {t("quickView.emailVerified")}
                      </span>
                      {quickViewUser.emailVerified ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {t("quickView.phoneVerified")}
                      </span>
                      {quickViewUser.phoneVerified ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {t("quickView.twoFactorAuth")}
                      </span>
                      {quickViewUser.twoFactorEnabled ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    {activeTab.includes("STUDENT") && (
                      <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span className="flex items-center gap-2">
                          <Fingerprint className="h-4 w-4" />
                          {t("quickView.faceVerified")}
                        </span>
                        {quickViewUser.studentProfile?.faceVerified ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Student/Teacher Specific Info */}
                {activeTab.includes("STUDENT") &&
                  quickViewUser.studentProfile && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          {t("quickView.academicInfo")}
                        </h4>
                        {/* Registration Number - Prominent Display */}
                        {quickViewUser.studentProfile.studentId && (
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-xs text-muted-foreground mb-1">
                              Registration Number
                            </p>
                            <p className="font-mono font-bold text-base text-primary">
                              {quickViewUser.studentProfile.studentId}
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">
                              {t("quickView.grade")}
                            </p>
                            <p className="font-medium">
                              {getDisplayName(
                                quickViewUser.studentProfile.grade
                              ) || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              {t("quickView.guardian")}
                            </p>
                            <p className="font-medium">
                              {quickViewUser.studentProfile.guardianName || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              {t("quickView.guardianPhone")}
                            </p>
                            <p className="font-medium">
                              {quickViewUser.studentProfile.guardianPhone ||
                                "-"}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-muted-foreground">
                              {t("quickView.school")}
                            </p>
                            <p className="font-medium">
                              {quickViewUser.studentProfile.schoolName || "-"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Wallet Info */}
                      {quickViewUser.wallet && (
                        <>
                          <Separator />
                          <div className="space-y-3">
                            <h4 className="font-medium flex items-center gap-2">
                              <Wallet className="h-4 w-4" />
                              {t("quickView.walletBalance")}
                            </h4>
                            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5">
                              <p className="text-2xl font-bold text-primary">
                                Rs.{" "}
                                {(
                                  quickViewUser.wallet.balance || 0
                                ).toLocaleString()}
                              </p>
                              {quickViewUser.wallet.frozen && (
                                <Badge className="mt-2" variant="secondary">
                                  {t("quickView.walletFrozen")}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                {activeTab.includes("TEACHER") &&
                  quickViewUser.teacherProfile && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {t("quickView.professionalInfo")}
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">
                              {t("quickView.employeeId")}
                            </p>
                            <p className="font-medium">
                              {quickViewUser.teacherProfile.employeeId || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              {t("quickView.department")}
                            </p>
                            <p className="font-medium">
                              {quickViewUser.teacherProfile.department || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              {t("quickView.specialization")}
                            </p>
                            <p className="font-medium">
                              {quickViewUser.teacherProfile.specialization ||
                                "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              {t("quickView.experience")}
                            </p>
                            <p className="font-medium">
                              {quickViewUser.teacherProfile.experience
                                ? `${quickViewUser.teacherProfile.experience} ${t("quickView.years")}`
                                : "-"}
                            </p>
                          </div>
                        </div>
                        {quickViewUser.teacherProfile.qualifications &&
                          quickViewUser.teacherProfile.qualifications.length >
                            0 && (
                            <div>
                              <p className="text-muted-foreground text-sm mb-2">
                                {t("quickView.qualifications")}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {quickViewUser.teacherProfile.qualifications.map(
                                  (qual, idx) => (
                                    <Badge key={idx} variant="secondary">
                                      {qual}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        <div className="flex gap-2 mt-2">
                          {quickViewUser.teacherProfile.canCreateExams && (
                            <Badge className="bg-blue-100 text-blue-800">
                              {t("quickView.canCreateExams")}
                            </Badge>
                          )}
                          {quickViewUser.teacherProfile.canMonitorExams && (
                            <Badge className="bg-green-100 text-green-800">
                              {t("quickView.canMonitorExams")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                {/* Quick Actions */}
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    {t("quickView.quickActions")}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setQuickViewOpen(false);
                        setSelectedUser(quickViewUser);
                        setResetPasswordDialog(true);
                      }}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      {t("quickView.resetPassword")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setQuickViewOpen(false);
                        setSelectedUser(quickViewUser);
                        setLoginAttemptsDialog(true);
                      }}
                    >
                      <History className="h-4 w-4 mr-2" />
                      {t("quickView.loginHistory")}
                    </Button>
                    {activeTab.includes("STUDENT") && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setQuickViewOpen(false);
                            setSelectedUser(quickViewUser);
                            setWalletDialog(true);
                          }}
                        >
                          <Wallet className="h-4 w-4 mr-2" />
                          {t("quickView.manageWallet")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setQuickViewOpen(false);
                            setSelectedUser(quickViewUser);
                            setGrantAccessDialog(true);
                          }}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          {t("quickView.grantAccess")}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </SheetContent>
      </Sheet>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={bulkActionDialog} onOpenChange={setBulkActionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {bulkActionType === "delete" && (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              {t("bulkActions.confirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkActionType === "activate" &&
                t("bulkActions.confirmActivate", {
                  count: selectedUsers.length,
                })}
              {bulkActionType === "deactivate" &&
                t("bulkActions.confirmDeactivate", {
                  count: selectedUsers.length,
                })}
              {bulkActionType === "delete" &&
                t("bulkActions.confirmDelete", { count: selectedUsers.length })}
              {bulkActionType === "sendNotification" &&
                t("bulkActions.confirmNotification", {
                  count: selectedUsers.length,
                })}
              {bulkActionType === "resetPassword" &&
                t("bulkActions.confirmResetPassword", {
                  count: selectedUsers.length,
                })}
              {bulkActionType === "export" &&
                t("bulkActions.confirmExport", { count: selectedUsers.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkActionLoading}>
              {t("bulkActions.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBulkAction}
              disabled={bulkActionLoading}
              className={cn(
                bulkActionType === "delete" && "bg-red-600 hover:bg-red-700"
              )}
            >
              {bulkActionLoading && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t("bulkActions.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EnhancedUserManagement;
