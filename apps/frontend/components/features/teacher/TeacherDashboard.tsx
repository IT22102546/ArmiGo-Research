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
import {
  Calendar,
  Clock,
  Users,
  FileText,
  Bell,
  Plus,
  Play,
  Upload,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { classesApi } from "@/lib/api/endpoints/classes";
import { examsApi } from "@/lib/api/endpoints/exams";
import { notificationsApi } from "@/lib/api/endpoints/notifications";
import { handleApiError } from "@/lib/error-handling";
import { format } from "date-fns";

const safeFormatDate = (value?: string | Date | null, fmt = "PPp") => {
  if (!value) return "-";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (!d || isNaN(d.getTime())) return "-";
    return format(d, fmt);
  } catch {
    return "-";
  }
};

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}

interface TodaySession {
  id: string;
  name: string;
  subject?: { name: string };
  grade?: { name: string };
  startTime?: string;
  status: string;
}

interface UpcomingAssessment {
  id: string;
  title: string;
  startTime: string;
  status: string;
  approvalStatus?: string;
}

interface RecentNotification {
  id: string;
  title: string;
  message: string;
  type?: string;
  createdAt: string;
  isRead?: boolean;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Data states
  const [todaySessions, setTodaySessions] = useState<TodaySession[]>([]);
  const [upcomingAssessments, setUpcomingAssessments] = useState<
    UpcomingAssessment[]
  >([]);
  const [recentNotifications, setRecentNotifications] = useState<
    RecentNotification[]
  >([]);
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch today's therapy sessions
      const todaySessionsResponse = await classesApi.getTodaysClasses();
      const therapistSessions = todaySessionsResponse.teacherClasses || [];
      setTodaySessions(therapistSessions);

      // Fetch upcoming patient assessments (next 7 days)
      const assessmentsResponse = await examsApi.getTeacherExams();
      const allAssessments = assessmentsResponse.data || assessmentsResponse;
      const upcoming = Array.isArray(allAssessments)
        ? allAssessments
            .filter((assessment: UpcomingAssessment) => {
              const startTime = new Date(assessment.startTime);
              const now = new Date();
              const sevenDaysFromNow = new Date();
              sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
              return startTime >= now && startTime <= sevenDaysFromNow;
            })
            .sort(
              (a: UpcomingAssessment, b: UpcomingAssessment) =>
                new Date(a.startTime).getTime() -
                new Date(b.startTime).getTime()
            )
            .slice(0, 5)
        : [];
      setUpcomingAssessments(upcoming);

      // Fetch recent notifications
      const notificationsResponse = await notificationsApi.getAll();
      const notifications = notificationsResponse.notifications || [];
      setRecentNotifications(Array.isArray(notifications) ? notifications : []);

      // Calculate quick stats
      const stats: QuickStat[] = [
        {
          label: "Today's Sessions",
          value: therapistSessions.length,
          icon: <Calendar className="h-5 w-5" />,
          color: "text-blue-600",
        },
        {
          label: "Upcoming Assessments",
          value: upcoming.length,
          icon: <FileText className="h-5 w-5" />,
          color: "text-green-600",
        },
        {
          label: "Pending Evaluations",
          value: "-", // Will be calculated if evaluation API available
          icon: <CheckCircle className="h-5 w-5" />,
          color: "text-orange-600",
        },
        {
          label: "Patient Attendance",
          value: "-", // Will be calculated if attendance stats available
          icon: <Users className="h-5 w-5" />,
          color: "text-purple-600",
        },
      ];
      setQuickStats(stats);
    } catch (error) {
      handleApiError(error, "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleStartClass = async (classId: string) => {
    try {
      await classesApi.startClass(classId);
      router.push(`/teacher/classes/${classId}/session`);
    } catch (error) {
      handleApiError(error, "Failed to start class");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, Dr. {user?.firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's an overview of your therapy sessions and patient assessments
          today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <div className={stat.color}>{stat.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.trend && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.trend}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Therapy Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Therapy Sessions
            </CardTitle>
            <CardDescription>
              {todaySessions.length === 0
                ? "No therapy sessions scheduled for today"
                : `${todaySessions.length} session(s) scheduled`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaySessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  You have no therapy sessions scheduled for today.
                </p>
              ) : (
                todaySessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{session.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span>
                          {session.subject?.name || "General Therapy"}
                        </span>
                        <span>•</span>
                        <span>{session.grade?.name || "All Patients"}</span>
                        {session.startTime && (
                          <>
                            <span>•</span>
                            <span>
                              {safeFormatDate(session.startTime, "p")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleStartClass(session.id)}
                      className="ml-2"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Begin
                    </Button>
                  </div>
                ))
              )}
            </div>
            {todaySessions.length > 0 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push("/teacher/classes")}
              >
                View All Sessions
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Patient Assessments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upcoming Patient Assessments
            </CardTitle>
            <CardDescription>
              {upcomingAssessments.length === 0
                ? "No assessments in the next 7 days"
                : `${upcomingAssessments.length} assessment(s) coming up`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAssessments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No patient assessments scheduled in the next 7 days.
                </p>
              ) : (
                upcomingAssessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(`/teacher/exams/${assessment.id}`)
                    }
                  >
                    <div className="flex-1">
                      <p className="font-medium">{assessment.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{safeFormatDate(assessment.startTime)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={
                          assessment.status === "ACTIVE"
                            ? "default"
                            : assessment.status === "COMPLETED"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {assessment.status}
                      </Badge>
                      {assessment.approvalStatus && (
                        <Badge
                          variant={
                            assessment.approvalStatus === "APPROVED"
                              ? "default"
                              : assessment.approvalStatus === "PENDING_APPROVAL"
                                ? "outline"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {assessment.approvalStatus}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {upcomingAssessments.length > 0 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push("/teacher/exams")}
              >
                View All Assessments
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Notifications */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common medical tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center justify-center p-4 gap-2"
                onClick={() => router.push("/teacher/classes/create")}
              >
                <Plus className="h-6 w-6" />
                <span className="text-sm">Schedule Session</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex flex-col items-center justify-center p-4 gap-2"
                onClick={() => router.push("/teacher/materials")}
              >
                <Upload className="h-6 w-6" />
                <span className="text-sm">Upload Resources</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center justify-center p-4 gap-2"
                onClick={() => router.push("/teacher/marking")}
              >
                <CheckCircle className="h-6 w-6" />
                <span className="text-sm">Review Evaluations</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Notifications
            </CardTitle>
            <CardDescription>
              {recentNotifications.length} unread notification(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentNotifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent notifications
                </p>
              ) : (
                recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                      !notification.isRead ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {safeFormatDate(notification.createdAt, "PPp")}
                    </p>
                  </div>
                ))
              )}
            </div>
            {recentNotifications.length > 0 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push("/teacher/notifications")}
              >
                View All Notifications
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
