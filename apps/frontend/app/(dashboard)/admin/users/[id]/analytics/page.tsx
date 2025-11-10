"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiClient } from "@/lib/api";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  BookOpen,
  Award,
  Users,
  Clock,
  Activity,
  Loader2,
  Download,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
}

interface AttendanceStats {
  totalClasses: number;
  attended: number;
  absent: number;
  late: number;
  attendanceRate: number;
  trend: "up" | "down" | "stable";
  recentAttendance: Array<{
    date: string;
    status: string;
    className: string;
  }>;
}

interface ExamStats {
  totalExams: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  trend: "up" | "down" | "stable";
  recentExams: Array<{
    examName: string;
    score: number;
    maxScore: number;
    date: string;
    grade: string;
  }>;
}

interface PaymentStats {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  currency: string;
  recentPayments: Array<{
    amount: number;
    description: string;
    status: string;
    date: string;
  }>;
}

interface EnrollmentHistory {
  currentEnrollments: number;
  completedCourses: number;
  enrollments: Array<{
    className: string;
    subject: string;
    enrolledDate: string;
    status: string;
    progress: number;
  }>;
}

interface ActivityHeatmap {
  [date: string]: number; // activity count per day
}

export default function UserAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const router = useRouter();
  const [timeRange, setTimeRange] = useState("30"); // days

  // Fetch user details
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const response = await ApiClient.get<User>(`/users/${userId}`);
      return response;
    },
  });

  // Fetch attendance stats (mock data - replace with actual API)
  const { data: attendanceStats } = useQuery({
    queryKey: ["user-attendance", userId, timeRange],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return {
        totalClasses: 45,
        attended: 38,
        absent: 5,
        late: 2,
        attendanceRate: 84.4,
        trend: "up",
        recentAttendance: [
          {
            date: "2025-11-25",
            status: "PRESENT",
            className: "Mathematics A/L",
          },
          { date: "2025-11-24", status: "PRESENT", className: "Physics A/L" },
          { date: "2025-11-23", status: "ABSENT", className: "Chemistry A/L" },
          {
            date: "2025-11-22",
            status: "PRESENT",
            className: "Mathematics A/L",
          },
          { date: "2025-11-21", status: "LATE", className: "Physics A/L" },
        ],
      } as AttendanceStats;
    },
  });

  // Fetch exam stats (mock data)
  const { data: examStats } = useQuery({
    queryKey: ["user-exams", userId, timeRange],
    queryFn: async () => {
      return {
        totalExams: 12,
        averageScore: 78.5,
        highestScore: 95,
        lowestScore: 62,
        passRate: 91.7,
        trend: "up",
        recentExams: [
          {
            examName: "Mathematics Paper 1",
            score: 85,
            maxScore: 100,
            date: "2025-11-20",
            grade: "A",
          },
          {
            examName: "Physics MCQ Test",
            score: 72,
            maxScore: 100,
            date: "2025-11-18",
            grade: "B",
          },
          {
            examName: "Chemistry Practical",
            score: 88,
            maxScore: 100,
            date: "2025-11-15",
            grade: "A",
          },
          {
            examName: "Mathematics Paper 2",
            score: 79,
            maxScore: 100,
            date: "2025-11-10",
            grade: "B+",
          },
        ],
      } as ExamStats;
    },
  });

  // Fetch payment stats
  const { data: paymentStats } = useQuery({
    queryKey: ["user-payments", userId, timeRange],
    queryFn: async () => {
      const response = (await ApiClient.get(
        `/payments?userId=${userId}&limit=100`
      )) as { data: any[] };
      const payments = response.data || [];

      const completed = payments.filter((p: any) => p.status === "COMPLETED");
      const pending = payments.filter((p: any) => p.status === "PENDING");
      const totalPaid = completed.reduce(
        (sum: number, p: any) => sum + p.amount,
        0
      );
      const totalPending = pending.reduce(
        (sum: number, p: any) => sum + p.amount,
        0
      );

      return {
        totalPaid,
        totalPending,
        totalOverdue: 0,
        currency: payments[0]?.currency || "USD",
        recentPayments: payments.slice(0, 5).map((p: any) => ({
          amount: p.amount,
          description: p.description || "Payment",
          status: p.status,
          date: p.createdAt,
        })),
      } as PaymentStats;
    },
  });

  // Fetch enrollment history (mock data)
  const { data: enrollmentHistory } = useQuery({
    queryKey: ["user-enrollments", userId],
    queryFn: async () => {
      return {
        currentEnrollments: 4,
        completedCourses: 2,
        enrollments: [
          {
            className: "Mathematics A/L",
            subject: "Mathematics",
            enrolledDate: "2025-01-15",
            status: "ACTIVE",
            progress: 75,
          },
          {
            className: "Physics A/L",
            subject: "Physics",
            enrolledDate: "2025-01-15",
            status: "ACTIVE",
            progress: 68,
          },
          {
            className: "Chemistry A/L",
            subject: "Chemistry",
            enrolledDate: "2025-01-15",
            status: "ACTIVE",
            progress: 82,
          },
          {
            className: "Combined Maths",
            subject: "Mathematics",
            enrolledDate: "2025-01-20",
            status: "ACTIVE",
            progress: 55,
          },
          {
            className: "Biology O/L",
            subject: "Biology",
            enrolledDate: "2024-06-01",
            status: "COMPLETED",
            progress: 100,
          },
          {
            className: "English O/L",
            subject: "English",
            enrolledDate: "2024-06-01",
            status: "COMPLETED",
            progress: 100,
          },
        ],
      } as EnrollmentHistory;
    },
  });

  // Generate activity heatmap (mock data)
  const activityHeatmap: ActivityHeatmap = {};
  for (let i = 89; i >= 0; i--) {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");
    activityHeatmap[date] = Math.floor(Math.random() * 10);
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-500";
      case "ABSENT":
        return "bg-red-500";
      case "LATE":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade === "A" || grade === "A+") return "text-green-600";
    if (grade === "B" || grade === "B+") return "text-blue-600";
    if (grade === "C" || grade === "C+") return "text-yellow-600";
    return "text-red-600";
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">User Analytics</h1>
            <p className="text-muted-foreground">
              Detailed analytics for {user?.firstName} {user?.lastName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Attendance Rate
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendanceStats?.attendanceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {attendanceStats?.trend === "up" ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+2.5% from last period</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">-1.2% from last period</span>
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {examStats?.averageScore.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {examStats?.trend === "up" ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+3.8% improvement</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">-0.5% from last period</span>
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paymentStats
                ? formatCurrency(paymentStats.totalPaid, paymentStats.currency)
                : "$0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {paymentStats?.totalPending
                ? formatCurrency(
                    paymentStats.totalPending,
                    paymentStats.currency
                  )
                : "$0.00"}{" "}
              pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {enrollmentHistory?.currentEnrollments || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {enrollmentHistory?.completedCourses || 0} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="exams">Exam Performance</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Total Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {attendanceStats?.totalClasses}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Attended</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {attendanceStats?.attended}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Absent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {attendanceStats?.absent}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
              <CardDescription>Last 5 class attendances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendanceStats?.recentAttendance.map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${getAttendanceStatusColor(record.status)}`}
                      />
                      <div>
                        <p className="font-medium">{record.className}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(record.date), "PPP")}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        record.status === "PRESENT" ? "default" : "destructive"
                      }
                    >
                      {record.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Total Exams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {examStats?.totalExams}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Highest Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {examStats?.highestScore}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Lowest Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {examStats?.lowestScore}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {examStats?.passRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Exams</CardTitle>
              <CardDescription>
                Performance in recent examinations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {examStats?.recentExams.map((exam, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{exam.examName}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(exam.date), "PPP")}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">
                          {exam.score}/{exam.maxScore}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {((exam.score / exam.maxScore) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <Badge className={getGradeColor(exam.grade)}>
                        {exam.grade}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Total Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {paymentStats
                    ? formatCurrency(
                        paymentStats.totalPaid,
                        paymentStats.currency
                      )
                    : "$0.00"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {paymentStats
                    ? formatCurrency(
                        paymentStats.totalPending,
                        paymentStats.currency
                      )
                    : "$0.00"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {paymentStats
                    ? formatCurrency(
                        paymentStats.totalOverdue,
                        paymentStats.currency
                      )
                    : "$0.00"}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Latest payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentStats?.recentPayments.map((payment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{payment.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.date), "PPP")}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold">
                        {formatCurrency(payment.amount, paymentStats.currency)}
                      </p>
                      <Badge
                        variant={
                          payment.status === "COMPLETED"
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enrollments Tab */}
        <TabsContent value="enrollments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Enrollments</CardTitle>
              <CardDescription>
                All enrolled courses and their progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {enrollmentHistory?.enrollments.map((enrollment, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{enrollment.className}</p>
                        <p className="text-sm text-muted-foreground">
                          {enrollment.subject}
                        </p>
                      </div>
                      <Badge
                        variant={
                          enrollment.status === "ACTIVE"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {enrollment.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {enrollment.progress}%
                        </span>
                      </div>
                      <ProgressBar value={enrollment.progress} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enrolled on{" "}
                      {format(new Date(enrollment.enrolledDate), "PPP")}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Heatmap</CardTitle>
              <CardDescription>
                Daily activity over the last 90 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-13 gap-1">
                {Object.entries(activityHeatmap).map(([date, count]) => (
                  <div
                    key={date}
                    className={`w-3 h-3 rounded-sm ${
                      count === 0
                        ? "bg-gray-100 dark:bg-gray-800"
                        : count < 3
                          ? "bg-green-200 dark:bg-green-900"
                          : count < 6
                            ? "bg-green-400 dark:bg-green-700"
                            : "bg-green-600 dark:bg-green-500"
                    }`}
                    title={`${date}: ${count} activities`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-sm" />
                  <div className="w-3 h-3 bg-green-200 dark:bg-green-900 rounded-sm" />
                  <div className="w-3 h-3 bg-green-400 dark:bg-green-700 rounded-sm" />
                  <div className="w-3 h-3 bg-green-600 dark:bg-green-500 rounded-sm" />
                </div>
                <span>More</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
              <CardDescription>User engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    <span>Average Daily Activity</span>
                  </div>
                  <span className="font-bold">4.2 actions</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span>Total Time Spent</span>
                  </div>
                  <span className="font-bold">127 hours</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span>Active Days</span>
                  </div>
                  <span className="font-bold">68/90 days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
