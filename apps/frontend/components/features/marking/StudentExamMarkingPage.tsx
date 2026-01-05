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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText,
  Eye,
  EyeOff,
  User,
  Calendar,
  Award,
} from "lucide-react";
import { examsApi } from "@/lib/api/endpoints/exams";
import { handleApiError, handleApiSuccess } from "@/lib/error-handling";
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
  startedAt: string;
  submittedAt?: string;
  totalScore?: number;
  maxScore: number;
  percentage?: number;
  student: Student;
  exam: {
    id: string;
    title: string;
    type: string;
    totalMarks: number;
    passingMarks: number;
    duration: number;
  };
  markingProgress?: number;
  markedQuestions?: number;
  totalQuestions?: number;
}

interface Question {
  id: string;
  question: string;
  type: string;
  correctAnswer?: string;
  points: number;
  order: number;
  options?: string;
  imageUrl?: string;
  sectionId?: string;
  groupId?: string;
}

interface Answer {
  id: string;
  attemptId: string;
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  pointsAwarded?: number;
  timeSpent?: number;
  answeredAt: string;
  question: Question;
}

interface StudentExamMarkingPageProps {
  attemptId: string;
}

export default function StudentExamMarkingPage({
  attemptId,
}: StudentExamMarkingPageProps) {
  const router = useRouter();

  // Data states
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showModelAnswer, setShowModelAnswer] = useState<{
    [key: string]: boolean;
  }>({});

  // Marking states (per question)
  const [marksInput, setMarksInput] = useState<{ [key: string]: string }>({});
  const [commentsInput, setCommentsInput] = useState<{ [key: string]: string }>(
    {}
  );
  const [savedStatus, setSavedStatus] = useState<{ [key: string]: boolean }>(
    {}
  );

  useEffect(() => {
    fetchAttemptData();
  }, [attemptId]);

  useEffect(() => {
    if (answers.length > 0) {
      initializeInputs();
    }
  }, [answers]);

  const fetchAttemptData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch attempt details and answers in parallel
      const [attemptData, answersData] = await Promise.all([
        examsApi.getAttemptById(attemptId),
        examsApi.getAttemptAnswers(attemptId),
      ]);

      setAttempt(attemptData);
      setAnswers(Array.isArray(answersData) ? answersData : []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load student exam data";
      setError(errorMessage);
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const initializeInputs = () => {
    const marks: { [key: string]: string } = {};
    const comments: { [key: string]: string } = {};
    const saved: { [key: string]: boolean } = {};

    answers.forEach((answer) => {
      marks[answer.id] =
        answer.pointsAwarded !== null && answer.pointsAwarded !== undefined
          ? answer.pointsAwarded.toString()
          : "";
      comments[answer.id] = ""; // Comments not in current schema, could add later
      saved[answer.id] =
        answer.pointsAwarded !== null && answer.pointsAwarded !== undefined;
    });

    setMarksInput(marks);
    setCommentsInput(comments);
    setSavedStatus(saved);
  };

  const handleSaveMarks = async (answerId: string, questionPoints: number) => {
    const marks = parseFloat(marksInput[answerId]);

    if (isNaN(marks) || marks < 0 || marks > questionPoints) {
      handleApiError(
        new Error(`Marks must be between 0 and ${questionPoints}`)
      );
      return;
    }

    try {
      setSaving(true);
      await examsApi.gradeAnswer(answerId, {
        pointsAwarded: marks,
        comments: commentsInput[answerId] || undefined,
      });

      // Update saved status
      setSavedStatus((prev) => ({ ...prev, [answerId]: true }));

      // Update the answer in state
      setAnswers((prev) =>
        prev.map((ans) =>
          ans.id === answerId ? { ...ans, pointsAwarded: marks } : ans
        )
      );

      // Refetch attempt to update total score
      const updatedAttempt = await examsApi.getAttemptById(attemptId);
      setAttempt(updatedAttempt);

      handleApiSuccess("Marks saved successfully");
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);

      for (const answer of answers) {
        const marks = parseFloat(marksInput[answer.id]);
        if (!isNaN(marks) && marks >= 0 && marks <= answer.question.points) {
          await examsApi.gradeAnswer(answer.id, {
            pointsAwarded: marks,
            comments: commentsInput[answer.id] || undefined,
          });
          setSavedStatus((prev) => ({ ...prev, [answer.id]: true }));
        }
      }

      // Refetch attempt to update total score
      const updatedAttempt = await examsApi.getAttemptById(attemptId);
      setAttempt(updatedAttempt);

      handleApiSuccess("All marks saved successfully");
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleMarksChange = (answerId: string, value: string) => {
    setMarksInput((prev) => ({ ...prev, [answerId]: value }));
    setSavedStatus((prev) => ({ ...prev, [answerId]: false }));
  };

  const handleCommentsChange = (answerId: string, value: string) => {
    setCommentsInput((prev) => ({ ...prev, [answerId]: value }));
  };

  const toggleModelAnswer = (answerId: string) => {
    setShowModelAnswer((prev) => ({ ...prev, [answerId]: !prev[answerId] }));
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < answers.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const calculateProgress = () => {
    const markedCount = answers.filter(
      (ans) => ans.pointsAwarded !== null && ans.pointsAwarded !== undefined
    ).length;
    return answers.length > 0 ? (markedCount / answers.length) * 100 : 0;
  };

  const getQuestionTypeBadge = (type: string) => {
    const types: { [key: string]: { label: string; color: string } } = {
      MULTIPLE_CHOICE: { label: "Multiple Choice", color: "bg-blue-500" },
      TRUE_FALSE: { label: "True/False", color: "bg-green-500" },
      SHORT_ANSWER: { label: "Short Answer", color: "bg-yellow-500" },
      ESSAY: { label: "Essay", color: "bg-purple-500" },
      MATCHING: { label: "Matching", color: "bg-pink-500" },
    };

    const typeInfo = types[type] || { label: type, color: "bg-gray-500" };
    return (
      <Badge className={`${typeInfo.color} text-white`}>{typeInfo.label}</Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading exam data...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !attempt) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
            <p className="text-muted-foreground mb-4">
              {error || "Failed to load exam attempt"}
            </p>
            <Button onClick={fetchAttemptData}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentAnswer = answers[currentQuestionIndex];
  const progress = calculateProgress();
  const markedCount = answers.filter(
    (ans) => ans.pointsAwarded !== null && ans.pointsAwarded !== undefined
  ).length;

  return (
    <div className="space-y-6">
      {/* Student Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {attempt.student.firstName} {attempt.student.lastName}
              </CardTitle>
              <CardDescription className="mt-2 space-y-1">
                <div className="flex items-center gap-4">
                  <span>
                    Grade:{" "}
                    {attempt.student.studentProfile?.grade?.name || "N/A"}
                  </span>
                  <span>
                    Student ID:{" "}
                    {attempt.student.studentProfile?.studentId || "N/A"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Submitted: {safeFormatDate(attempt.submittedAt, "PPp")}
                  </span>
                </div>
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold flex items-center gap-2">
                <Award className="h-6 w-6 text-yellow-500" />
                {attempt.totalScore?.toFixed(1) || "0.0"} / {attempt.maxScore}
              </div>
              <p className="text-sm text-muted-foreground">
                {attempt.percentage?.toFixed(1) || "0.0"}%
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Marking Progress</span>
              <span className="font-medium">
                {markedCount} / {answers.length} questions marked
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Question Marking Card */}
      {currentAnswer && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle>
                    Question {currentQuestionIndex + 1} of {answers.length}
                  </CardTitle>
                  {getQuestionTypeBadge(currentAnswer.question.type)}
                  {savedStatus[currentAnswer.id] && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Saved
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Worth {currentAnswer.question.points} point
                  {currentAnswer.question.points !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === answers.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Question Text */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Question:</Label>
              <div className="p-4 bg-muted rounded-lg">
                <div
                  dangerouslySetInnerHTML={{
                    __html: currentAnswer.question.question,
                  }}
                />
                {currentAnswer.question.imageUrl && (
                  <img
                    src={currentAnswer.question.imageUrl}
                    alt="Question"
                    className="mt-4 max-w-full rounded-lg"
                  />
                )}
              </div>
            </div>

            {/* Student's Answer */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Student's Answer:
              </Label>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                {currentAnswer.question.type === "SHORT_ANSWER" &&
                currentAnswer.answer.startsWith("http") ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Uploaded file:
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(currentAnswer.answer, "_blank")
                      }
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Uploaded File
                    </Button>
                  </div>
                ) : (
                  <div
                    dangerouslySetInnerHTML={{
                      __html:
                        currentAnswer.answer || "<em>No answer provided</em>",
                    }}
                  />
                )}
              </div>
            </div>

            {/* Model Answer Toggle */}
            {currentAnswer.question.correctAnswer && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleModelAnswer(currentAnswer.id)}
                >
                  {showModelAnswer[currentAnswer.id] ? (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      Hide Model Answer
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Show Model Answer
                    </>
                  )}
                </Button>
                {showModelAnswer[currentAnswer.id] && (
                  <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <Label className="text-sm font-semibold mb-2 block">
                      Model Answer:
                    </Label>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: currentAnswer.question.correctAnswer,
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Marking Section */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="marks">
                  Marks Awarded (Max: {currentAnswer.question.points})
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="marks"
                    type="number"
                    min={0}
                    max={currentAnswer.question.points}
                    step={0.5}
                    value={marksInput[currentAnswer.id] || ""}
                    onChange={(e) =>
                      handleMarksChange(currentAnswer.id, e.target.value)
                    }
                    placeholder="0.0"
                  />
                  <Button
                    onClick={() =>
                      handleSaveMarks(
                        currentAnswer.id,
                        currentAnswer.question.points
                      )
                    }
                    disabled={saving}
                    size="sm"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="comments">Comments (Optional)</Label>
                <Textarea
                  id="comments"
                  value={commentsInput[currentAnswer.id] || ""}
                  onChange={(e) =>
                    handleCommentsChange(currentAnswer.id, e.target.value)
                  }
                  placeholder="Add feedback for the student..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation & Actions */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveAll} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
