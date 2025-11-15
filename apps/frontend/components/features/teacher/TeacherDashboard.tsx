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
  Video,
  BookOpen,
  TrendingUp,
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

interface TodayClass {
  id: string;
  name: string;
  subject?: { name: string };
  grade?: { name: string };
  startTime?: string;
  status: string;
}

interface UpcomingExam {
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
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
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

      // Fetch today's classes
      const todayClassesResponse = await classesApi.getTodaysClasses();
      const teacherClasses = todayClassesResponse.teacherClasses || [];
      setTodayClasses(teacherClasses);

      // Fetch upcoming exams (next 7 days)
      const examsResponse = await examsApi.getTeacherExams();
      const allExams = examsResponse.data || examsResponse;
      const upcoming = Array.isArray(allExams)
        ? allExams
            .filter((exam: any) => {
              const startTime = new Date(exam.startTime);
              const now = new Date();
              const sevenDaysFromNow = new Date();
              sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
              return startTime >= now && startTime <= sevenDaysFromNow;
            })
            .sort(
              (a: any, b: any) =>
                new Date(a.startTime).getTime() -
                new Date(b.startTime).getTime()
            )
            .slice(0, 5)
        : [];
      setUpcomingExams(upcoming);

      // Fetch recent notifications
      const notificationsResponse = await notificationsApi.getAll();
      const notifications = notificationsResponse.notifications || [];
      setRecentNotifications(Array.isArray(notifications) ? notifications : []);

      // Calculate quick stats
      const stats: QuickStat[] = [
        {
          label: "Today's Classes",
          value: teacherClasses.length,
          icon: <Calendar className="h-5 w-5" />,
          color: "text-blue-600",
        },
        {
          label: "Upcoming Exams",
          value: upcoming.length,
          icon: <FileText className="h-5 w-5" />,
          color: "text-green-600",
        },
        {
          label: "Pending Marking",
          value: "-", // Will be calculated if marking API available
          icon: <CheckCircle className="h-5 w-5" />,
          color: "text-orange-600",
        },
        {
          label: "Avg Attendance",
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
        <h1 className="text-3xl font-bold">Welcome back, {user?.firstName}!</h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your classes today.
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
        {/* Today's Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Classes
            </CardTitle>
            <CardDescription>
              {todayClasses.length === 0
                ? "No classes scheduled for today"
                : `${todayClasses.length} class(es) scheduled`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayClasses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  You have no classes scheduled for today.
                </p>
              ) : (
                todayClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{cls.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span>{cls.subject?.name}</span>
                        <span>•</span>
                        <span>{cls.grade?.name}</span>
                        {cls.startTime && (
                          <>
                            <span>•</span>
                            <span>{safeFormatDate(cls.startTime, "p")}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleStartClass(cls.id)}
                      className="ml-2"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  </div>
                ))
              )}
            </div>
            {todayClasses.length > 0 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push("/teacher/classes")}
              >
                View All Classes
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Exams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upcoming Exams
            </CardTitle>
            <CardDescription>
              {upcomingExams.length === 0
                ? "No exams in the next 7 days"
                : `${upcomingExams.length} exam(s) coming up`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingExams.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No exams scheduled in the next 7 days.
                </p>
              ) : (
                upcomingExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/teacher/exams/${exam.id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{exam.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{safeFormatDate(exam.startTime)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={
                          exam.status === "ACTIVE"
                            ? "default"
                            : exam.status === "COMPLETED"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {exam.status}
                      </Badge>
                      {exam.approvalStatus && (
                        <Badge
                          variant={
                            exam.approvalStatus === "APPROVED"
                              ? "default"
                              : exam.approvalStatus === "PENDING_APPROVAL"
                                ? "outline"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {exam.approvalStatus}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {upcomingExams.length > 0 && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push("/teacher/exams")}
              >
                View All Exams
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
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center justify-center p-4 gap-2"
                onClick={() => router.push("/teacher/classes/create")}
              >
                <Plus className="h-6 w-6" />
                <span className="text-sm">Create Class</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center justify-center p-4 gap-2"
                onClick={() => router.push("/teacher/exams/create")}
              >
                <FileText className="h-6 w-6" />
                <span className="text-sm">Create Exam</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center justify-center p-4 gap-2"
                onClick={() => router.push("/teacher/materials")}
              >
                <Upload className="h-6 w-6" />
                <span className="text-sm">Upload Material</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center justify-center p-4 gap-2"
                onClick={() => router.push("/teacher/marking")}
              >
                <CheckCircle className="h-6 w-6" />
                <span className="text-sm">Mark Exams</span>
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
