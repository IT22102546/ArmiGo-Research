"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  BookOpen,
  TrendingUp,
  Activity,
  Search,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import { handleApiError, asApiError } from "@/lib/error-handling";
const logger = createLogger("EnrollmentForm");
import { getDisplayName } from "@/lib/utils/display";

interface EnrollmentOverview {
  totalEnrolled: number;
  activeEnrollments: number;
  completedEnrollments: number;
  averageCompletionRate: number;
}

interface EnrollmentByGrade {
  grade: number;
  count: number;
  completionRate: number;
}

interface RecentEnrollment {
  id: number;
  studentId: number;
  subjectId: number;
  createdAt: string;
  student: {
    name: string;
    email: string;
  };
  subject: {
    name: string;
    grade: number;
  };
}

interface EnrollmentStats {
  overview: EnrollmentOverview;
  byGrade: EnrollmentByGrade[];
  recentEnrollments: RecentEnrollment[];
}

const DashStudentEnrollment: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EnrollmentStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEnrollmentStats();
  }, []);

  const fetchEnrollmentStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiClient.get<EnrollmentStats>(
        "/admin/enrollment-stats"
      );
      setStats(response);
    } catch (error) {
      logger.error("Error fetching enrollment stats:", error);
      const errorMessage =
        asApiError(error).response?.data?.message ||
        "Failed to load enrollment statistics";
      setError(errorMessage);
      handleApiError(
        error,
        "EnrollmentForm.fetchEnrollmentStats",
        "Failed to load enrollment statistics"
      );
    } finally {
      setLoading(false);
    }
  };

  // Move filtering logic to useMemo to avoid calling during render
  const filteredRecentEnrollments = React.useMemo(() => {
    if (!stats?.recentEnrollments) return [];

    return stats.recentEnrollments.filter(
      (enrollment) =>
        (enrollment.student?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (enrollment.student?.email || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (enrollment.subject?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
  }, [stats?.recentEnrollments, searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-destructive text-lg">{error}</p>
        <Button onClick={fetchEnrollmentStats}>Retry Loading</Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No enrollment data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Student Enrollment
        </h2>
        <p className="text-muted-foreground">
          View comprehensive student enrollment details and statistics
        </p>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Enrolled</p>
              <p className="text-3xl font-bold">
                {stats?.overview?.totalEnrolled ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Activity className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Active Enrollments
              </p>
              <p className="text-3xl font-bold">
                {stats?.overview?.activeEnrollments ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-3xl font-bold">
                {stats?.overview?.completedEnrollments ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Avg. Completion Rate
              </p>
              <p className="text-3xl font-bold">
                {(stats?.overview?.averageCompletionRate ?? 0).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrollment by Grade */}
      <Card>
        <CardHeader>
          <CardTitle>Enrollment by Grade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead>
                  <TableHead>Total Students</TableHead>
                  <TableHead>Completion Rate</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!stats?.byGrade || stats.byGrade.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No enrollment data by grade
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.byGrade.map((gradeData) => (
                    <TableRow key={gradeData.grade}>
                      <TableCell className="font-medium">
                        Grade {getDisplayName(gradeData.grade)}
                      </TableCell>
                      <TableCell>{gradeData.count} students</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-secondary rounded-full h-2 max-w-[100px]">
                            {/* eslint-disable-next-line react/forbid-dom-props */}
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{
                                width: `${gradeData.completionRate ?? 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {(gradeData.completionRate ?? 0).toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            (gradeData.completionRate ?? 0) >= 75
                              ? "default"
                              : (gradeData.completionRate ?? 0) >= 50
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {(gradeData.completionRate ?? 0) >= 75
                            ? "Excellent"
                            : (gradeData.completionRate ?? 0) >= 50
                              ? "Good"
                              : "Needs Attention"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Enrollments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Enrollments</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students or subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Enrolled Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecentEnrollments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {searchTerm
                        ? "No enrollments match your search"
                        : "No recent enrollments"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecentEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">
                        {enrollment.student?.name || "Unknown"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {enrollment.student?.email || ""}
                      </TableCell>
                      <TableCell>
                        {enrollment.subject?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          Grade {getDisplayName(enrollment.subject?.grade)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {new Date(enrollment.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashStudentEnrollment;
