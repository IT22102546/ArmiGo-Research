"use client";

import React, { useState, useEffect } from "react";
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
  FileText,
  Download,
  RefreshCw,
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalPatients: number;
  totalTherapists: number;
  totalSessions: number;
  activePatients: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageParticipation: number;
  assessmentSuccessRate: number;
  treatmentCompletionRate: number;
  patientGrowthRate: number;
  revenueGrowthRate: number;
}

interface PatientGrowthData {
  month: string;
  patients: number;
  therapists: number;
  total: number;
}

interface RevenueData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface ParticipationData {
  date: string;
  percentage: number;
  present: number;
  absent: number;
}

interface AssessmentPerformance {
  therapyType: string;
  successRate: number;
  averageScore: number;
  totalPatients: number;
}

interface PatientDistribution {
  department: string;
  patients: number;
  percentage: number;
  [key: string]: string | number;
}

interface TopPerformingSessions {
  id: string;
  name: string;
  therapyType: string;
  therapist: string;
  averageScore: number;
  participation: number;
  patientCount: number;
}

interface TherapistPerformance {
  id: string;
  name: string;
  specialty: string;
  sessionCount: number;
  patientCount: number;
  averagePatientProgress: number;
  participationRate: number;
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

// Dummy data
const dummyStats: DashboardStats = {
  totalUsers: 145,
  totalPatients: 98,
  totalTherapists: 24,
  totalSessions: 156,
  activePatients: 82,
  totalRevenue: 485000,
  monthlyRevenue: 62000,
  averageParticipation: 87.5,
  assessmentSuccessRate: 78.3,
  treatmentCompletionRate: 84.6,
  patientGrowthRate: 12.4,
  revenueGrowthRate: 8.7,
};

const dummyPatientGrowth: PatientGrowthData[] = [
  { month: "Jan", patients: 65, therapists: 20, total: 85 },
  { month: "Feb", patients: 72, therapists: 21, total: 93 },
  { month: "Mar", patients: 78, therapists: 22, total: 100 },
  { month: "Apr", patients: 85, therapists: 23, total: 108 },
  { month: "May", patients: 92, therapists: 24, total: 116 },
  { month: "Jun", patients: 98, therapists: 24, total: 122 },
];

const dummyRevenueData: RevenueData[] = [
  { month: "Jan", revenue: 58000, expenses: 42000, profit: 16000 },
  { month: "Feb", revenue: 61000, expenses: 43000, profit: 18000 },
  { month: "Mar", revenue: 59000, expenses: 41000, profit: 18000 },
  { month: "Apr", revenue: 63000, expenses: 44000, profit: 19000 },
  { month: "May", revenue: 60000, expenses: 42000, profit: 18000 },
  { month: "Jun", revenue: 62000, expenses: 43000, profit: 19000 },
];

const dummyParticipationData: ParticipationData[] = [
  { date: "Mon", percentage: 88, present: 72, absent: 10 },
  { date: "Tue", percentage: 90, present: 74, absent: 8 },
  { date: "Wed", percentage: 85, present: 70, absent: 12 },
  { date: "Thu", percentage: 87, present: 71, absent: 11 },
  { date: "Fri", percentage: 89, present: 73, absent: 9 },
];

const dummyAssessmentPerformance: AssessmentPerformance[] = [
  {
    therapyType: "Physical Therapy",
    successRate: 82.5,
    averageScore: 78.3,
    totalPatients: 45,
  },
  {
    therapyType: "Occupational Therapy",
    successRate: 76.8,
    averageScore: 74.2,
    totalPatients: 32,
  },
  {
    therapyType: "Speech Therapy",
    successRate: 79.2,
    averageScore: 76.5,
    totalPatients: 28,
  },
  {
    therapyType: "Cognitive Therapy",
    successRate: 73.4,
    averageScore: 71.8,
    totalPatients: 25,
  },
  {
    therapyType: "Aquatic Therapy",
    successRate: 85.1,
    averageScore: 80.6,
    totalPatients: 18,
  },
];

const dummyPatientDistribution: PatientDistribution[] = [
  { department: "Neurological", patients: 28, percentage: 28.6 },
  { department: "Orthopedic", patients: 24, percentage: 24.5 },
  { department: "Pediatric", patients: 18, percentage: 18.4 },
  { department: "Geriatric", patients: 15, percentage: 15.3 },
  { department: "Sports Medicine", patients: 13, percentage: 13.2 },
];

const dummyTopSessions: TopPerformingSessions[] = [
  {
    id: "1",
    name: "Morning PT Group",
    therapyType: "Physical Therapy",
    therapist: "Dr. Sarah Johnson",
    averageScore: 85.2,
    participation: 92,
    patientCount: 12,
  },
  {
    id: "2",
    name: "Stroke Recovery",
    therapyType: "Occupational Therapy",
    therapist: "Dr. Michael Chen",
    averageScore: 82.7,
    participation: 89,
    patientCount: 10,
  },
  {
    id: "3",
    name: "Speech Development",
    therapyType: "Speech Therapy",
    therapist: "Dr. Emily Rodriguez",
    averageScore: 81.5,
    participation: 91,
    patientCount: 8,
  },
  {
    id: "4",
    name: "Cognitive Skills",
    therapyType: "Cognitive Therapy",
    therapist: "Dr. David Kim",
    averageScore: 79.3,
    participation: 87,
    patientCount: 9,
  },
  {
    id: "5",
    name: "Aquatic Rehab",
    therapyType: "Aquatic Therapy",
    therapist: "Dr. Lisa Martinez",
    averageScore: 88.1,
    participation: 94,
    patientCount: 7,
  },
];

const dummyTherapistPerformance: TherapistPerformance[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    specialty: "Physical Therapy",
    sessionCount: 24,
    patientCount: 35,
    averagePatientProgress: 85.2,
    participationRate: 92,
    rating: 4.8,
  },
  {
    id: "2",
    name: "Dr. Michael Chen",
    specialty: "Occupational Therapy",
    sessionCount: 20,
    patientCount: 28,
    averagePatientProgress: 82.7,
    participationRate: 89,
    rating: 4.7,
  },
  {
    id: "3",
    name: "Dr. Emily Rodriguez",
    specialty: "Speech Therapy",
    sessionCount: 18,
    patientCount: 24,
    averagePatientProgress: 81.5,
    participationRate: 91,
    rating: 4.9,
  },
  {
    id: "4",
    name: "Dr. David Kim",
    specialty: "Cognitive Therapy",
    sessionCount: 16,
    patientCount: 22,
    averagePatientProgress: 79.3,
    participationRate: 87,
    rating: 4.6,
  },
  {
    id: "5",
    name: "Dr. Lisa Martinez",
    specialty: "Aquatic Therapy",
    sessionCount: 14,
    patientCount: 18,
    averagePatientProgress: 88.1,
    participationRate: 94,
    rating: 4.9,
  },
];

