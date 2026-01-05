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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Minus,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CreditCard,
  Shield,
  GraduationCap,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  RefreshCw,
  Loader2,
  AlertCircle,
  BookOpen,
  Target,
  Award,
  BarChart3,
  FileText,
  MessageSquare,
  Send,
  Fingerprint,
  Eye,
  Download,
  Copy,
  ExternalLink,
  History,
  Smartphone,
  Globe,
  ShieldCheck,
  ShieldX,
  Wallet,
  Receipt,
} from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";
import { gradesApi } from "@/lib/api/endpoints/grades";
import { mediumsApi } from "@/lib/api/endpoints/mediums";
import { handleApiError } from "@/lib/error-handling";
import {
  format,
  formatDistanceToNow,
  differenceInDays,
  isAfter,
  subDays,
} from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
// getDisplayName intentionally not used here; keep for consistency if needed

// Helper to safely format dates without throwing on invalid dates
const safeFormatDate = (value?: string | Date | null, fmt = "PPp") => {
  if (!value) return "-";
  let d: Date;
  try {
    d = typeof value === "string" ? new Date(value) : (value as Date);
  } catch (e) {
    return "-";
  }
  if (!d || Number.isNaN(d.getTime())) return "-";
  try {
    return format(d, fmt);
  } catch (e) {
    return "-";
  }
};

interface StudentDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
  studentProfile: {
    id: string;
    dateOfBirth?: string;
    grade?: any; // could be grade ID or Grade object
    medium?: any; // could be medium ID or Medium object
    batch?: any; // could be batch ID or Batch object
    schoolName?: string;
    address?: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianRelationship?: string;
    isInternal: boolean;
    faceVerified: boolean;
    faceImagePath?: string;
  };
  wallet?: {
    id: string;
    balance: number;
    minimumBalance: number;
    totalCredits: number;
    totalDebits: number;
  };
  enrollments?: Array<{
    id: string;
    status: string;
    enrolledAt: string;
    class: {
      id: string;
      name: string;
      subject: { name: string };
      teacher: { firstName: string; lastName: string };
    };
    payments?: Array<{
      id: string;
      amount: number;
      status: string;
    }>;
  }>;
  examAttempts?: Array<{
    id: string;
    score: number;
    totalMarks: number;
    attemptedAt: string;
    exam: {
      id: string;
      title: string;
      class: { name: string };
    };
  }>;
  attendance?: Array<{
    id: string;
    status: string;
    markedAt: string;
    classSession: {
      id: string;
      sessionDate: string;
      class: { name: string };
    };
  }>;
}

interface TemporaryAccess {
  id: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt: string;
  reason: string;
  isActive: boolean;
}

interface LoginAttempt {
  id: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  attemptedAt: string;
  failureReason?: string;
}

