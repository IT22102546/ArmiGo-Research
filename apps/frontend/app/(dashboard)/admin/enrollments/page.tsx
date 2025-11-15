"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Users,
  BookOpen,
  Video,
  FileText,
  GraduationCap,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import {
  enrollmentsApi,
  GroupedEnrollmentsResponse,
  GroupedEnrollmentFilters,
} from "@/lib/api/endpoints/enrollments";
import {
  StudentEnrollmentRow,
  CreateEnrollmentDialog,
} from "@/components/admin/enrollments";

type EnrollmentType = "all" | "class" | "seminar" | "exam";

export default function EnrollmentsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<EnrollmentType>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<GroupedEnrollmentFilters>({
    search: "",
    status: "",
    page: 1,
    limit: 20,
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["enrollments-grouped", activeTab, filters],
    queryFn: async () => {
      const queryFilters: GroupedEnrollmentFilters = {
        ...filters,
        type: activeTab !== "all" ? activeTab : undefined,
      };
      const response = await enrollmentsApi.getGroupedByStudent(queryFilters);
      return response as GroupedEnrollmentsResponse;
    },
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value as EnrollmentType);
    setFilters((prev) => ({ ...prev, status: "", page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "", page: 1, limit: 20 });
  };

  const handleEnrollmentCreated = () => {
    // Invalidate and refetch the enrollments query
    queryClient.invalidateQueries({ queryKey: ["enrollments-grouped"] });
    setIsCreateDialogOpen(false);
  };

  // Get status options based on active tab
  const getStatusOptions = () => {
    switch (activeTab) {
      case "class":
        return [
          { value: "ACTIVE", label: "Active" },
          { value: "PENDING", label: "Pending" },
          { value: "COMPLETED", label: "Completed" },
          { value: "CANCELLED", label: "Cancelled" },
          { value: "SUSPENDED", label: "Suspended" },
        ];
      case "seminar":
        return [
          { value: "attended", label: "Attended" },
          { value: "not-attended", label: "Not Attended" },
        ];
      case "exam":
        return [
          { value: "STARTED", label: "Started" },
          { value: "IN_PROGRESS", label: "In Progress" },
          { value: "SUBMITTED", label: "Submitted" },
          { value: "GRADED", label: "Graded" },
        ];
      default:
        return [];
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const stats = data?.stats || {
    totalStudents: 0,
    totalClassEnrollments: 0,
    totalSeminarRegistrations: 0,
    totalExamAttempts: 0,
  };

  const pagination = data?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  };

  return (
    <div className="space-y-6 p-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            Enrollment Management
          </h1>
          <p className="text-muted-foreground">
            Manage student enrollments across classes, seminars, and exams
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Enrollment
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className={`cursor-pointer transition-all ${
            activeTab === "all" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => handleTabChange("all")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">With any enrollment</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            activeTab === "class" ? "ring-2 ring-blue-500" : ""
          }`}
          onClick={() => handleTabChange("class")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Class Enrollments
            </CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalClassEnrollments}
            </div>
            <p className="text-xs text-muted-foreground">
              Active class subscriptions
            </p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            activeTab === "seminar" ? "ring-2 ring-purple-500" : ""
          }`}
          onClick={() => handleTabChange("seminar")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Seminar Registrations
            </CardTitle>
            <Video className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalSeminarRegistrations}
            </div>
            <p className="text-xs text-muted-foreground">Seminar sign-ups</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            activeTab === "exam" ? "ring-2 ring-orange-500" : ""
          }`}
          onClick={() => handleTabChange("exam")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exam Attempts</CardTitle>
            <FileText className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.totalExamAttempts}
            </div>
            <p className="text-xs text-muted-foreground">
              Total exam participations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Enrollments
            </CardTitle>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="all" className="gap-2">
                  <Users className="h-4 w-4" />
                  All
                </TabsTrigger>
                <TabsTrigger value="class" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Classes
                </TabsTrigger>
                <TabsTrigger value="seminar" className="gap-2">
                  <Video className="h-4 w-4" />
                  Seminars
                </TabsTrigger>
                <TabsTrigger value="exam" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Exams
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name or email..."
                className="pl-10"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value, page: 1 })
                }
              />
            </div>

            {activeTab !== "all" && (
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    status: value === "all" ? "" : value,
                    page: 1,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {getStatusOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student Enrollments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Enrollments</CardTitle>
          <CardDescription>
            {pagination.total} student(s) found • Showing page {pagination.page}{" "}
            of {pagination.totalPages || 1}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Seminars</TableHead>
                <TableHead>Exams</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.length === 0 ? (
                <TableRow>
                  <td
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No students found with enrollments
                  </td>
                </TableRow>
              ) : (
                data?.data?.map((studentData) => (
                  <StudentEnrollmentRow
                    key={studentData.student.id}
                    data={studentData}
                    activeTab={activeTab}
                  />
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} students
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      let pageNum: number;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pagination.page === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Enrollment Dialog */}
      <CreateEnrollmentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleEnrollmentCreated}
      />
    </div>
  );
}
