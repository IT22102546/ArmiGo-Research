"use client";

import { useAuthStore } from "@/stores/auth-store";
import {
  Shield,
  Users,
  BookOpen,
  Settings,
  BarChart,
  FileText,
} from "lucide-react";

export default function AdminAnalytics() {
  const { user } = useAuthStore();

  // Simple stats for admin dashboard
  const stats = [
    {
      label: "Total Users",
      value: "1,234",
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Active Teachers",
      value: "456",
      icon: BookOpen,
      color: "text-green-500",
    },
    {
      label: "Total Students",
      value: "778",
      icon: Users,
      color: "text-purple-500",
    },
    {
      label: "Active Courses",
      value: "89",
      icon: FileText,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Welcome to Admin Dashboard
            </h2>
            <p className="text-gray-600">
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
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
              </div>
              <stat.icon className={`h-12 w-12 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left">
            <Users className="h-6 w-6 text-primary mb-2" />
            <h4 className="font-medium text-gray-900">Manage Users</h4>
            <p className="text-sm text-gray-600 mt-1">
              View and manage all platform users
            </p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left">
            <BookOpen className="h-6 w-6 text-primary mb-2" />
            <h4 className="font-medium text-gray-900">Course Management</h4>
            <p className="text-sm text-gray-600 mt-1">
              Manage courses and content
            </p>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left">
            <BarChart className="h-6 w-6 text-primary mb-2" />
            <h4 className="font-medium text-gray-900">Analytics</h4>
            <p className="text-sm text-gray-600 mt-1">
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

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <p className="text-sm text-gray-600">
              New teacher registered - John Doe
            </p>
            <span className="ml-auto text-xs text-gray-500">2 min ago</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            <p className="text-sm text-gray-600">
              Course "Mathematics 101" was updated
            </p>
            <span className="ml-auto text-xs text-gray-500">15 min ago</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
            <p className="text-sm text-gray-600">
              50 students enrolled in new courses
            </p>
            <span className="ml-auto text-xs text-gray-500">1 hour ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
