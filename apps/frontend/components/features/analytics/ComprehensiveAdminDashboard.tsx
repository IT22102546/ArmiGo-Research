"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Users,
  Activity,
  Loader2,
  RefreshCw,
  Calendar,
  GraduationCap,
  Video,
  CheckCircle,
  ClipboardCheck,
  Plus,
  Bell,
  UserPlus,
  Megaphone,
  CalendarPlus,
  CreditCard,
  UserX,
  Trash2,
  AlertCircle,
  PlayCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface DashboardData {
  stats?: {
    students?: {
      total: number;
      internal: number;
      external: number;
    };
    teachers?: {
      total: number;
      internal: number;
      external: number;
    };
    classes?: {
      activeNow: number;
      totalToday: number;
    };
    exams?: {
      today: number;
      next7Days: number;
      pendingApprovals: number;
    };
    payments?: {
      pendingPayments: number;
      pendingSlipVerifications: number;
      totalPending: number;
    };
    chat?: {
      pendingMessages: number;
      pendingApprovals: number;
    };
    transfers?: {
      pendingRequests: number;
    };
  };
  todayTimeline?: {
    classes?: Array<{
      id: string;
      time: string;
      grade: string;
      subject: string;
      teacherName: string;
      status: "upcoming" | "live" | "completed";
      studentsEnrolled: number;
    }>;
    exams?: Array<{
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
  alerts?: {
    expiringAccess?: Array<{
      id: string;
      studentName: string;
      expiryDate: string;
      daysRemaining: number;
    }>;
    scheduledDeletions?: Array<{
      id: string;
      recordingTitle: string;
      scheduledDate: string;
      daysRemaining: number;
    }>;
    systemWarnings?: Array<{
      type: "sms" | "email" | "storage" | "other";
      message: string;
      severity: "low" | "medium" | "high";
      balance?: number;
    }>;
  };
}

// Dummy data for hospital dashboard (no API calls)
const dummyData: DashboardData = {
  stats: {
    students: { total: 128, internal: 72, external: 56 },
    teachers: { total: 34, internal: 24, external: 10 },
    classes: { activeNow: 4, totalToday: 18 },
    exams: { today: 6, next7Days: 14, pendingApprovals: 3 },
    payments: {
      pendingPayments: 9,
      pendingSlipVerifications: 2,
      totalPending: 11,
    },
    chat: { pendingMessages: 5, pendingApprovals: 2 },
    transfers: { pendingRequests: 2 },
  },
  todayTimeline: {
    classes: [
      {
        id: "sess-1",
        time: "09:00",
        grade: "Ward A",
        subject: "Physiotherapy",
        teacherName: "Dr. Silva",
        status: "live",
        studentsEnrolled: 8,
      },
      {
        id: "sess-2",
        time: "11:30",
        grade: "Ward B",
        subject: "Neuro Assessment",
        teacherName: "Dr. Fernando",
        status: "upcoming",
        studentsEnrolled: 6,
      },
      {
        id: "sess-3",
        time: "14:00",
        grade: "Ward C",
        subject: "Occupational Therapy",
        teacherName: "Dr. Perera",
        status: "upcoming",
        studentsEnrolled: 5,
      },
    ],
    exams: [
      {
        id: "assess-1",
        title: "Morning Vitals",
        time: "08:30",
        grade: "Ward A",
        subject: "Vitals",
        status: "live",
        registeredStudents: 8,
        activeStudents: 7,
      },
      {
        id: "assess-2",
        title: "Neurological Check",
        time: "13:00",
        grade: "Ward B",
        subject: "Neuro",
        status: "not-started",
        registeredStudents: 6,
      },
      {
        id: "assess-3",
        title: "Mobility Evaluation",
        time: "16:00",
        grade: "Ward C",
        subject: "Mobility",
        status: "not-started",
        registeredStudents: 5,
      },
    ],
  },
  alerts: {
    expiringAccess: [
      {
        id: "pat-1",
        studentName: "Patient Ranasinghe",
        expiryDate: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
        daysRemaining: 2,
      },
    ],
    scheduledDeletions: [
      {
        id: "rec-1",
        recordingTitle: "Session Recording - 09:00",
        scheduledDate: new Date(
          Date.now() + 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
        daysRemaining: 5,
      },
    ],
    systemWarnings: [
      {
        type: "storage",
        message: "Storage nearing 80% capacity",
        severity: "medium",
        balance: 120,
      },
    ],
  },
};

export default function ComprehensiveAdminDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const t = useTranslations("admin.dashboard");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Populate dashboard with dummy data immediately
    setData(dummyData);
    setLoading(false);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setData(dummyData);
    setRefreshing(false);
    toast.success("Dashboard refreshed (sample data)");
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">{t("loading")}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-muted-foreground">{t("failedToLoad")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">{t("title")}</h2>
            <p className="text-blue-100">{t("subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="secondary"
              size="sm"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">{t("refresh")}</span>
            </Button>
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium">
              {user?.role === "SUPER_ADMIN" ? t("superAdmin") : t("admin")}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="space-y-6">
        {/* Stats Cards - Main Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Patients */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Total Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.stats?.students?.total || 0}
              </div>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>Inpatient: {data.stats?.students?.internal || 0}</span>
                <span>Outpatient: {data.stats?.students?.external || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Doctors */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-purple-600" />
                Total Doctors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.stats?.teachers?.total || 0}
              </div>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>Internal: {data.stats?.teachers?.internal || 0}</span>
                <span>External: {data.stats?.teachers?.external || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions Now */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-600 animate-pulse" />
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data.stats?.classes?.activeNow || 0}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Today Total: {data.stats?.classes?.totalToday || 0}
              </div>
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-red-600" />
                {t("stats.pendingPayments")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {data.stats?.payments?.pendingPayments || 0}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {t("stats.slipVerifications")}:{" "}
                {data.stats?.payments?.pendingSlipVerifications || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Today's Sessions */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Patient Sessions
                </h3>
                <div className="space-y-2">
                  {data.todayTimeline?.classes &&
                  data.todayTimeline.classes.length > 0 ? (
                    data.todayTimeline.classes.map((cls) => (
                      <div
                        key={cls.id}
                        className={`p-4 rounded-lg border flex items-center justify-between ${
                          cls.status === "live"
                            ? "bg-green-50 border-green-200"
                            : cls.status === "completed"
                              ? "bg-gray-50 border-gray-200"
                              : "bg-blue-50 border-blue-200"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[80px]">
                            <div className="text-sm font-medium">
                              {cls.time}
                            </div>
                          </div>
                          <div className="h-8 w-px bg-gray-300" />
                          <div>
                            <div className="font-medium">{cls.subject}</div>
                            <div className="text-sm text-muted-foreground">
                              {"Doctor"}: {cls.teacherName}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {cls.studentsEnrolled} {t("timeline.students")}
                          </span>
                          <Badge
                            variant={
                              cls.status === "live"
                                ? "destructive"
                                : cls.status === "completed"
                                  ? "secondary"
                                  : "default"
                            }
                            className={
                              cls.status === "live" ? "animate-pulse" : ""
                            }
                          >
                            {cls.status === "live" && (
                              <PlayCircle className="h-3 w-3 mr-1" />
                            )}
                            {cls.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">
                      No sessions scheduled for today
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Today's Assessments */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Patient Assessments
                </h3>
                <div className="space-y-2">
                  {data.todayTimeline?.exams &&
                  data.todayTimeline.exams.length > 0 ? (
                    data.todayTimeline.exams.map((exam) => (
                      <div
                        key={exam.id}
                        className={`p-4 rounded-lg border flex items-center justify-between ${
                          exam.status === "live"
                            ? "bg-purple-50 border-purple-200"
                            : exam.status === "completed"
                              ? "bg-gray-50 border-gray-200"
                              : "bg-orange-50 border-orange-200"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[80px]">
                            <div className="text-sm font-medium">
                              {exam.time}
                            </div>
                          </div>
                          <div className="h-8 w-px bg-gray-300" />
                          <div>
                            <div className="font-medium">{exam.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {exam.grade} - {exam.subject}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {exam.status === "live"
                              ? `${exam.activeStudents}/${exam.registeredStudents} ${t("timeline.active")}`
                              : `${exam.registeredStudents} ${t("timeline.registered")}`}
                          </span>
                          <Badge
                            variant={
                              exam.status === "live"
                                ? "destructive"
                                : exam.status === "completed"
                                  ? "secondary"
                                  : "default"
                            }
                            className={
                              exam.status === "live" ? "animate-pulse" : ""
                            }
                          >
                            {exam.status === "live" && (
                              <PlayCircle className="h-3 w-3 mr-1" />
                            )}
                            {exam.status === "not-started"
                              ? "NOT STARTED"
                              : exam.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">
                      No assessments scheduled for today
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Bell className="h-5 w-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Expiring Access */}
              {data.alerts?.expiringAccess &&
                data.alerts.expiringAccess.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                      <UserX className="h-4 w-4 text-red-600" />
                      Patient Access Expiring Soon
                    </h3>
                    <div className="space-y-2">
                      {data.alerts.expiringAccess.map((student) => (
                        <div
                          key={student.id}
                          className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {student.studentName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t("alerts.expires")}:{" "}
                              {new Date(
                                student.expiryDate
                              ).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge variant="destructive">
                            {student.daysRemaining}{" "}
                            {student.daysRemaining === 1
                              ? t("alerts.dayLeft")
                              : t("alerts.daysLeft")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Scheduled Deletions */}
              {data.alerts?.scheduledDeletions &&
                data.alerts.scheduledDeletions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                      <Trash2 className="h-4 w-4 text-orange-600" />
                      Scheduled Record Deletions
                    </h3>
                    <div className="space-y-2">
                      {data.alerts.scheduledDeletions.map((recording) => (
                        <div
                          key={recording.id}
                          className="p-3 bg-orange-50 rounded-lg border border-orange-200 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {recording.recordingTitle}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t("alerts.scheduled")}:{" "}
                              {new Date(
                                recording.scheduledDate
                              ).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {recording.daysRemaining}{" "}
                            {recording.daysRemaining === 1
                              ? t("alerts.day")
                              : t("alerts.days")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* System Warnings */}
              {data.alerts?.systemWarnings &&
                data.alerts.systemWarnings.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      System Warnings
                    </h3>
                    <div className="space-y-2">
                      {data.alerts.systemWarnings.map((warning, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border flex items-start gap-3 ${
                            warning.severity === "high"
                              ? "bg-red-50 border-red-200"
                              : warning.severity === "medium"
                                ? "bg-yellow-50 border-yellow-200"
                                : "bg-blue-50 border-blue-200"
                          }`}
                        >
                          <AlertTriangle
                            className={`h-4 w-4 mt-0.5 ${
                              warning.severity === "high"
                                ? "text-red-600"
                                : warning.severity === "medium"
                                  ? "text-yellow-600"
                                  : "text-blue-600"
                            }`}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm capitalize">
                              {warning.type} {t("alerts.service")}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {warning.message}
                            </div>
                            {warning.balance !== undefined && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {t("alerts.currentBalance")}: ${warning.balance}
                              </div>
                            )}
                          </div>
                          <Badge
                            variant={
                              warning.severity === "high"
                                ? "destructive"
                                : warning.severity === "medium"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {warning.severity.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {!data.alerts?.expiringAccess?.length &&
                !data.alerts?.scheduledDeletions?.length &&
                !data.alerts?.systemWarnings?.length && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p>All systems normal</p>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Button
                onClick={() => handleQuickAction("create-student")}
                variant="outline"
                className="h-24 flex-col gap-2"
              >
                <UserPlus className="h-6 w-6 text-blue-600" />
                <span className="text-sm">Add Patient</span>
              </Button>

              <Button
                onClick={() => handleQuickAction("create-teacher")}
                variant="outline"
                className="h-24 flex-col gap-2"
              >
                <GraduationCap className="h-6 w-6 text-purple-600" />
                <span className="text-sm">Add Doctor</span>
              </Button>

              <Button
                onClick={() => handleQuickAction("create-timetable")}
                variant="outline"
                className="h-24 flex-col gap-2"
              >
                <CalendarPlus className="h-6 w-6 text-green-600" />
                <span className="text-sm">Schedule Session</span>
              </Button>

              <Button
                onClick={() => handleQuickAction("create-exam")}
                variant="outline"
                className="h-24 flex-col gap-2"
              >
                <ClipboardCheck className="h-6 w-6 text-orange-600" />
                <span className="text-sm">New Assessment</span>
              </Button>

              <Button
                onClick={() => handleQuickAction("create-announcement")}
                variant="outline"
                className="h-24 flex-col gap-2"
              >
                <Megaphone className="h-6 w-6 text-red-600" />
                <span className="text-sm">Hospital Alert</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
