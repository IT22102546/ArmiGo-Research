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
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  BookOpen,
  Users,
  CheckCircle,
  FileText,
} from "lucide-react";
import { examsApi } from "@/lib/api/endpoints/exams";
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
  exams: Exam[];
}

interface Exam {
  id: string;
  title: string;
  totalMarks: number;
  passingMarks: number;
  duration: number;
  totalAttempts: number;
  submittedAttempts: number;
  questionCount: number;
  startTime: string;
  endTime: string;
  attemptCount?: number; // Optional: From getGradesWithExamsForMarking
}

interface Student {
  id: string;
  studentId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  grade?: { id: string; name: string };
  status: string;
  submittedAt: string;
  totalScore?: number;
  maxScore: number;
  percentage?: number;
  markedQuestions: number;
  totalQuestions: number;
  markingProgress: number;
  passed?: boolean;
}

interface MarkingQueuePageProps {
  examId?: string;
}

export default function MarkingQueuePage({
  examId,
}: MarkingQueuePageProps = {}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"grades" | "exams" | "students">(
    examId ? "students" : "grades"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Grades
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

  // Step 2: Exams
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  // Step 3: Students
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "marked" | "unmarked"
  >("all");

  // Set mounted flag on client side only
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch grades with exams on mount
  useEffect(() => {
    if (mounted) {
      if (examId) {
        // If examId is provided, fetch that exam's students directly
        fetchExamStudents(examId);
      } else {
        // Otherwise, start from grades selection
        fetchGradesWithExams();
      }
    }
  }, [mounted, examId]);

  const fetchGradesWithExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await examsApi.getGradesWithExamsForMarking();
      console.log("Grades response:", response);
      console.log("Type of response:", typeof response);
      console.log("Is array?", Array.isArray(response));
      console.log("Response keys:", Object.keys(response || {}));

      // If response is 0 or falsy, handle it
      if (!response) {
        setGrades([]);
        setError("No data returned from server");
        return;
      }

      let gradesData = response;

      // If response is an object with data property
      if (response && typeof response === "object" && "data" in response) {
        gradesData = response.data;
      }

      // Ensure it's an array
      if (Array.isArray(gradesData)) {
        setGrades(gradesData);
        if (gradesData.length === 0) {
          setError("No live sessions found");
        }
      } else {
        // Try to convert to array if it looks like array-like object
        if (
          gradesData &&
          typeof gradesData === "object" &&
          gradesData.length !== undefined
        ) {
          const arrayFromObject = Array.from(gradesData) as Grade[];
          if (arrayFromObject.length > 0) {
            setGrades(arrayFromObject);
            return;
          }
        }
        setError(
          `Invalid response format. Expected array, got: ${typeof gradesData}`
        );
      }
    } catch (err) {
      console.error("Error fetching grades:", err);
      setError("Failed to load grades");
    } finally {
      setLoading(false);
    }
  };

  const fetchExamStudents = async (examIdToFetch: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch students for the exam
      const studentsResponse =
        await examsApi.getStudentsForExamMarking(examIdToFetch);
      console.log("Students response:", studentsResponse);

      // Handle both response.data and direct array response
      let studentsData = studentsResponse;
      if (studentsResponse?.data) {
        studentsData = studentsResponse.data;
      }

      if (Array.isArray(studentsData)) {
        setStudents(studentsData);
        setFilteredStudents(studentsData);

        if (studentsData.length === 0) {
          setError("No students found for this exam");
        }

        // Set a minimal exam object
        setSelectedExam({ id: examIdToFetch } as Exam);
      } else {
        setError("Invalid students data format");
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSelect = async (grade: Grade) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedGrade(grade);

      // Use exams from the grade object directly (already loaded)
      const examsData = grade.exams || [];
      setExams(examsData);

      if (!examsData || examsData.length === 0) {
        setError("No exams found for this grade");
        setLoading(false);
        return;
      }

      setStep("exams");
    } catch (err) {
      console.error("Error selecting grade:", err);
      setError("Failed to select grade");
    } finally {
      setLoading(false);
    }
  };

  const handleExamSelect = async (exam: Exam) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedExam(exam);

      // Fetch students for selected exam
      const studentsResponse = await examsApi.getStudentsForExamMarking(
        exam.id
      );
      console.log("Students response:", studentsResponse);

      // Handle both response.data and direct array response
      let studentsData = studentsResponse;
      if (studentsResponse?.data) {
        studentsData = studentsResponse.data;
      }

      if (Array.isArray(studentsData)) {
        setStudents(studentsData);
        setFilteredStudents(studentsData);

        if (studentsData.length === 0) {
          setError("No students found for this exam");
          setLoading(false);
          return;
        }

        setStep("students");
      } else {
        setError("Invalid students data format");
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (student: Student) => {
    // Navigate to student marking page
    router.push(
      `/teacher/marking/student/${student.id}?examId=${selectedExam?.id}`
    );
  };

  useEffect(() => {
    if (step === "students") {
      let filtered = students;

      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(
          (s) =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Filter by status
      if (filterStatus !== "all") {
        if (filterStatus === "marked") {
          filtered = filtered.filter((s) => s.markingProgress === 100);
        } else if (filterStatus === "unmarked") {
          filtered = filtered.filter((s) => s.markingProgress === 0);
        }
      }

      setFilteredStudents(filtered);
    }
  }, [searchTerm, filterStatus, students, step]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (loading && step === "grades") {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && step === "grades") {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-4">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            step === "grades" ? "bg-blue-100 text-blue-900" : "bg-gray-100"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span className="font-medium">Select Grade</span>
        </div>

        <ChevronRight className="h-4 w-4 text-gray-400" />

        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            step === "exams" ? "bg-blue-100 text-blue-900" : "bg-gray-100"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span className="font-medium">Select Exam</span>
        </div>

        <ChevronRight className="h-4 w-4 text-gray-400" />

        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            step === "students" ? "bg-blue-100 text-blue-900" : "bg-gray-100"
          }`}
        >
          <Users className="h-4 w-4" />
          <span className="font-medium">Select Student</span>
        </div>
      </div>

      {/* Step 1: Grade Selection */}
      {step === "grades" && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Select Grade for Marking</h2>
          <p className="text-gray-600 mb-6">
            Choose a grade to see all exams that need marking
          </p>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : grades.length === 0 ? (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-5 w-5" />
                  <p>No patients with live sessions found</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grades.map((grade) => (
                <Card
                  key={grade.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleGradeSelect(grade)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{grade.name}</CardTitle>
                    <CardDescription>
                      {grade.exams.length} exam
                      {grade.exams.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {grade.exams.map((exam) => (
                        <div key={exam.id} className="text-sm">
                          <p className="font-medium text-gray-700">
                            {exam.title}
                          </p>
                          <p className="text-gray-500">
                            {exam.attemptCount} attempts
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Exam Selection */}
      {step === "exams" && selectedGrade && (
        <div>
          <Button
            variant="ghost"
            onClick={() => {
              setStep("grades");
              setSelectedGrade(null);
              setExams([]);
            }}
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Grades
          </Button>

          <h2 className="text-2xl font-bold mb-2">
            Exams for Grade: {selectedGrade.name}
          </h2>
          <p className="text-gray-600 mb-6">Select an exam to mark answers</p>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : exams.length === 0 ? (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-5 w-5" />
                  <p>No exams found for this grade</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => (
                <Card
                  key={exam.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleExamSelect(exam)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{exam.title}</CardTitle>
                        <CardDescription>
                          {exam.questionCount} questions • {exam.duration}{" "}
                          minutes
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        {exam.submittedAttempts}/{exam.totalAttempts} submitted
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Marks</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {exam.totalMarks}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Passing Marks</p>
                        <p className="text-2xl font-bold text-green-600">
                          {exam.passingMarks}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Pending Marking</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {exam.totalAttempts - exam.submittedAttempts}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Student Selection */}
      {step === "students" && selectedExam && selectedGrade && (
        <div>
          <Button
            variant="ghost"
            onClick={() => {
              setStep("exams");
              setSelectedExam(null);
              setStudents([]);
            }}
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Exams
          </Button>

          <h2 className="text-2xl font-bold mb-2">
            Students: {selectedGrade.name} - {selectedExam.title}
          </h2>
          <p className="text-gray-600 mb-6">
            Click on a student to start marking their answers
          </p>

          {/* Filters and Search */}
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Search student name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as "all" | "marked" | "unmarked")
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter submissions by status"
              title="Filter submissions by status"
            >
              <option value="all">All</option>
              <option value="marked">Fully Marked</option>
              <option value="unmarked">Unmarked</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-5 w-5" />
                  <p>No students found</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <Card
                  key={student.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleStudentSelect(student)}
                >
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{student.name}</h3>
                        <p className="text-sm text-gray-600">{student.email}</p>

                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Score</p>
                            <p className="text-xl font-bold text-blue-600">
                              {student.totalScore ?? "-"}/{student.maxScore}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Percentage</p>
                            <p className="text-xl font-bold">
                              {student.percentage
                                ? `${student.percentage.toFixed(1)}%`
                                : "-"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-medium">
                              Marking Progress
                            </p>
                            <Badge
                              variant={
                                student.markingProgress === 100
                                  ? "default"
                                  : student.markingProgress === 0
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {student.markingProgress}%
                            </Badge>
                          </div>
                          <Progress value={student.markingProgress} />
                          <p className="text-xs text-gray-600 mt-1">
                            {student.markedQuestions} of{" "}
                            {student.totalQuestions} questions marked
                          </p>
                        </div>
                      </div>

                      <div className="ml-6 flex items-center">
                        {student.markingProgress === 100 && (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
