"use client";

import React, { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Loader2, AlertCircle, Users, CheckCircle } from "lucide-react";
import { examsApi } from "@/lib/api/endpoints/exams";
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

interface Grade {
  id: string;
  name: string;
}

interface District {
  id: string;
  name: string;
}

interface Zone {
  id: string;
  name: string;
}

interface StudentProfile {
  id: string;
  studentId?: string;
  gradeId?: string;
  grade?: Grade;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  districtId?: string;
  zoneId?: string;
  district?: District;
  zone?: Zone;
  studentProfile?: StudentProfile;
}

interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  status: string;
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string;
  totalScore?: number;
  maxScore: number;
  percentage?: number;
  passed?: boolean;
  student: Student;
  markingStatus?: "marked" | "unmarked" | "partial";
  markedQuestions?: number;
  totalQuestions?: number;
  markingProgress?: number;
}

interface ExamStudentsListPageProps {
  examId: string;
}

export default function ExamStudentsListPage({
  examId,
}: ExamStudentsListPageProps) {
  const router = useRouter();
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Available filter options
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);

  // Overall marking progress
  const [overallProgress, setOverallProgress] = useState(0);
  const [markedCount, setMarkedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchAttempts();
  }, [examId]);

  useEffect(() => {
    applyFilters();
  }, [attempts, selectedGrade, selectedStatus]);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await examsApi.getExamAttempts(examId);
      const attemptsData = Array.isArray(response) ? response : [];
      setAttempts(attemptsData);

      // Extract unique grades
      const grades = new Set<string>();
      attemptsData.forEach((attempt) => {
        if (attempt.student?.studentProfile?.grade?.name) {
          grades.add(attempt.student.studentProfile.grade.name);
        }
      });
      setAvailableGrades(Array.from(grades).sort());

      // Calculate overall progress
      calculateOverallProgress(attemptsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load student attempts";
      setError(errorMessage);
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallProgress = (attemptsData: ExamAttempt[]) => {
    const totalAttempts = attemptsData.length;
    const markedAttempts = attemptsData.filter(
      (attempt) => attempt.markingStatus === "marked"
    ).length;

    setTotalCount(totalAttempts);
    setMarkedCount(markedAttempts);
    setOverallProgress(
      totalAttempts > 0 ? (markedAttempts / totalAttempts) * 100 : 0
    );
  };

  const applyFilters = () => {
    let filtered = [...attempts];

    // Filter by grade
    if (selectedGrade !== "all") {
      filtered = filtered.filter(
        (attempt) =>
          attempt.student?.studentProfile?.grade?.name === selectedGrade
      );
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (attempt) => attempt.markingStatus === selectedStatus
      );
    }

    setFilteredAttempts(filtered);
  };

  const handleViewExam = (attemptId: string) => {
    router.push(`/marking/student/${attemptId}`);
  };

  const getStatusBadge = (markingStatus?: string) => {
    switch (markingStatus) {
      case "marked":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Marked
          </Badge>
        );
      case "partial":
        return (
          <Badge
            variant="default"
            className="bg-yellow-500 hover:bg-yellow-600"
          >
            Partial
          </Badge>
        );
      case "unmarked":
        return <Badge variant="secondary">Unmarked</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading student attempts...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchAttempts}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Overall Marking Progress
          </CardTitle>
          <CardDescription>
            {markedCount} of {totalCount} students marked (
            {totalCount > 0 ? Math.round((markedCount / totalCount) * 100) : 0}
            %)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3" />
        </CardContent>
      </Card>

      {/* Students List Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Student Attempts</CardTitle>
              <CardDescription>
                {filteredAttempts.length} student
                {filteredAttempts.length !== 1 ? "s" : ""} found
              </CardDescription>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Grade</label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {availableGrades.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="marked">Marked</SelectItem>
                    <SelectItem value="unmarked">Unmarked</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAttempts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
              <p className="text-muted-foreground">
                {attempts.length === 0
                  ? "No students have attempted this exam yet."
                  : "No students match the selected filters."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Total Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium">
                        {attempt.student.firstName} {attempt.student.lastName}
                      </TableCell>
                      <TableCell>
                        {attempt.student.studentProfile?.grade?.name || "-"}
                      </TableCell>
                      <TableCell>
                        {attempt.student.studentProfile?.studentId || "-"}
                      </TableCell>
                      <TableCell>
                        {safeFormatDate(attempt.submittedAt, "PPp")}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(attempt.markingStatus)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={attempt.markingProgress || 0}
                            className="h-2 w-24"
                          />
                          <span className="text-sm text-muted-foreground">
                            {attempt.markedQuestions || 0}/
                            {attempt.totalQuestions || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {attempt.totalScore !== null &&
                        attempt.totalScore !== undefined ? (
                          <span className="font-semibold">
                            {attempt.totalScore.toFixed(1)}/{attempt.maxScore}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewExam(attempt.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Exam
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
