"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  BookOpen,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  DollarSign,
  UserCheck,
  Clock,
  Loader2,
  MessageSquare,
  RefreshCw,
  Calendar,
  FileText,
  GraduationCap,
  Video,
  CheckCircle,
  XCircle,
  ClipboardCheck,
  Plus,
  Bell,
  PlayCircle,
  UserPlus,
  BookCheck,
  Megaphone,
  CalendarPlus,
  FileCheck,
  CreditCard,
  UserX,
  Timer,
  Trash2,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";
import { getDisplayName } from "@/lib/utils/display";
import { toast } from "sonner";
import {
  LineChart,
  BarChart,
  DoughnutChart,
  TrendComparisonCard,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface EnhancedDashboardData {
  // Stats Cards Data
  stats: {
    students: {
      total: number;
      internal: number;
      external: number;
    };
    teachers: {
      total: number;
      internal: number;
      external: number;
    };
    classes: {
      activeNow: number;
      totalToday: number;
    };
    exams: {
      today: number;
      next7Days: number;
      pendingApprovals: number;
    };
    payments: {
      pendingPayments: number;
      pendingSlipVerifications: number;
      totalPending: number;
    };
    chat: {
      pendingMessages: number;
      pendingApprovals: number;
    };
    transfers: {
      pendingRequests: number;
    };
  };

  // Today's Timeline
  todayTimeline: {
    classes: Array<{
      id: string;
      time: string;
      grade: string;
      subject: string;
      teacherName: string;
      status: "upcoming" | "live" | "completed";
      studentsEnrolled: number;
    }>;
    exams: Array<{
      id: string;
      title: string;
      time: string;
      grade: string;
      subject: string;
      status: "not-started" | "live" | "completed";
      registeredStudents: number;
      activeStudents?: number;
    }>;
  };

  // Alerts Panel
  alerts: {
    expiringAccess: Array<{
      id: string;
      studentName: string;
      expiryDate: string;
      daysRemaining: number;
    }>;
    scheduledDeletions: Array<{
      id: string;
      recordingTitle: string;
      scheduledDate: string;
      daysRemaining: number;
    }>;
    systemWarnings: Array<{
      type: "sms" | "email" | "storage" | "other";
      message: string;
      severity: "low" | "medium" | "high";
      balance?: number;
    }>;
  };

  // Additional data for existing components
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalTeachers: number;
    totalStudents: number;
    totalClasses: number;
    activeClasses: number;
    totalEnrollments: number;
    totalRevenue: number;
  };
  recentActivity: {
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    newClassesToday: number;
    newClassesThisWeek: number;
    newClassesThisMonth: number;
    enrollmentsToday: number;
    enrollmentsThisWeek: number;
    enrollmentsThisMonth: number;
  };
  quickStats: {
    averageClassSize: number;
    averageAttendanceRate: number;
    activeVideoSessions: number;
    pendingPayments: number;
    lowAttendanceAlerts: number;
  };
  trends: {
    userGrowth: TrendData;
    enrollmentGrowth: TrendData;
    revenueGrowth: TrendData;
    attendanceChange: TrendData;
  };
  enrollmentHistory: {
    month: string;
    enrollments: number;
    activeClasses: number;
  }[];
  studentTypeDistribution: {
    internal: number;
    external: number;
  };
  topPerformingGrades: {
    grade: string;
    metric: string;
    value: number;
  }[];
  teacherUtilization: {
    teacherId: string;
    teacherName: string;
    activeClasses: number;
    totalStudents: number;
    utilizationRate: number;
  }[];
  realTimeMetrics: {
    activeClassesNow: number;
    studentsOnlineNow: number;
    liveVideoSessions: number;
    examsInProgress: number;
    pendingTransactions: number;
  };
  payments: {
    totalRevenue: number;
    pendingPayments: number;
    completedToday: number;
    failedPayments: number;
    recentPayments: Array<{
      id: string;
      studentName: string;
      amount: number;
      status: string;
      date: string;
    }>;
  };
  upcomingSessions: Array<{
    id: string;
    className: string;
    teacherName: string;
    startTime: string;
    duration: number;
    studentsEnrolled: number;
  }>;
  chatApprovals: {
    pending: number;
    approved: number;
    rejected: number;
    recentRequests: Array<{
      id: string;
      userName: string;
      reason: string;
      requestedAt: string;
    }>;
  };
  transferApprovals: {
    pending: number;
    approved: number;
    rejected: number;
    pendingTransfers: Array<{
      id: string;
      teacherName: string;
      fromZone: string;
      toZone: string;
      requestedAt: string;
      status: string;
    }>;
  };
  exams: {
    upcoming: Array<{
      id: string;
      title: string;
      grade: string;
      subject: string;
      scheduledAt: string;
      registeredStudents: number;
    }>;
    ongoing: Array<{
      id: string;
      title: string;
      grade: string;
      activeStudents: number;
      startedAt: string;
      duration: number;
    }>;
    completedToday: number;
  };
  publications: {
    total: number;
    publishedThisMonth: number;
    totalDownloads: number;
    revenue: number;
    topPublications: Array<{
      id: string;
      title: string;
      author: string;
      downloads: number;
      revenue: number;
    }>;
  };
  seminars: {
    upcoming: number;
    ongoing: number;
    completedThisMonth: number;
    upcomingList: Array<{
      id: string;
      title: string;
      speaker: string;
      scheduledAt: string;
      registrations: number;
    }>;
  };
}

