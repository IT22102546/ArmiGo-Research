"use client";

import { useAuthStore } from "@/stores/auth-store";
import { BookOpen, Users, FileText, TrendingUp, Shield } from "lucide-react";

export default function TeacherAnalytics() {
  const { user } = useAuthStore();

  const stats = [
    {
      label: "My Classes",
      value: "8",
      icon: BookOpen,
      color: "text-blue-500",
    },
    {
      label: "Total Students",
      value: "156",
      icon: Users,
      color: "text-green-500",
    },
    {
      label: "Active Exams",
      value: "12",
      icon: FileText,
      color: "text-purple-500",
    },
    {
      label: "Avg. Performance",
      value: "78%",
      icon: TrendingUp,
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
              Welcome back, {user?.firstName}!
            </h2>
            <p className="text-muted-foreground">
              Manage your classes, exams, and student progress.
            </p>
          </div>
          <div className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium">
            {user?.role === "INTERNAL_TEACHER"
              ? "Internal Teacher"
              : "External Teacher"}
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
                <p className="text-sm text-muted-foreground mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} bg-muted p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left">
            <BookOpen className="h-6 w-6 text-primary mb-2" />
            <h4 className="font-medium text-foreground">Create Exam</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Build a new exam for your students
            </p>
          </button>
          <button className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left">
            <Users className="h-6 w-6 text-primary mb-2" />
            <h4 className="font-medium text-gray-900">Attendance</h4>
            <p className="text-sm text-gray-600 mt-1">
              Mark student attendance
            </p>
          </button>
          <button className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left">
            <FileText className="h-6 w-6 text-primary mb-2" />
            <h4 className="font-medium text-gray-900">Publications</h4>
            <p className="text-sm text-gray-600 mt-1">Upload study materials</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <p className="text-sm text-muted-foreground">
              Grade 10 Mathematics exam completed - 45 submissions
            </p>
            <span className="ml-auto text-xs text-muted-foreground">
              2 hours ago
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            <p className="text-sm text-gray-600">
              New class created - Grade 11 Physics
            </p>
            <span className="ml-auto text-xs text-gray-500">5 hours ago</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
            <p className="text-sm text-gray-600">
              Publication uploaded - Chemistry Practical Guide
            </p>
            <span className="ml-auto text-xs text-gray-500">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
