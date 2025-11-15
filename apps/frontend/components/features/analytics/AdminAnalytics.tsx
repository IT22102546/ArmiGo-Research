"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import {
  Shield,
  Users,
  BookOpen,
  Settings,
  BarChart,
  FileText,
  Loader2,
} from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";

interface DashboardData {
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
}

export default function AdminAnalytics() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.get<DashboardData>(
        "/analytics/dashboard"
      );
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

  // Stats for display
  const stats = [
    {
      label: "Total Users",
      value: data.overview.totalUsers.toLocaleString(),
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Active Teachers",
      value: data.overview.totalTeachers.toLocaleString(),
      icon: BookOpen,
      color: "text-green-500",
    },
    {
      label: "Total Students",
      value: data.overview.totalStudents.toLocaleString(),
      icon: Users,
      color: "text-purple-500",
    },
    {
      label: "Active Classes",
      value: data.overview.activeClasses.toLocaleString(),
      icon: FileText,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Welcome to Admin Dashboard
            </h2>
            <p className="text-muted-foreground">
              Manage users, monitor platform activity, and configure system
              settings.
            </p>
          </div>
          <div className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium">
            {user?.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-card rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`h-12 w-12 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg shadow-sm p-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Avg. Class Size
          </h4>
          <p className="text-2xl font-bold text-foreground">
            {data.quickStats.averageClassSize} students
          </p>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Attendance Rate
          </h4>
          <p className="text-2xl font-bold text-gray-900">
            {data.quickStats.averageAttendanceRate}%
          </p>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            Pending Payments
          </h4>
          <p className="text-2xl font-bold text-foreground">
            {data.quickStats.pendingPayments}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {data.recentActivity.newUsersToday > 0 && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <p className="text-sm text-muted-foreground">
                {data.recentActivity.newUsersToday} new users registered today
              </p>
              <span className="ml-auto text-xs text-muted-foreground">
                Today
              </span>
            </div>
          )}
          {data.recentActivity.newClassesToday > 0 && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm text-muted-foreground">
                {data.recentActivity.newClassesToday} new classes created today
              </p>
              <span className="ml-auto text-xs text-muted-foreground">
                Today
              </span>
            </div>
          )}
          {data.recentActivity.enrollmentsToday > 0 && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
              <p className="text-sm text-muted-foreground">
                {data.recentActivity.enrollmentsToday} new enrollments today
              </p>
              <span className="ml-auto text-xs text-muted-foreground">
                Today
              </span>
            </div>
          )}
          {data.recentActivity.newUsersThisWeek > 0 && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
              <p className="text-sm text-muted-foreground">
                {data.recentActivity.newUsersThisWeek} new users this week
              </p>
              <span className="ml-auto text-xs text-muted-foreground">
                This week
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left">
            <Users className="h-6 w-6 text-primary mb-2" />
            <h4 className="font-medium text-foreground">Manage Users</h4>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage all platform users
            </p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left">
            <BookOpen className="h-6 w-6 text-primary mb-2" />
            <h4 className="font-medium text-foreground">Class Management</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Manage classes and content
            </p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left">
            <BarChart className="h-6 w-6 text-primary mb-2" />
            <h4 className="font-medium text-foreground">Analytics</h4>
            <p className="text-sm text-muted-foreground mt-1">
              View platform statistics and reports
            </p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left">
            <Settings className="h-6 w-6 text-primary mb-2" />
            <h4 className="font-medium text-gray-900">Settings</h4>
            <p className="text-sm text-gray-600 mt-1">
              Configure platform settings
            </p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left">
            <FileText className="h-6 w-6 text-primary mb-2" />
            <h4 className="font-medium text-gray-900">Reports</h4>
            <p className="text-sm text-gray-600 mt-1">
              Generate and download reports
            </p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left">
            <Shield className="h-6 w-6 text-primary mb-2" />
            <h4 className="font-medium text-gray-900">Security</h4>
            <p className="text-sm text-gray-600 mt-1">
              Manage security and permissions
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