interface TrendData {
  metric?: string;
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  trend: "up" | "down" | "stable";
  isPositive: boolean;
}

interface AlertData {
  type: "warning" | "critical" | "info";
  title: string;
  message: string;
  affectedCount: number;
  priority: number;
  actionRequired: string;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EnhancedDashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Quick action handlers
  const handleQuickAction = (action: string) => {
    switch (action) {
      case "create-student":
        router.push("/admin/users");
        break;
      case "create-teacher":
        router.push("/admin/users");
        break;
      case "create-timetable":
        router.push("/admin/timetable");
        break;
      case "create-exam":
        router.push("/admin/exam-management");
        break;
      case "create-announcement":
        router.push("/admin/announcements");
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 5 minutes for real-time data
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.get<EnhancedDashboardData>(
        "/analytics/dashboard/enhanced"
      );

      // ApiClient now automatically unwraps { success: true, data: {...} }
      setData(response);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    );
  }

  // Prepare chart data for enrollment trends (using real data from backend)
  const enrollmentChartData = {
    labels: data.enrollmentHistory?.map((h) => h.month) || [],
    datasets: [
      {
        label: "Enrollments",
        data: data.enrollmentHistory?.map((h) => h.enrollments) || [],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Teacher utilization chart data (using real data from backend)
  const teacherUtilizationData = {
    labels:
      data.teacherUtilization
        ?.slice(0, 10)
        .map((t) => t.teacherName.split(" ")[0]) || [],
    datasets: [
      {
        label: "Utilization Rate (%)",
        data:
          data.teacherUtilization?.slice(0, 10).map((t) => t.utilizationRate) ||
          [],
        backgroundColor:
          data.teacherUtilization
            ?.slice(0, 10)
            .map((t) =>
              t.utilizationRate > 85
                ? "rgba(239, 68, 68, 0.8)"
                : t.utilizationRate > 60
                  ? "rgba(34, 197, 94, 0.8)"
                  : "rgba(251, 191, 36, 0.8)"
            ) || [],
      },
    ],
  };

  // Student distribution chart (using real data from backend)
  const studentDistributionData = {
    labels: ["Internal Students", "External Students"],
    datasets: [
      {
        data: [
          data.studentTypeDistribution?.internal || 0,
          data.studentTypeDistribution?.external || 0,
        ],
        backgroundColor: ["rgba(59, 130, 246, 0.8)", "rgba(16, 185, 129, 0.8)"],
        borderColor: ["rgba(59, 130, 246, 1)", "rgba(16, 185, 129, 1)"],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
            <p className="text-blue-100">
              Real-time insights and predictive analytics for better decision
              making
            </p>
          </div>
          <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium">
            {user?.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {data?.alerts &&
        (data.alerts.expiringAccess.length > 0 ||
          data.alerts.scheduledDeletions.length > 0 ||
          data.alerts.systemWarnings.length > 0) && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                Critical Alerts Requiring Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  ...data.alerts.expiringAccess.map((a) => ({
                    type: "expiring",
                    title: "Access Expiring",
                    message: `${a.studentName} access expires in ${a.daysRemaining} days`,
                    actionRequired: "Renew access",
                    affectedCount: 1,
                  })),
                  ...data.alerts.scheduledDeletions.map((d) => ({
                    type: "deletion",
                    title: "Scheduled Deletion",
                    message: `${d.recordingTitle} scheduled for deletion in ${d.daysRemaining} days`,
                    actionRequired: "Review deletion",
                    affectedCount: 1,
                  })),
                  ...data.alerts.systemWarnings.map((w) => ({
                    type: w.severity === "high" ? "critical" : "warning",
                    title: w.type.toUpperCase() + " Warning",
                    message: w.message,
                    actionRequired: "Review system",
                    affectedCount: 1,
                  })),
                ]
                  .slice(0, 5)
                  .map((alert, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        alert.type === "critical"
                          ? "bg-red-50 border-red-200"
                          : alert.type === "warning"
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {alert.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {alert.message}
                          </p>
                          <p className="text-sm font-medium text-gray-700 mt-2">
                            Action: {alert.actionRequired}
                          </p>
                        </div>
                        <Badge
                          variant={
                            alert.type === "critical"
                              ? "destructive"
                              : alert.type === "warning"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {alert.affectedCount} affected
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Real-Time Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Real-Time Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {data?.realTimeMetrics?.activeClassesNow || 0}
              </div>
              <div className="text-xs text-gray-600 mt-1">Active Classes</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {data?.realTimeMetrics?.studentsOnlineNow || 0}
              </div>
              <div className="text-xs text-gray-600 mt-1">Students Online</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {data?.realTimeMetrics?.liveVideoSessions || 0}
              </div>
              <div className="text-xs text-gray-600 mt-1">Live Sessions</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {data?.realTimeMetrics?.examsInProgress || 0}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Exams in Progress
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {data?.realTimeMetrics?.pendingTransactions || 0}
              </div>
              <div className="text-xs text-gray-600 mt-1">Pending Payments</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TrendComparisonCard
          metric="User Growth"
          current={data?.trends?.userGrowth?.current || 0}
          previous={data?.trends?.userGrowth?.previous || 0}
          change={data?.trends?.userGrowth?.change || 0}
          changePercentage={data?.trends?.userGrowth?.changePercentage || 0}
          trend={data?.trends?.userGrowth?.trend || "stable"}
          isPositive={data?.trends?.userGrowth?.isPositive || false}
          icon={<Users className="h-5 w-5" />}
        />
        <TrendComparisonCard
          metric="Enrollment Growth"
          current={data?.trends?.enrollmentGrowth?.current || 0}
          previous={data?.trends?.enrollmentGrowth?.previous || 0}
          change={data?.trends?.enrollmentGrowth?.change || 0}
          changePercentage={
            data?.trends?.enrollmentGrowth?.changePercentage || 0
          }
          trend={data?.trends?.enrollmentGrowth?.trend || "stable"}
          isPositive={data?.trends?.enrollmentGrowth?.isPositive || false}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <TrendComparisonCard
          metric="Revenue"
          current={data?.trends?.revenueGrowth?.current || 0}
          previous={data?.trends?.revenueGrowth?.previous || 0}
          change={data?.trends?.revenueGrowth?.change || 0}
          changePercentage={data?.trends?.revenueGrowth?.changePercentage || 0}
          trend={data?.trends?.revenueGrowth?.trend || "stable"}
          isPositive={data?.trends?.revenueGrowth?.isPositive || false}
          prefix="$"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <TrendComparisonCard
          metric="Attendance Rate"
          current={data?.trends?.attendanceChange?.current || 0}
          previous={data?.trends?.attendanceChange?.previous || 0}
          change={data?.trends?.attendanceChange?.change || 0}
          changePercentage={
            data?.trends?.attendanceChange?.changePercentage || 0
          }
          trend={data?.trends?.attendanceChange?.trend || "stable"}
          isPositive={data?.trends?.attendanceChange?.isPositive || false}
          suffix="%"
          icon={<UserCheck className="h-5 w-5" />}
        />
      </div>

      {/* Payment Overview */}
      {data?.payments && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Payment Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ${data.payments.totalRevenue?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Pending Payments</p>
                <p className="text-2xl font-bold text-orange-600">
                  {data.payments.pendingPayments || 0}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Completed Today</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.payments.completedToday || 0}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Failed Payments</p>
                <p className="text-2xl font-bold text-red-600">
                  {data.payments.failedPayments || 0}
                </p>
              </div>
            </div>
            {data.payments.recentPayments &&
              data.payments.recentPayments.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Recent Payments</h4>
                  <div className="space-y-2">
                    {data.payments.recentPayments.slice(0, 5).map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {payment.studentName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(payment.date).toLocaleString()}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            ${payment.amount}
                          </p>
                          <Badge
                            variant={
                              payment.status === "completed"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Sessions & Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        {data?.upcomingSessions && data.upcomingSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-blue-600" />
                Upcoming Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.upcomingSessions.slice(0, 5).map((session) => (
                  <div
                    key={session.id}
                    className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {session.className}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Teacher: {session.teacherName}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(session.startTime).toLocaleString()}
                          </span>
                          <span>{session.duration} min</span>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {session.studentsEnrolled} students
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Exams */}
        {data?.exams?.upcoming && data.exams.upcoming.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-purple-600" />
                Upcoming Exams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.exams.upcoming.slice(0, 5).map((exam) => (
                  <div
                    key={exam.id}
                    className="p-4 bg-purple-50 rounded-lg border border-purple-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {exam.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Grade {getDisplayName(exam.grade)} -{" "}
                          {getDisplayName(exam.subject)}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {new Date(exam.scheduledAt).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {exam.registeredStudents} registered
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Currently Ongoing Exams */}
      {data?.exams?.ongoing && data.exams.ongoing.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Activity className="h-5 w-5 animate-pulse" />
              Currently Ongoing Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.exams.ongoing.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 bg-card rounded-lg border border-purple-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {exam.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Grade {exam.grade}
                      </p>
                    </div>
                    <Badge variant="destructive" className="animate-pulse">
                      LIVE
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {exam.activeStudents} students active
                    </span>
                    <span className="text-gray-600">{exam.duration} min</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approvals Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat Approvals */}
        {data?.chatApprovals && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                Chat Access Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 bg-orange-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {data.chatApprovals.pending || 0}
                  </p>
                  <p className="text-xs text-gray-600">Pending</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {data.chatApprovals.approved || 0}
                  </p>
                  <p className="text-xs text-gray-600">Approved</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {data.chatApprovals.rejected || 0}
                  </p>
                  <p className="text-xs text-gray-600">Rejected</p>
                </div>
              </div>
              {data.chatApprovals.recentRequests &&
                data.chatApprovals.recentRequests.length > 0 && (
                  <div className="space-y-2">
                    {data.chatApprovals.recentRequests
                      .slice(0, 3)
                      .map((request) => (
                        <div
                          key={request.id}
                          className="p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {request.userName}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {request.reason}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {/* Teacher Transfer Approvals */}
        {data?.transferApprovals && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-teal-600" />
                Teacher Transfer Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 bg-orange-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {data.transferApprovals.pending || 0}
                  </p>
                  <p className="text-xs text-gray-600">Pending</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {data.transferApprovals.approved || 0}
                  </p>
                  <p className="text-xs text-gray-600">Approved</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {data.transferApprovals.rejected || 0}
                  </p>
                  <p className="text-xs text-gray-600">Rejected</p>
                </div>
              </div>
              {data.transferApprovals.pendingTransfers &&
                data.transferApprovals.pendingTransfers.length > 0 && (
                  <div className="space-y-2">
                    {data.transferApprovals.pendingTransfers
                      .slice(0, 3)
                      .map((transfer) => (
                        <div
                          key={transfer.id}
                          className="p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {transfer.teacherName}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {transfer.fromZone} → {transfer.toZone}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(
                                  transfer.requestedAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="secondary">{transfer.status}</Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Publications & Seminars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Publications Overview */}
        {data?.publications && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-600" />
                Publications Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">
                    Total Publications
                  </p>
                  <p className="text-2xl font-bold text-amber-600">
                    {data.publications.total || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">This Month</p>
                  <p className="text-2xl font-bold text-green-600">
                    {data.publications.publishedThisMonth || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Downloads</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {data.publications.totalDownloads || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${data.publications.revenue?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
              {data.publications.topPublications &&
                data.publications.topPublications.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">
                      Top Publications
                    </h4>
                    <div className="space-y-2">
                      {data.publications.topPublications
                        .slice(0, 3)
                        .map((pub, idx) => (
                          <div
                            key={pub.id}
                            className="p-2 bg-muted rounded-lg flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-600">
                                {idx + 1}
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {pub.title}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {pub.author}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600">
                                {pub.downloads} downloads
                              </p>
                              <p className="text-xs font-semibold text-green-600">
                                ${pub.revenue}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {/* Seminars Overview */}
        {data?.seminars && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-cyan-600" />
                Seminars & Webinars
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 bg-cyan-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-cyan-600">
                    {data.seminars.upcoming || 0}
                  </p>
                  <p className="text-xs text-gray-600">Upcoming</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {data.seminars.ongoing || 0}
                  </p>
                  <p className="text-xs text-gray-600">Ongoing</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {data.seminars.completedThisMonth || 0}
                  </p>
                  <p className="text-xs text-gray-600">Completed</p>
                </div>
              </div>
              {data.seminars.upcomingList &&
                data.seminars.upcomingList.length > 0 && (
                  <div className="space-y-2">
                    {data.seminars.upcomingList.slice(0, 4).map((seminar) => (
                      <div
                        key={seminar.id}
                        className="p-3 bg-cyan-50 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {seminar.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Speaker: {seminar.speaker}
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                              <Calendar className="h-3 w-3" />
                              {new Date(
                                seminar.scheduledAt
                              ).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {seminar.registrations} reg.
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Students Overview - Enhanced */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Students Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Students</p>
              <p className="text-2xl font-bold text-blue-600">
                {data.overview.totalStudents || 0}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Internal</p>
              <p className="text-2xl font-bold text-green-600">
                {data.studentTypeDistribution?.internal || 0}
              </p>
            </div>
            <div className="p-4 bg-teal-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">External</p>
              <p className="text-2xl font-bold text-teal-600">
                {data.studentTypeDistribution?.external || 0}
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">At-Risk</p>
              <p className="text-2xl font-bold text-orange-600">
                {data.quickStats.lowAttendanceAlerts || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