export default function PatientAnalyticsDashboard() {
  const [stats, _setStats] = useState<DashboardStats | null>(dummyStats);
  const [patientGrowth, _setPatientGrowth] =
    useState<PatientGrowthData[]>(dummyPatientGrowth);
  const [revenueData, _setRevenueData] =
    useState<RevenueData[]>(dummyRevenueData);
  const [participationData, _setParticipationData] = useState<
    ParticipationData[]
  >(dummyParticipationData);
  const [assessmentPerformance, _setAssessmentPerformance] = useState<
    AssessmentPerformance[]
  >(dummyAssessmentPerformance);
  const [patientDist, _setPatientDist] = useState<PatientDistribution[]>(
    dummyPatientDistribution
  );
  const [topSessions, _setTopSessions] =
    useState<TopPerformingSessions[]>(dummyTopSessions);
  const [therapistPerformance, _setTherapistPerformance] = useState<
    TherapistPerformance[]
  >(dummyTherapistPerformance);

  const [loading, _setLoading] = useState(false);
  const [dateRange, setDateRange] = useState("30");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Using dummy data - no fetch needed
  }, [dateRange]);

  const fetchAnalytics = async () => {
    // Simulate refresh with dummy data
    setRefreshing(false);
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
    icon: React.ComponentType<{ className?: string }>;
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
          <p className="mt-2 text-gray-600">Loading patient analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patient Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights and rehabilitation performance metrics
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
            change={stats.patientGrowthRate}
            icon={Users}
            color="bg-blue-600"
          />
          <StatCard
            title="Active Patients"
            value={stats.totalPatients.toLocaleString()}
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
            title="Avg Participation"
            value={stats.averageParticipation.toFixed(1)}
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
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="clinical">Clinical</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Patient Growth Trend</CardTitle>
                <CardDescription>
                  Patient and therapist registration over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={patientGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="patients"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Patients"
                    />
                    <Line
                      type="monotone"
                      dataKey="therapists"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="Therapists"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Patient Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Department Distribution</CardTitle>
                <CardDescription>
                  Patient distribution by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={patientDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="patients"
                      label={({ payload }) =>
                        `${payload.department}: ${payload.percentage}%`
                      }
                    >
                      {patientDist.map((entry, index) => (
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
                title="Active Sessions"
                value={stats.totalSessions}
                icon={BookOpen}
                color="bg-indigo-600"
              />
              <StatCard
                title="Assessment Success Rate"
                value={stats.assessmentSuccessRate.toFixed(1)}
                icon={Award}
                color="bg-green-600"
                suffix="%"
              />
              <StatCard
                title="Treatment Completion"
                value={stats.treatmentCompletionRate.toFixed(1)}
                icon={Target}
                color="bg-red-600"
                suffix="%"
              />
            </div>
          )}
        </TabsContent>

        {/* Patients Tab */}
        <TabsContent value="patients" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detailed Patient Growth */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Patient Analytics</CardTitle>
                <CardDescription>
                  Patient registration and activity trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={patientGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="patients"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Patients"
                    />
                    <Area
                      type="monotone"
                      dataKey="therapists"
                      stackId="1"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      name="Therapists"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Patient Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Patient Metrics</CardTitle>
                <CardDescription>
                  Key patient engagement statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {stats && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Active Patients
                        </span>
                        <span className="text-lg font-semibold">
                          {stats.activePatients}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Patient-Therapist Ratio
                        </span>
                        <span className="text-lg font-semibold">
                          {(
                            stats.totalPatients / stats.totalTherapists
                          ).toFixed(1)}
                          :1
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Sessions per Therapist
                        </span>
                        <span className="text-lg font-semibold">
                          {(
                            stats.totalSessions / stats.totalTherapists
                          ).toFixed(1)}
                        </span>
                      </div>
                      <div className="w-full bg-muted/80 rounded-full h-2">
                        {/* Dynamic width requires inline style */}
                        <div
                          className={`bg-blue-600 h-2 rounded-full ${styles.progressBar}`}
                          style={{
                            width: `${Math.min(100, Math.max(0, stats.patientGrowthRate))}%`,
                          }}
                          role="progressbar"
                          aria-valuenow={Math.round(stats.patientGrowthRate)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label="Patient growth rate percentage"
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600">
                        {stats.patientGrowthRate.toFixed(1)}% growth rate this
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
                          Revenue per Patient
                        </span>
                        <span className="text-purple-900 text-xl font-bold">
                          $
                          {(stats.totalRevenue / stats.totalPatients).toFixed(
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

        {/* Clinical Tab */}
        <TabsContent value="clinical" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Participation Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Patient Participation Trends</CardTitle>
                <CardDescription>Daily participation patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={participationData}>
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

            {/* Assessment Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment Performance by Therapy Type</CardTitle>
                <CardDescription>
                  Success rates across different therapies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={assessmentPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="therapyType" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="successRate"
                      fill="#82ca9d"
                      name="Success Rate %"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Clinical Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Clinical Performance Metrics</CardTitle>
              <CardDescription>
                Detailed therapy-wise performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Therapy Type</th>
                      <th className="text-left p-2">Patients</th>
                      <th className="text-left p-2">Success Rate</th>
                      <th className="text-left p-2">Average Score</th>
                      <th className="text-left p-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessmentPerformance.map((assessment, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">
                          {assessment.therapyType}
                        </td>
                        <td className="p-2">{assessment.totalPatients}</td>
                        <td className="p-2">
                          <Badge
                            className={
                              assessment.successRate >= 80
                                ? "bg-green-100 text-green-800"
                                : assessment.successRate >= 60
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {assessment.successRate.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-2">
                          {assessment.averageScore.toFixed(1)}
                        </td>
                        <td className="p-2">
                          <Badge
                            variant={
                              assessment.averageScore >= 80
                                ? "default"
                                : assessment.averageScore >= 60
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {assessment.averageScore >= 80
                              ? "A"
                              : assessment.averageScore >= 60
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
            {/* Top Performing Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Therapy Sessions</CardTitle>
                <CardDescription>
                  Best performing sessions by various metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topSessions.slice(0, 5).map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{session.name}</p>
                        <p className="text-sm text-gray-600">
                          {session.therapyType} - {session.therapist}
                        </p>
                        <p className="text-xs text-gray-500">
                          {session.patientCount} patients
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-600">
                          {session.averageScore.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-600">
                          {session.participation.toFixed(1)}% participation
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Therapist Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Therapist Performance</CardTitle>
                <CardDescription>Top performing therapists</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {therapistPerformance.slice(0, 5).map((therapist) => (
                    <div
                      key={therapist.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{therapist.name}</p>
                        <p className="text-sm text-gray-600">
                          {therapist.specialty}
                        </p>
                        <p className="text-xs text-gray-500">
                          {therapist.sessionCount} sessions,{" "}
                          {therapist.patientCount} patients
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-blue-600">
                          {therapist.rating.toFixed(1)}/5.0
                        </p>
                        <p className="text-sm text-gray-600">
                          {therapist.averagePatientProgress.toFixed(1)}% avg
                          progress
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
                  <span>Patient Report</span>
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
                  <span>Clinical Report</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Calendar className="h-6 w-6 mb-2" />
                  <span>Participation Report</span>
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