export function StudentDetailPage({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [temporaryAccesses, setTemporaryAccesses] = useState<TemporaryAccess[]>(
    []
  );
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [activeTab, setActiveTab] = useState("profile");

  // Dialog states
  const [editProfileDialog, setEditProfileDialog] = useState(false);
  const [changeGradeDialog, setChangeGradeDialog] = useState(false);
  const [enrollClassDialog, setEnrollClassDialog] = useState(false);
  const [adjustWalletDialog, setAdjustWalletDialog] = useState(false);
  const [grantAccessDialog, setGrantAccessDialog] = useState(false);
  const [deactivateDialog, setDeactivateDialog] = useState(false);
  const [confirmActionDialog, setConfirmActionDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: string;
    data?: any;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState<any>({});
  const [newGrade, setNewGrade] = useState("");
  const [newMedium, setNewMedium] = useState("");
  const [grades, setGrades] = useState<
    Array<{ id: string; name: string; level?: number }>
  >([]);
  const [mediums, setMediums] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [walletAmount, setWalletAmount] = useState("");
  const [walletType, setWalletType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [walletReason, setWalletReason] = useState("");
  const [accessDays, setAccessDays] = useState("7");
  const [accessReason, setAccessReason] = useState("");
  const [accessType, setAccessType] = useState("EXAM");

  // Computed stats
  const [overallStats, setOverallStats] = useState({
    totalEnrollments: 0,
    activeEnrollments: 0,
    completedExams: 0,
    averageScore: 0,
    attendanceRate: 0,
    totalPayments: 0,
    pendingPayments: 0,
    accountAge: 0,
    lastActiveAgo: "",
    riskLevel: "low" as "low" | "medium" | "high",
  });

  // Attendance stats
  const [attendanceStats, setAttendanceStats] = useState<{
    [key: string]: {
      present: number;
      absent: number;
      total: number;
      percentage: number;
    };
  }>({});

  useEffect(() => {
    fetchStudentDetails();
  }, [studentId]);

  useEffect(() => {
    fetchGrades();
    fetchMediums();
  }, []);

  const fetchStudentDetails = async () => {
    setLoading(true);
    try {
      const response = (await ApiClient.get(`/users/${studentId}`)) as any;
      setStudent(response);
      setEditForm(response);
      // Initialize newGrade and newMedium from fetched student profile
      const p = response.studentProfile;
      if (p) {
        if (typeof p.grade === "object") {
          setNewGrade(p.grade.level?.toString() || "");
        } else if (p.grade) {
          setNewGrade(p.grade.toString());
        } else {
          setNewGrade("");
        }

        if (typeof p.medium === "object") {
          setNewMedium(p.medium.name || "");
        } else if (p.medium) {
          setNewMedium(p.medium);
        } else {
          setNewMedium("");
        }
      }

      // Fetch temporary accesses
      try {
        const accessesRes = (await ApiClient.get(
          `/users/${studentId}/temporary-accesses`
        )) as any;
        setTemporaryAccesses(accessesRes.data || accessesRes || []);
      } catch (e) {
        console.debug("Temporary accesses not available");
      }

      // Fetch login attempts
      try {
        const attemptsRes = (await ApiClient.get(
          `/users/${studentId}/login-attempts`
        )) as any;
        setLoginAttempts(attemptsRes.attempts || attemptsRes || []);
      } catch (e) {
        console.debug("Login attempts not available");
      }

      // Calculate attendance stats
      if (response.attendance) {
        calculateAttendanceStats(response.attendance);
      }

      // Calculate overall stats
      calculateOverallStats(response);
    } catch (error) {
      handleApiError(
        error,
        "StudentDetailPage",
        "Failed to fetch student details"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      const res = (await gradesApi.getAll()) as any;
      setGrades(res?.grades || []);
    } catch (err) {
      console.error("Failed to fetch grades", err);
    }
  };

  const fetchMediums = async () => {
    try {
      const res = (await mediumsApi.getAll()) as any;
      setMediums(res?.mediums || []);
    } catch (err) {
      console.error("Failed to fetch mediums", err);
    }
  };

  const calculateAttendanceStats = (attendance: any[]) => {
    const statsByClass: any = {};

    attendance.forEach((record) => {
      const className = record.classSession?.class?.name || "Unknown Class";
      if (!statsByClass[className]) {
        statsByClass[className] = {
          present: 0,
          absent: 0,
          total: 0,
          percentage: 0,
        };
      }
      statsByClass[className].total++;
      if (record.status === "PRESENT") {
        statsByClass[className].present++;
      } else {
        statsByClass[className].absent++;
      }
    });

    Object.keys(statsByClass).forEach((className) => {
      const stats = statsByClass[className];
      stats.percentage =
        stats.total > 0 ? (stats.present / stats.total) * 100 : 0;
    });

    setAttendanceStats(statsByClass);
  };

  const calculateOverallStats = (studentData: StudentDetail) => {
    const enrollments = studentData.enrollments || [];
    const exams = studentData.examAttempts || [];
    const attendance = studentData.attendance || [];

    // Enrollment stats
    const activeEnrollments = enrollments.filter(
      (e) => e.status === "ACTIVE"
    ).length;

    // Exam stats
    const avgScore =
      exams.length > 0
        ? exams.reduce((sum, e) => sum + (e.score / e.totalMarks) * 100, 0) /
          exams.length
        : 0;

    // Attendance stats
    const presentCount = attendance.filter(
      (a) => a.status === "PRESENT"
    ).length;
    const attendanceRate =
      attendance.length > 0 ? (presentCount / attendance.length) * 100 : 0;

    // Payment stats
    const allPayments = enrollments.flatMap((e) => e.payments || []);
    const pendingPayments = allPayments.filter(
      (p) => p.status !== "COMPLETED"
    ).length;

    // Account age
    const createdDate = new Date(studentData.createdAt);
    const accountAge = differenceInDays(new Date(), createdDate);

    // Last active
    const lastActive = studentData.lastLoginAt
      ? formatDistanceToNow(new Date(studentData.lastLoginAt), {
          addSuffix: true,
        })
      : "Never";

    // Risk assessment
    let riskLevel: "low" | "medium" | "high" = "low";
    if (studentData.status !== "ACTIVE") riskLevel = "high";
    else if (attendanceRate < 50 || avgScore < 40) riskLevel = "high";
    else if (attendanceRate < 75 || avgScore < 60 || pendingPayments > 2)
      riskLevel = "medium";

    setOverallStats({
      totalEnrollments: enrollments.length,
      activeEnrollments,
      completedExams: exams.length,
      averageScore: avgScore,
      attendanceRate,
      totalPayments: allPayments.length,
      pendingPayments,
      accountAge,
      lastActiveAgo: lastActive,
      riskLevel,
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStudentDetails();
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleUpdateProfile = async () => {
    try {
      await ApiClient.patch(`/users/${studentId}`, editForm);
      await fetchStudentDetails();
      setEditProfileDialog(false);
    } catch (error) {
      handleApiError(error, "StudentDetailPage", "Failed to update profile");
    }
  };

  const handleChangeGrade = async () => {
    try {
      await ApiClient.patch(`/users/${studentId}/student-profile`, {
        grade: parseInt(newGrade),
        medium: newMedium,
      });
      await fetchStudentDetails();
      setChangeGradeDialog(false);
    } catch (error) {
      handleApiError(
        error,
        "StudentDetailPage",
        "Failed to change grade/medium"
      );
    }
  };

  const handleAdjustWallet = async () => {
    try {
      await ApiClient.post(`/users/${studentId}/wallet/adjust`, {
        amount: parseFloat(walletAmount),
        type: walletType,
        reason: walletReason,
      });
      await fetchStudentDetails();
      setAdjustWalletDialog(false);
      setWalletAmount("");
      setWalletReason("");
    } catch (error) {
      handleApiError(error, "StudentDetailPage", "Failed to adjust wallet");
    }
  };

  const handleGrantAccess = async () => {
    try {
      setActionLoading(true);
      await ApiClient.post(`/users/${studentId}/grant-temporary-access`, {
        days: parseInt(accessDays),
        reason: accessReason,
        resourceType: accessType,
      });
      toast.success(
        `Granted ${accessDays} days of ${accessType.toLowerCase()} access`
      );
      await fetchStudentDetails();
      setGrantAccessDialog(false);
      setAccessDays("7");
      setAccessReason("");
      setAccessType("EXAM");
    } catch (error) {
      handleApiError(
        error,
        "StudentDetailPage",
        "Failed to grant temporary access"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      await ApiClient.patch(`/users/${studentId}/status`, {
        status: student?.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      await fetchStudentDetails();
      setDeactivateDialog(false);
    } catch (error) {
      handleApiError(error, "StudentDetailPage", "Failed to change status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-medium">Student not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const profile = student.studentProfile;

  const getRiskBadge = (level: "low" | "medium" | "high") => {
    const config = {
      low: {
        color:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        label: "Low Risk",
      },
      medium: {
        color:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        label: "Medium Risk",
      },
      high: {
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        label: "High Risk",
      },
    };
    return (
      <Badge className={config[level].color}>
        <AlertCircle className="h-3 w-3 mr-1" />
        {config[level].label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {student.firstName?.[0]}
              {student.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">
              {student.firstName} {student.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground">{student.email}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(student.email, "Email")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy Email</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Last active: {overallStats.lastActiveAgo}</span>
              <span>•</span>
              <span>Member for {overallStats.accountAge} days</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Badge
              variant={student.status === "ACTIVE" ? "default" : "destructive"}
              className="text-sm"
            >
              {student.status === "ACTIVE" ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : (
                <XCircle className="h-3 w-3 mr-1" />
              )}
              {student.status}
            </Badge>
            {profile &&
              (profile.isInternal ? (
                <Badge variant="secondary">Internal Student</Badge>
              ) : (
                <Badge variant="outline">External Student</Badge>
              ))}
            {getRiskBadge(overallStats.riskLevel)}
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    <RefreshCw
                      className={cn("h-4 w-4", refreshing && "animate-spin")}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh Data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Enrollments</p>
                <p className="text-2xl font-bold">
                  {overallStats.activeEnrollments}/
                  {overallStats.totalEnrollments}
                </p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Score</p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    overallStats.averageScore >= 75
                      ? "text-green-600"
                      : overallStats.averageScore >= 50
                        ? "text-yellow-600"
                        : "text-red-600"
                  )}
                >
                  {overallStats.averageScore.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {overallStats.completedExams} exams
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Attendance</p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    overallStats.attendanceRate >= 75
                      ? "text-green-600"
                      : overallStats.attendanceRate >= 50
                        ? "text-yellow-600"
                        : "text-red-600"
                  )}
                >
                  {overallStats.attendanceRate.toFixed(0)}%
                </p>
                <Progress
                  value={overallStats.attendanceRate}
                  className="h-1 mt-1"
                />
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Wallet</p>
                <p className="text-2xl font-bold text-primary">
                  Rs. {(student.wallet?.balance || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Balance</p>
              </div>
              <Wallet className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    overallStats.pendingPayments > 0
                      ? "text-orange-600"
                      : "text-green-600"
                  )}
                >
                  {overallStats.pendingPayments}
                </p>
                <p className="text-xs text-muted-foreground">Payments</p>
              </div>
              <Receipt className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Verification</p>
                <div className="flex gap-1 mt-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        {profile && profile.faceVerified ? (
                          <Fingerprint className="h-5 w-5 text-green-600" />
                        ) : (
                          <Fingerprint className="h-5 w-5 text-gray-300" />
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        Face{" "}
                        {profile && profile.faceVerified ? "Verified" : "Not Verified"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Mail
                          className={cn(
                            "h-5 w-5",
                            "text-gray-300" // Add emailVerified check when available
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent>Email Status</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Phone
                          className={cn(
                            "h-5 w-5",
                            student.phoneNumber
                              ? "text-green-600"
                              : "text-gray-300"
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        Phone{" "}
                        {student.phoneNumber ? "Provided" : "Not Provided"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <Shield className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setEditProfileDialog(true)}
              variant="outline"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button
              onClick={() => setChangeGradeDialog(true)}
              variant="outline"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Change Grade/Medium
            </Button>
            <Button
              onClick={() => setEnrollClassDialog(true)}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Enroll to Class
            </Button>
            <Button
              onClick={() => setAdjustWalletDialog(true)}
              variant="outline"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Adjust Wallet
            </Button>
            <Button
              onClick={() => setGrantAccessDialog(true)}
              variant="outline"
            >
              <Clock className="h-4 w-4 mr-2" />
              Grant Temporary Access
            </Button>
            <Button
              onClick={() => setDeactivateDialog(true)}
              variant={student.status === "ACTIVE" ? "destructive" : "default"}
            >
              {student.status === "ACTIVE" ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Activate
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payments">Payments & Wallet</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Name:</span>
                  <span>
                    {student.firstName} {student.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{student.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Phone:</span>
                  <span>{student.phoneNumber || "Not provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Date of Birth:</span>
                  <span>
                    {profile && profile.dateOfBirth
                      ? safeFormatDate(profile.dateOfBirth, "PPP")
                      : "Not provided"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Address:</span>
                  <span>{profile && profile.address ? profile.address : "Not provided"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Grade:</span>
                  <span>
                    {profile && profile.grade
                      ? typeof profile.grade === "object"
                        ? profile.grade.name || `Grade ${profile.grade.level}`
                        : `Grade ${profile.grade}`
                      : "Not set"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Medium:</span>
                  <span>
                    {profile && profile.medium
                      ? typeof profile.medium === "object"
                        ? profile.medium.name
                        : profile.medium
                      : "Not set"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">School:</span>
                  <span>{profile && profile.schoolName ? profile.schoolName : "Not provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Face Verification:</span>
                  {profile && profile.faceVerified ? (
                    <Badge variant="default">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Last Login:</span>
                  <span>
                    {student.lastLoginAt
                      ? safeFormatDate(student.lastLoginAt, "PPp")
                      : "Never"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Guardian Information */}
            <Card>
              <CardHeader>
                <CardTitle>Guardian Information</CardTitle>
                <CardDescription className="text-xs text-amber-600">
                  ⚠️ Visible only to admins
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Name:</span>
                  <span>{profile && profile.guardianName ? profile.guardianName : "Not provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Phone:</span>
                  <span>{profile && profile.guardianPhone ? profile.guardianPhone : "Not provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Relationship:</span>
                  <span>{profile && profile.guardianRelationship ? profile.guardianRelationship : "Not provided"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Summary */}
            {student.wallet && (
              <Card>
                <CardHeader>
                  <CardTitle>Wallet Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Current Balance:</span>
                    <span className="text-2xl font-bold text-primary">
                      Rs. {student.wallet.balance.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Credits:</span>
                    <span className="text-green-600">
                      Rs. {student.wallet.totalCredits.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Debits:</span>
                    <span className="text-red-600">
                      Rs. {student.wallet.totalDebits.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Minimum Balance:</span>
                    <span>Rs. {student.wallet.minimumBalance.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Enrollment Tab */}
        <TabsContent value="enrollment" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Enrolled Classes</CardTitle>
                  <CardDescription>
                    {student.enrollments?.length || 0} active enrollments
                  </CardDescription>
                </div>
                <Button onClick={() => setEnrollClassDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Enroll to Class
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Enrolled Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {student.enrollments && student.enrollments.length > 0 ? (
                    student.enrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">
                          {enrollment.class?.name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {enrollment.class?.subject?.name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {enrollment.class?.teacher?.firstName || ""}{" "}
                          {enrollment.class?.teacher?.lastName || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              enrollment.status === "ACTIVE"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {enrollment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {enrollment.payments &&
                          enrollment.payments.length > 0 ? (
                            <Badge
                              variant={
                                enrollment.payments[0].status === "COMPLETED"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {enrollment.payments[0].status}
                            </Badge>
                          ) : (
                            <Badge variant="outline">No payment</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {safeFormatDate(enrollment.enrolledAt, "PP")}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground"
                      >
                        No enrollments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Exam Attempts */}
          <Card>
            <CardHeader>
              <CardTitle>Exam Attempts</CardTitle>
              <CardDescription>
                {student.examAttempts?.length || 0} exams attempted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Title</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Attempted Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {student.examAttempts && student.examAttempts.length > 0 ? (
                    student.examAttempts.map((attempt) => {
                      const percentage =
                        (attempt.score / attempt.totalMarks) * 100;
                      return (
                        <TableRow key={attempt.id}>
                          <TableCell className="font-medium">
                            {attempt.exam?.title || "Unknown"}
                          </TableCell>
                          <TableCell>
                            {attempt.exam?.class?.name || "Unknown"}
                          </TableCell>
                          <TableCell>{attempt.score}</TableCell>
                          <TableCell>{attempt.totalMarks}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                percentage >= 75
                                  ? "default"
                                  : percentage >= 50
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {percentage.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {safeFormatDate(attempt.attemptedAt, "PPp")}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground"
                      >
                        No exam attempts found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          {/* Attendance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(attendanceStats).map(([className, stats]) => (
              <Card key={className}>
                <CardHeader>
                  <CardTitle className="text-lg">{className}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Attendance Rate:</span>
                      <span className="text-2xl font-bold text-primary">
                        {stats.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Present:</span>
                      <span className="text-green-600 font-medium">
                        {stats.present}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Absent:</span>
                      <span className="text-red-600 font-medium">
                        {stats.absent}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Total Sessions:</span>
                      <span className="font-medium">{stats.total}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed Attendance Records */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>Detailed attendance history</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Session Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marked At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {student.attendance && student.attendance.length > 0 ? (
                    student.attendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.classSession?.class?.name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {safeFormatDate(
                            record.classSession.sessionDate,
                            "PP"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.status === "PRESENT"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {record.status === "PRESENT" ? (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {safeFormatDate(record.markedAt, "PPp")}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground"
                      >
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments & Wallet Tab */}
        <TabsContent value="payments" className="space-y-4">
          {/* Wallet Card */}
          {student.wallet && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Wallet Balance</CardTitle>
                    <CardDescription>Current wallet status</CardDescription>
                  </div>
                  <Button onClick={() => setAdjustWalletDialog(true)}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Adjust Wallet
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      Current Balance
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      Rs. {student.wallet.balance.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      Total Credits
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      Rs. {student.wallet.totalCredits.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      Total Debits
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      Rs. {student.wallet.totalDebits.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      Minimum Balance
                    </p>
                    <p className="text-2xl font-bold">
                      Rs. {student.wallet.minimumBalance.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Temporary Access Records */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Temporary Access Records</CardTitle>
                  <CardDescription>
                    History of granted temporary access
                  </CardDescription>
                </div>
                <Button onClick={() => setGrantAccessDialog(true)}>
                  <Clock className="h-4 w-4 mr-2" />
                  Grant Access
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Granted By</TableHead>
                    <TableHead>Granted Date</TableHead>
                    <TableHead>Expires Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {temporaryAccesses.length > 0 ? (
                    temporaryAccesses.map((access) => (
                      <TableRow key={access.id}>
                        <TableCell>{access.grantedBy}</TableCell>
                        <TableCell>
                          {safeFormatDate(access.grantedAt, "PPp")}
                        </TableCell>
                        <TableCell>
                          {safeFormatDate(access.expiresAt, "PPp")}
                        </TableCell>
                        <TableCell>{access.reason}</TableCell>
                        <TableCell>
                          <Badge
                            variant={access.isActive ? "default" : "secondary"}
                          >
                            {access.isActive ? "Active" : "Expired"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        No temporary access records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Login Attempts</CardTitle>
              <CardDescription>
                Recent login activity and security information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Device/Browser</TableHead>
                    <TableHead>Attempted At</TableHead>
                    <TableHead>Failure Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginAttempts.length > 0 ? (
                    loginAttempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell>
                          <Badge
                            variant={
                              attempt.success ? "default" : "destructive"
                            }
                          >
                            {attempt.success ? (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {attempt.success ? "Success" : "Failed"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {attempt.ipAddress}
                        </TableCell>
                        <TableCell className="text-xs">
                          {attempt.userAgent}
                        </TableCell>
                        <TableCell>
                          {safeFormatDate(attempt.attemptedAt, "PPp")}
                        </TableCell>
                        <TableCell>
                          {attempt.failureReason ? (
                            <span className="text-destructive text-xs">
                              {attempt.failureReason}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        No login attempts found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileDialog} onOpenChange={setEditProfileDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Student Profile</DialogTitle>
            <DialogDescription>Update student information</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input
                value={editForm.firstName || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, firstName: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                value={editForm.lastName || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, lastName: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Email (Read-only)</Label>
              <Input
                value={editForm.email || ""}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>
            <div className="col-span-2">
              <Label>Address</Label>
              <Textarea
                value={editForm.studentProfile?.address || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    studentProfile: {
                      ...editForm.studentProfile,
                      address: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <Label>School Name</Label>
              <Input
                value={editForm.studentProfile?.schoolName || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    studentProfile: {
                      ...editForm.studentProfile,
                      schoolName: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <Label>Guardian Name</Label>
              <Input
                value={editForm.studentProfile?.guardianName || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    studentProfile: {
                      ...editForm.studentProfile,
                      guardianName: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <Label>Guardian Phone</Label>
              <Input
                value={editForm.studentProfile?.guardianPhone || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    studentProfile: {
                      ...editForm.studentProfile,
                      guardianPhone: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div>
              <Label>Guardian Relationship</Label>
              <Input
                value={editForm.studentProfile?.guardianRelationship || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    studentProfile: {
                      ...editForm.studentProfile,
                      guardianRelationship: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditProfileDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Grade/Medium Dialog */}
      <Dialog open={changeGradeDialog} onOpenChange={setChangeGradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Grade & Medium</DialogTitle>
            <DialogDescription>
              Update student's academic level
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Grade</Label>
              <Select value={newGrade} onValueChange={setNewGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.length === 0 ? (
                    <SelectItem value="NONE">No grades</SelectItem>
                  ) : (
                    grades
                      .filter((g) => g.level)
                      .map((g) => (
                        <SelectItem key={g.id} value={String(g.level)}>
                          {g.name}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Medium</Label>
              <Select value={newMedium} onValueChange={setNewMedium}>
                <SelectTrigger>
                  <SelectValue placeholder="Select medium" />
                </SelectTrigger>
                <SelectContent>
                  {mediums.filter((m) => m.name).length === 0 ? (
                    <SelectItem value="NONE">No mediums</SelectItem>
                  ) : (
                    mediums
                      .filter((m) => m.name)
                      .map((m) => (
                        <SelectItem key={m.id} value={m.name}>
                          {m.name}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangeGradeDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleChangeGrade}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Wallet Dialog */}
      <Dialog open={adjustWalletDialog} onOpenChange={setAdjustWalletDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Wallet</DialogTitle>
            <DialogDescription>
              Add or deduct amount from student's wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Transaction Type</Label>
              <Select
                value={walletType}
                onValueChange={(value: "CREDIT" | "DEBIT") =>
                  setWalletType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDIT">Credit (Add Money)</SelectItem>
                  <SelectItem value="DEBIT">Debit (Deduct Money)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount (Rs.)</Label>
              <Input
                type="number"
                step="0.01"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea
                value={walletReason}
                onChange={(e) => setWalletReason(e.target.value)}
                placeholder="Enter reason for adjustment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdjustWalletDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAdjustWallet}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant Temporary Access Dialog */}
      <Dialog open={grantAccessDialog} onOpenChange={setGrantAccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Grant Temporary Access
            </DialogTitle>
            <DialogDescription>
              Provide temporary access to specific resources for a specified
              period
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Access Type</Label>
              <Select value={accessType} onValueChange={setAccessType}>
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
                  <SelectItem value="FULL">Full Platform Access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (Days)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={accessDays}
                onChange={(e) => setAccessDays(e.target.value)}
                placeholder="7"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Access will expire on{" "}
                {safeFormatDate(
                  new Date(
                    Date.now() +
                      parseInt(accessDays || "7") * 24 * 60 * 60 * 1000
                  ),
                  "PPP"
                )}
              </p>
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea
                value={accessReason}
                onChange={(e) => setAccessReason(e.target.value)}
                placeholder="Enter reason for granting temporary access (e.g., Payment pending, Make-up class, etc.)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGrantAccessDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleGrantAccess} disabled={actionLoading}>
              {actionLoading && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Grant Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate/Activate Dialog */}
      <Dialog open={deactivateDialog} onOpenChange={setDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {student.status === "ACTIVE" ? "Deactivate" : "Activate"} Student
            </DialogTitle>
            <DialogDescription>
              {student.status === "ACTIVE"
                ? "This will deactivate the student account. They will not be able to login."
                : "This will reactivate the student account. They will be able to login again."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeactivateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant={student.status === "ACTIVE" ? "destructive" : "default"}
              onClick={handleDeactivate}
            >
              {student.status === "ACTIVE" ? "Deactivate" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
