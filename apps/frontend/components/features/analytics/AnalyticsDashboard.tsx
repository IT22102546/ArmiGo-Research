"use client";

import React, { useState, useEffect } from "react";
import { getDisplayName } from "@/lib/utils/display";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import styles from "./analytics-dashboard.module.css";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  DollarSign,
  Calendar,
  Target,
  Award,
  Clock,
  FileText,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  activeEnrollments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageAttendance: number;
  examPassRate: number;
  completionRate: number;
  userGrowthRate: number;
  revenueGrowthRate: number;
}

interface UserGrowthData {
  month: string;
  students: number;
  teachers: number;
  total: number;
}

interface RevenueData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface AttendanceData {
  date: string;
  percentage: number;
  present: number;
  absent: number;
}

interface ExamPerformance {
  subject: string;
  passRate: number;
  averageScore: number;
  totalStudents: number;
}

interface EnrollmentDistribution {
  grade: string;
  students: number;
  percentage: number;
  [key: string]: string | number;
}

interface TopPerformingClasses {
  id: string;
  name: string;
  subject: string;
  teacher: string;
  averageScore: number;
  attendance: number;
  enrollmentCount: number;
}

interface TeacherPerformance {
  id: string;
  name: string;
  subject: string;
  classCount: number;
  studentCount: number;
  averageClassScore: number;
  attendanceRate: number;
  rating: number;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [examPerformance, setExamPerformance] = useState<ExamPerformance[]>([]);
  const [enrollmentDist, setEnrollmentDist] = useState<
    EnrollmentDistribution[]
  >([]);
  const [topClasses, setTopClasses] = useState<TopPerformingClasses[]>([]);
  const [teacherPerformance, setTeacherPerformance] = useState<
    TeacherPerformance[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const endpoints = [
        `/api/analytics/dashboard-stats?days=${dateRange}`,
        `/api/analytics/user-growth?days=${dateRange}`,
        `/api/analytics/revenue-analytics?days=${dateRange}`,
        `/api/analytics/attendance-trends?days=${dateRange}`,
        `/api/analytics/exam-performance?days=${dateRange}`,
        `/api/analytics/enrollment-distribution`,
        `/api/analytics/top-classes?days=${dateRange}`,
        `/api/analytics/teacher-performance?days=${dateRange}`,
      ];

      const responses = await Promise.all(endpoints.map((url) => fetch(url)));
      const data = await Promise.all(responses.map((res) => res.json()));

      if (responses.every((res) => res.ok)) {
        setStats(data[0].data);
        setUserGrowth(data[1].data || []);
        setRevenueData(data[2].data || []);
        setAttendanceData(data[3].data || []);
        setExamPerformance(data[4].data || []);
        setEnrollmentDist(data[5].data || []);
        setTopClasses(data[6].data || []);
        setTeacherPerformance(data[7].data || []);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
  };

  const handleExportReport = async () => {
    try {
      const response = await fetch(
        `/api/analytics/export-report?days=${dateRange}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analytics-report-${dateRange}days.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to export report:", error);
    }
  };

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
    prefix = "",
    suffix = "",
  }: {
    title: string;
    value: string | number;
    change?: number;
    icon: any;
    color: string;
    prefix?: string;
    suffix?: string;
  }) => (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold">
            {prefix}
            {value}
            {suffix}
          </p>
          {change !== undefined && (
            <p
              className={`text-sm ${change >= 0 ? "text-green-600" : "text-red-600"} flex items-center mt-1`}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              {change >= 0 ? "+" : ""}
              {change.toFixed(1)}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights and performance metrics
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button onClick={handleExportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            change={stats.userGrowthRate}
            icon={Users}
            color="bg-blue-600"
          />
          <StatCard
            title="Active Students"
            value={stats.totalStudents.toLocaleString()}
            icon={GraduationCap}
            color="bg-green-600"
          />
          <StatCard
            title="Monthly Revenue"
            value={stats.monthlyRevenue.toLocaleString()}
            change={stats.revenueGrowthRate}
            icon={DollarSign}
            color="bg-purple-600"
            prefix="$"
          />
          <StatCard
            title="Avg Attendance"
            value={stats.averageAttendance.toFixed(1)}
            icon={Calendar}
            color="bg-orange-600"
            suffix="%"
          />
        </div>
      )}

      {/* Charts and Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Growth Trend</CardTitle>
                <CardDescription>
                  Student and teacher registration over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="students"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Students"
                    />
                    <Line
                      type="monotone"
                      dataKey="teachers"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="Teachers"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Enrollment Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>
                  Student enrollment by grade level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={enrollmentDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="students"
                      label={({ payload }) =>
                        `${payload.grade}: ${payload.percentage}%`
                      }
                    >
                      {enrollmentDist.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Additional Overview Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Active Classes"
                value={stats.totalClasses}
                icon={BookOpen}
                color="bg-indigo-600"
              />
              <StatCard
                title="Exam Pass Rate"
                value={stats.examPassRate.toFixed(1)}
                icon={Award}
                color="bg-green-600"
                suffix="%"
              />
              <StatCard
                title="Course Completion"
                value={stats.completionRate.toFixed(1)}
                icon={Target}
                color="bg-red-600"
                suffix="%"
              />
            </div>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detailed User Growth */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed User Analytics</CardTitle>
                <CardDescription>
                  User registration and activity trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="students"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Students"
                    />
                    <Area
                      type="monotone"
                      dataKey="teachers"
                      stackId="1"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      name="Teachers"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>User Metrics</CardTitle>
                <CardDescription>
                  Key user engagement statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {stats && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Total Enrollments
                        </span>
                        <span className="text-lg font-semibold">
                          {stats.activeEnrollments}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Student-Teacher Ratio
                        </span>
                        <span className="text-lg font-semibold">
                          {(stats.totalStudents / stats.totalTeachers).toFixed(
                            1
                          )}
                          :1
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Classes per Teacher
                        </span>
                        <span className="text-lg font-semibold">
                          {(stats.totalClasses / stats.totalTeachers).toFixed(
                            1
                          )}
                        </span>
                      </div>
                      <div className="w-full bg-muted/80 rounded-full h-2">
                        {/* Dynamic width requires inline style */}
                        <div
                          className={`bg-blue-600 h-2 rounded-full ${styles.progressBar}`}
                          style={{
                            width: `${Math.min(100, Math.max(0, stats.userGrowthRate))}%`,
                          }}
                          role="progressbar"
                          aria-valuenow={Math.round(stats.userGrowthRate)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label="User growth rate percentage"
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600">
                        {stats.userGrowthRate.toFixed(1)}% growth rate this
                        period
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>
                  Financial performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                    <Bar dataKey="expenses" fill="#82ca9d" name="Expenses" />
                    <Bar dataKey="profit" fill="#ffc658" name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>Key financial indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats && (
                    <>
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <span className="text-green-800 font-medium">
                          Total Revenue
                        </span>
                        <span className="text-green-900 text-xl font-bold">
                          ${stats.totalRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <span className="text-blue-800 font-medium">
                          Monthly Revenue
                        </span>
                        <span className="text-blue-900 text-xl font-bold">
                          ${stats.monthlyRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                        <span className="text-purple-800 font-medium">
                          Revenue per Student
                        </span>
                        <span className="text-purple-900 text-xl font-bold">
                          $
                          {(stats.totalRevenue / stats.totalStudents).toFixed(
                            2
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                        <span className="text-orange-800 font-medium">
                          Growth Rate
                        </span>
                        <span className="text-orange-900 text-xl font-bold">
                          {stats.revenueGrowthRate.toFixed(1)}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
                <CardDescription>Daily attendance patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="percentage"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Exam Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Exam Performance by Subject</CardTitle>
                <CardDescription>
                  Pass rates across different subjects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={examPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="passRate" fill="#82ca9d" name="Pass Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Academic Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Performance Metrics</CardTitle>
              <CardDescription>
                Detailed subject-wise performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Subject</th>
                      <th className="text-left p-2">Students</th>
                      <th className="text-left p-2">Pass Rate</th>
                      <th className="text-left p-2">Average Score</th>
                      <th className="text-left p-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examPerformance.map((subject, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">
                          {getDisplayName(subject.subject)}
                        </td>
                        <td className="p-2">{subject.totalStudents}</td>
                        <td className="p-2">
                          <Badge
                            className={
                              subject.passRate >= 80
                                ? "bg-green-100 text-green-800"
                                : subject.passRate >= 60
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {subject.passRate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-2">
                          {subject.averageScore.toFixed(1)}
                        </td>
                        <td className="p-2">
                          <Badge
                            variant={
                              subject.averageScore >= 80
                                ? "default"
                                : subject.averageScore >= 60
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {subject.averageScore >= 80
                              ? "A"
                              : subject.averageScore >= 60
                                ? "B"
                                : "C"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Classes */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Classes</CardTitle>
                <CardDescription>
                  Best performing classes by various metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topClasses.slice(0, 5).map((classItem, index) => (
                    <div
                      key={classItem.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{classItem.name}</p>
                        <p className="text-sm text-gray-600">
                          {getDisplayName(classItem.subject)} -{" "}
                          {classItem.teacher}
                        </p>
                        <p className="text-xs text-gray-500">
                          {classItem.enrollmentCount} students
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-600">
                          {classItem.averageScore.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-600">
                          {classItem.attendance.toFixed(1)}% attendance
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Teacher Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Teacher Performance</CardTitle>
                <CardDescription>Top performing educators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teacherPerformance.slice(0, 5).map((teacher, index) => (
                    <div
                      key={teacher.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{teacher.name}</p>
                        <p className="text-sm text-gray-600">
                          {getDisplayName(teacher.subject)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {teacher.classCount} classes, {teacher.studentCount}{" "}
                          students
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-blue-600">
                          {teacher.rating.toFixed(1)}/5.0
                        </p>
                        <p className="text-sm text-gray-600">
                          {teacher.averageClassScore.toFixed(1)}% avg score
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Reports</CardTitle>
              <CardDescription>
                Create detailed analytics reports for different time periods and
                metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={handleExportReport}
                >
                  <FileText className="h-6 w-6 mb-2" />
                  <span>Full Analytics Report</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Users className="h-6 w-6 mb-2" />
                  <span>User Report</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <DollarSign className="h-6 w-6 mb-2" />
                  <span>Financial Report</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <GraduationCap className="h-6 w-6 mb-2" />
                  <span>Academic Report</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Calendar className="h-6 w-6 mb-2" />
                  <span>Attendance Report</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Award className="h-6 w-6 mb-2" />
                  <span>Performance Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
