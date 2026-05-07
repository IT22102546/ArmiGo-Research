"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Search,
  Download,
  BarChart3,
} from "lucide-react";

interface TeacherWorkload {
  teacherId: string;
  teacherName: string;
  totalClasses: number;
  totalStudents: number;
  weeklyHours: number;
  gradeAssignments: Array<{
    grade: string;
    subject: string;
    section: string;
    studentCount: number;
  }>;
  utilizationPercentage: number;
  status: "underutilized" | "optimal" | "overloaded";
}

export default function TeacherWorkloadPage() {
  const [academicYear, setAcademicYear] = useState(
    new Date().getFullYear().toString()
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "name" | "hours" | "students" | "utilization"
  >("hours");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: workloads, isLoading } = useQuery<TeacherWorkload[]>({
    queryKey: ["teacher-workload", academicYear],
    queryFn: () =>
      ApiClient.get(`/teacher-availability/workload`, {
        params: { academicYear },
      }),
  });

  // Filter and sort workloads
  const filteredWorkloads = workloads
    ?.filter((w) => {
      const matchesSearch = w.teacherName
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || w.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.teacherName.localeCompare(b.teacherName);
          break;
        case "hours":
          comparison = a.weeklyHours - b.weeklyHours;
          break;
        case "students":
          comparison = a.totalStudents - b.totalStudents;
          break;
        case "utilization":
          comparison = a.utilizationPercentage - b.utilizationPercentage;
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Calculate statistics
  const totalTeachers = workloads?.length || 0;
  const avgHours = workloads
    ? workloads.reduce((sum, w) => sum + w.weeklyHours, 0) / totalTeachers
    : 0;
  const overloadedCount =
    workloads?.filter((w) => w.status === "overloaded").length || 0;
  const underutilizedCount =
    workloads?.filter((w) => w.status === "underutilized").length || 0;

  const handleExport = () => {
    if (!workloads) return;

    const csv = [
      [
        "Teacher Name",
        "Weekly Hours",
        "Classes",
        "Students",
        "Utilization %",
        "Status",
      ],
      ...workloads.map((w) => [
        w.teacherName,
        w.weeklyHours,
        w.totalClasses,
        w.totalStudents,
        w.utilizationPercentage.toFixed(1),
        w.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teacher-workload-${academicYear}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "overloaded":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Overloaded
          </Badge>
        );
      case "underutilized":
        return (
          <Badge variant="secondary" className="gap-1">
            <TrendingDown className="h-3 w-3" />
            Underutilized
          </Badge>
        );
      case "optimal":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Optimal
          </Badge>
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Teacher Load Analysis
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor teacher workload distribution and identify optimization
            opportunities
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Teachers
            </CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {totalTeachers}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Average Weekly Hours
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {avgHours.toFixed(1)}h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Overloaded
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overloadedCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {((overloadedCount / totalTeachers) * 100).toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Underutilized
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {underutilizedCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {((underutilizedCount / totalTeachers) * 100).toFixed(0)}% of
              total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search teacher by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="overloaded">Overloaded</SelectItem>
                <SelectItem value="optimal">Optimal</SelectItem>
                <SelectItem value="underutilized">Underutilized</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="hours">Weekly Hours</SelectItem>
                <SelectItem value="students">Student Count</SelectItem>
                <SelectItem value="utilization">Utilization %</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
            >
              {sortOrder === "asc" ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workload Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Teacher Workload Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : filteredWorkloads && filteredWorkloads.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher Name</TableHead>
                    <TableHead className="text-center">Weekly Hours</TableHead>
                    <TableHead className="text-center">Classes</TableHead>
                    <TableHead className="text-center">Students</TableHead>
                    <TableHead className="text-center">Utilization</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Assignments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkloads.map((workload) => (
                    <TableRow key={workload.teacherId}>
                      <TableCell className="font-medium">
                        {workload.teacherName}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{workload.weeklyHours}h</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {workload.totalClasses}
                      </TableCell>
                      <TableCell className="text-center">
                        {workload.totalStudents}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-medium">
                            {workload.utilizationPercentage.toFixed(1)}%
                          </span>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                workload.status === "overloaded"
                                  ? "bg-red-500"
                                  : workload.status === "underutilized"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                              }`}
                              style={
                                {
                                  width: `${Math.min(workload.utilizationPercentage, 100)}%`,
                                } as React.CSSProperties
                              }
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(workload.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {workload.gradeAssignments
                            .slice(0, 2)
                            .map((assignment, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs"
                                title={`${assignment.grade} - ${assignment.subject} (${assignment.studentCount} students)`}
                              >
                                {assignment.grade} {assignment.subject}
                              </Badge>
                            ))}
                          {workload.gradeAssignments.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{workload.gradeAssignments.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No teachers found matching your filters
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {workloads && overloadedCount > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Workload Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-amber-900">
              {workloads
                .filter((w) => w.status === "overloaded")
                .map((overloaded) => {
                  const underutilized = workloads.find(
                    (w) => w.status === "underutilized"
                  );
                  if (!underutilized) return null;

                  return (
                    <li
                      key={overloaded.teacherId}
                      className="flex items-start gap-2"
                    >
                      <span className="font-medium">•</span>
                      <span>
                        Consider redistributing classes from{" "}
                        <span className="font-semibold">
                          {overloaded.teacherName}
                        </span>{" "}
                        ({overloaded.weeklyHours}h) to{" "}
                        <span className="font-semibold">
                          {underutilized.teacherName}
                        </span>{" "}
                        ({underutilized.weeklyHours}h) for better balance.
                      </span>
                    </li>
                  );
                })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
