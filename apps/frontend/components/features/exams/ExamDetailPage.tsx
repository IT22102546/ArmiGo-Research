"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  FileText,
  Calendar,
  Award,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  Shield,
  Lock,
  Camera,
  Ban,
  ChevronDown,
} from "lucide-react";
import { examsApi } from "@/lib/api/endpoints/exams";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
import { format } from "date-fns";
import { prepareRichText } from "@/lib/utils/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface ExamQuestion {
  id: string;
  questionText: string;
  type: string;
  marks: number;
  part: string;
  order: number;
  options?: any[];
}

interface ExamAttempt {
  id: string;
  status: string;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  student: {
    firstName: string;
    lastName: string;
  };
  proctoringEvents?: any[];
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  approvalStatus: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  attemptsAllowed: number;
  windowStart?: string;
  windowEnd?: string;
  aiMonitoringEnabled: boolean;
  faceVerificationRequired: boolean;
  browseLockEnabled: boolean;
  grade?: { id: string; name: string };
  subject?: { id: string; name: string };
  medium?: { id: string; name: string };
  class?: { id: string; name: string };
  creator?: { id: string; firstName: string; lastName: string };
  questions?: ExamQuestion[];
  attempts?: ExamAttempt[];
  rankings?: any[];
  _count?: {
    questions: number;
    attempts: number;
  };
}

// Component to display a single question with options and correct answer
function QuestionDisplay({
  question,
  index,
}: {
  question: any;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  // Parse options if they're stored as JSON string
  let options = question.options;
  if (typeof options === "string") {
    try {
      options = JSON.parse(options);
    } catch (e) {
      options = [];
    }
  }

  const getCorrectAnswer = () => {
    if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
      if (Array.isArray(options)) {
        const correctOpt = options.find((opt: any) =>
          typeof opt === "object"
            ? opt.isCorrect
            : opt === question.correctAnswer
        );
        return typeof correctOpt === "object" ? correctOpt.text : correctOpt;
      }
      return question.correctAnswer;
    }
    return question.correctAnswer;
  };

  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Badge variant="outline" className="font-mono">
            Q{question.order || index + 1}
          </Badge>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {question.type?.replace(/_/g, " ") || "Unknown"}
            </Badge>
            <Badge variant="outline">
              {question.points || question.marks || 0} marks
            </Badge>
          </div>

          <div
            className="rich-text-content prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: prepareRichText(
                question.questionText || question.question || ""
              ),
            }}
          />

          {/* Display options for MCQ/True-False */}
          {(question.type === "MULTIPLE_CHOICE" ||
            question.type === "TRUE_FALSE") &&
            Array.isArray(options) &&
            options.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Options:
                </div>
                <div className="space-y-1.5">
                  {options.map((opt: any, idx: number) => {
                    const optionText = typeof opt === "object" ? opt.text : opt;
                    const isCorrect =
                      typeof opt === "object"
                        ? opt.isCorrect
                        : opt === question.correctAnswer;

                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-2 p-2 rounded ${
                          isCorrect
                            ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                            : "bg-slate-50 dark:bg-slate-800"
                        }`}
                      >
                        <span className="font-mono text-sm text-muted-foreground">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <span className="flex-1">{optionText}</span>
                        {isCorrect && (
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Display correct answer for other types */}
          {question.type !== "MULTIPLE_CHOICE" &&
            question.type !== "TRUE_FALSE" &&
            question.correctAnswer && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Correct Answer:</span>
                </div>
                <div className="text-sm ml-6">
                  {question.type === "FILL_BLANK" &&
                  typeof question.correctAnswer === "string" &&
                  question.correctAnswer.startsWith("[")
                    ? JSON.parse(question.correctAnswer).join(", ")
                    : question.correctAnswer}
                </div>
              </div>
            )}

          {/* Show explanation if available */}
          {question.explanation && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
              <div className="text-sm font-medium mb-1">Explanation:</div>
              <div
                className="text-sm rich-text-content"
                dangerouslySetInnerHTML={{
                  __html: prepareRichText(question.explanation),
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ExamDetailPage({ id }: { id?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = id || searchParams?.get("id");

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionsByPart, setQuestionsByPart] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Collapsible state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [expandedParts, setExpandedParts] = useState<Set<string>>(
    new Set(["part1", "part2"])
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const togglePart = (partKey: string) => {
    setExpandedParts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(partKey)) {
        newSet.delete(partKey);
      } else {
        newSet.add(partKey);
      }
      return newSet;
    });
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [forceCloseDialogOpen, setForceCloseDialogOpen] = useState(false);
  const [visibilityDialogOpen, setVisibilityDialogOpen] = useState(false);

  const [approvalNote, setApprovalNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [forceCloseReason, setForceCloseReason] = useState("");
  const [newVisibility, setNewVisibility] = useState("");

  useEffect(() => {
    if (examId) {
      fetchExamDetails();
    }
  }, [examId]);

  const fetchExamDetails = async () => {
    if (!examId) return;

    try {
      setLoading(true);
      const response = await examsApi.getById(examId);
      setExam(response);
      // Fetch grouped questions separately so UI can show hierarchy when available
      try {
        const qResp = await examsApi.getExamQuestions(examId);
        setQuestionsByPart(qResp);
      } catch (e) {
        // ignore errors fetching questions; UI will fall back to exam.questions
        console.debug("Failed to fetch hierarchical questions", e);
        setQuestionsByPart(null);
      }
    } catch (error) {
      handleApiError(error, "Failed to fetch exam details");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!examId) return;

    try {
      await examsApi.approveExam(examId, {
        note: approvalNote || undefined,
      });
      handleApiSuccess("Exam approved successfully");
      setApproveDialogOpen(false);
      setApprovalNote("");
      fetchExamDetails();
    } catch (error) {
      handleApiError(error, "Failed to approve exam");
    }
  };

  const handleReject = async () => {
    if (!examId || !rejectionReason.trim()) {
      handleApiError(null, "Please provide a rejection reason");
      return;
    }

    try {
      await examsApi.rejectExam(examId, { reason: rejectionReason });
      handleApiSuccess("Exam rejected");
      setRejectDialogOpen(false);
      setRejectionReason("");
      fetchExamDetails();
    } catch (error) {
      handleApiError(error, "Failed to reject exam");
    }
  };

  const handleForceClose = async () => {
    if (!examId) return;

    try {
      await examsApi.forceCloseExam(examId, {
        reason: forceCloseReason || undefined,
      });
      handleApiSuccess("Exam force closed");
      setForceCloseDialogOpen(false);
      setForceCloseReason("");
      fetchExamDetails();
    } catch (error) {
      handleApiError(error, "Failed to force close exam");
    }
  };

  const handleUpdateVisibility = async () => {
    if (!examId || !newVisibility) return;

    try {
      await examsApi.updateVisibility(examId, { visibility: newVisibility });
      handleApiSuccess("Visibility updated");
      setVisibilityDialogOpen(false);
      setNewVisibility("");
      fetchExamDetails();
    } catch (error) {
      handleApiError(error, "Failed to update visibility");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">Exam not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/admin/exam-management")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Exam Library
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; className: string }> = {
      DRAFT: { variant: "outline", className: "bg-gray-100" },
      PENDING_APPROVAL: {
        variant: "outline",
        className: "bg-yellow-100 text-yellow-800",
      },
      APPROVED: { variant: "outline", className: "bg-blue-100 text-blue-800" },
      PUBLISHED: {
        variant: "default",
        className: "bg-green-100 text-green-800",
      },
      ACTIVE: { variant: "default", className: "bg-green-500" },
      COMPLETED: { variant: "outline", className: "bg-gray-400" },
      CANCELLED: { variant: "destructive", className: "" },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  const getApprovalBadge = (approvalStatus: string) => {
    const statusConfig: Record<string, { variant: any; className: string }> = {
      PENDING: {
        variant: "outline",
        className: "bg-yellow-100 text-yellow-800",
      },
      APPROVED: {
        variant: "outline",
        className: "bg-green-100 text-green-800",
      },
      REJECTED: { variant: "outline", className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[approvalStatus] || statusConfig.PENDING;
    return (
      <Badge variant={config.variant} className={config.className}>
        {approvalStatus}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/exam-management")}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exam Library
          </Button>
          <h1 className="text-3xl font-bold">{exam.title}</h1>
          <div className="flex items-center gap-2">
            {getStatusBadge(exam.status)}
            {getApprovalBadge(exam.approvalStatus)}
          </div>
        </div>

        {/* Admin Actions */}
        <div className="flex gap-2">
          {exam.approvalStatus === "PENDING" && (
            <>
              <Button
                onClick={() => setApproveDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => setRejectDialogOpen(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}

          {exam.status === "ACTIVE" && (
            <Button
              variant="outline"
              onClick={() => setForceCloseDialogOpen(true)}
            >
              <Ban className="h-4 w-4 mr-2" />
              Force Close
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => setVisibilityDialogOpen(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Change Visibility
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="questions">Sections & Questions</TabsTrigger>
          <TabsTrigger value="schedule">Schedule & Visibility</TabsTrigger>
          <TabsTrigger value="attempts">Attempts & Proctoring</TabsTrigger>
          <TabsTrigger value="rankings">Ranking & Results</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exam Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Type</div>
                  <div className="font-medium">
                    {exam.type.replace(/_/g, " ")}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="font-medium">{exam.duration} minutes</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Total Marks
                  </div>
                  <div className="font-medium">{exam.totalMarks}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Passing Marks
                  </div>
                  <div className="font-medium">{exam.passingMarks}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Attempts Allowed
                  </div>
                  <div className="font-medium">{exam.attemptsAllowed}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Grade</div>
                  <div className="font-medium">{exam.grade?.name || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Subject</div>
                  <div className="font-medium">{exam.subject?.name || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Medium</div>
                  <div className="font-medium">{exam.medium?.name || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Class</div>
                  <div className="font-medium">{exam.class?.name || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Sections</div>
                  <div className="font-medium">
                    {(exam as any)._count?.sections ||
                      (exam as any).sections?.length ||
                      0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                  <div className="font-medium">
                    {(exam as any)._count?.questions ||
                      (exam as any).questions?.length ||
                      0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Created By
                  </div>
                  <div className="font-medium">
                    {exam.creator
                      ? `${exam.creator.firstName} ${exam.creator.lastName}`
                      : "-"}
                  </div>
                </div>
              </div>

              {exam.description && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Description
                  </div>
                  <div className="text-sm">{exam.description}</div>
                </div>
              )}

              {/* Show sections if available */}
              {(exam as any).sections && (exam as any).sections.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-muted-foreground">
                      Exam Sections ({(exam as any).sections.length})
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (
                          expandedSections.size ===
                          (exam as any).sections.length
                        ) {
                          setExpandedSections(new Set());
                        } else {
                          setExpandedSections(
                            new Set(
                              (exam as any).sections.map((s: any) => s.id)
                            )
                          );
                        }
                      }}
                      className="h-8 text-xs"
                    >
                      {expandedSections.size === (exam as any).sections.length
                        ? "Collapse All"
                        : "Expand All"}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(exam as any).sections.map((section: any, idx: number) => {
                      const isExpanded = expandedSections.has(section.id);
                      return (
                        <div
                          key={section.id}
                          className="border rounded-lg overflow-hidden transition-all"
                        >
                          <div
                            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            onClick={() => toggleSection(section.id)}
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                            <Badge variant="outline" className="font-mono">
                              {idx + 1}
                            </Badge>
                            <div className="flex-1">
                              <div className="font-medium">{section.title}</div>
                            </div>
                            <Badge variant="secondary">
                              {section._count?.questions || 0} questions
                            </Badge>
                            <Badge variant="outline">
                              Part {section.examPart}
                            </Badge>
                          </div>
                          {isExpanded && section.description && (
                            <div className="px-3 pb-3 bg-white dark:bg-slate-950">
                              <div className="text-sm text-muted-foreground pt-2 border-t">
                                {section.description}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proctoring & Monitoring Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {exam.aiMonitoringEnabled ? (
                    <Shield className="h-5 w-5 text-green-600" />
                  ) : (
                    <Shield className="h-5 w-5 text-gray-400" />
                  )}
                  <span>
                    AI Monitoring:{" "}
                    {exam.aiMonitoringEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {exam.faceVerificationRequired ? (
                    <Camera className="h-5 w-5 text-green-600" />
                  ) : (
                    <Camera className="h-5 w-5 text-gray-400" />
                  )}
                  <span>
                    Face Verification:{" "}
                    {exam.faceVerificationRequired
                      ? "Required"
                      : "Not Required"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {exam.browseLockEnabled ? (
                    <Lock className="h-5 w-5 text-green-600" />
                  ) : (
                    <Lock className="h-5 w-5 text-gray-400" />
                  )}
                  <span>
                    Browse Lock:{" "}
                    {exam.browseLockEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>
                Sections & Questions (
                {exam._count?.questions || exam.questions?.length || 0})
              </CardTitle>
              <CardDescription>
                All sections and questions with correct answers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!(
                (questionsByPart &&
                  (questionsByPart.totalCount ||
                    Object.keys(questionsByPart?.parts || {}).length > 0)) ||
                (exam.questions && exam.questions.length > 0)
              ) ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No questions added yet</p>
                </div>
              ) : (
                <div>
                  {/* Summary Stats */}
                  {questionsByPart?.summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Part 1 Questions
                        </div>
                        <div className="text-2xl font-bold">
                          {questionsByPart.summary.part1Count}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {questionsByPart.summary.part1Points} marks
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Part 2 Questions
                        </div>
                        <div className="text-2xl font-bold">
                          {questionsByPart.summary.part2Count}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {questionsByPart.summary.part2Points} marks
                        </div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Total Questions
                        </div>
                        <div className="text-2xl font-bold">
                          {questionsByPart.summary.part1Count +
                            questionsByPart.summary.part2Count}
                        </div>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground">
                          Total Marks
                        </div>
                        <div className="text-2xl font-bold">
                          {questionsByPart.summary.part1Points +
                            questionsByPart.summary.part2Points}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* If we have hierarchical data grouped by part/section/group, render nested structure */}
                  {questionsByPart &&
                  questionsByPart.useHierarchicalStructure ? (
                    <div className="space-y-8">
                      {Object.entries(questionsByPart.parts || {}).map(
                        ([partKey, partValue]: any) => {
                          const isPartExpanded = expandedParts.has(partKey);
                          return (
                            <div
                              key={partKey}
                              className="border rounded-lg overflow-hidden"
                            >
                              <div
                                className="flex items-center gap-2 p-4 bg-slate-50 dark:bg-slate-900 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                onClick={() => togglePart(partKey)}
                              >
                                <ChevronDown
                                  className={`h-5 w-5 transition-transform duration-200 ${
                                    isPartExpanded ? "rotate-180" : ""
                                  }`}
                                />
                                <Badge
                                  variant="default"
                                  className="text-lg px-3 py-1"
                                >
                                  {partKey.replace(/part/i, "Part ")}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {partKey === "part1"
                                    ? "Auto-marked"
                                    : "Manual marking"}
                                </span>
                              </div>
                              {isPartExpanded && (
                                <div className="p-4">
                                  {Object.entries(partValue.sections || {}).map(
                                    ([sectionId, sectionValue]: any) => {
                                      const isSectionExpanded =
                                        expandedSections.has(sectionId);
                                      return (
                                        <div key={sectionId} className="mb-6">
                                          {sectionValue.section && (
                                            <div
                                              className="flex items-center gap-2 mb-3 p-3 bg-slate-50 dark:bg-slate-900 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                              onClick={() =>
                                                toggleSection(sectionId)
                                              }
                                            >
                                              <ChevronDown
                                                className={`h-4 w-4 transition-transform duration-200 ${
                                                  isSectionExpanded
                                                    ? "rotate-180"
                                                    : ""
                                                }`}
                                              />
                                              <FileText className="h-5 w-5" />
                                              <div className="flex-1">
                                                <div className="font-semibold">
                                                  {sectionValue.section.title}
                                                </div>
                                                {sectionValue.section
                                                  .description && (
                                                  <div className="text-sm text-muted-foreground">
                                                    {
                                                      sectionValue.section
                                                        .description
                                                    }
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                          {isSectionExpanded && (
                                            <div className="ml-4">
                                              {Object.entries(
                                                sectionValue.groups || {}
                                              ).map(
                                                ([
                                                  groupId,
                                                  groupValue,
                                                ]: any) => {
                                                  const isGroupExpanded =
                                                    expandedGroups.has(groupId);
                                                  return (
                                                    <div
                                                      key={groupId}
                                                      className="mb-4"
                                                    >
                                                      {groupValue.group && (
                                                        <div
                                                          className="flex items-center gap-2 font-medium text-sm mb-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                                                          onClick={() =>
                                                            toggleGroup(groupId)
                                                          }
                                                        >
                                                          <ChevronDown
                                                            className={`h-4 w-4 transition-transform duration-200 ${
                                                              isGroupExpanded
                                                                ? "rotate-180"
                                                                : ""
                                                            }`}
                                                          />
                                                          <span className="text-muted-foreground">
                                                            📁{" "}
                                                            {
                                                              groupValue.group
                                                                .title
                                                            }
                                                          </span>
                                                        </div>
                                                      )}
                                                      {isGroupExpanded && (
                                                        <div className="space-y-4 ml-6">
                                                          {groupValue.questions.map(
                                                            (
                                                              question: any,
                                                              qIdx: number
                                                            ) => (
                                                              <QuestionDisplay
                                                                key={
                                                                  question.id
                                                                }
                                                                question={
                                                                  question
                                                                }
                                                                index={qIdx}
                                                              />
                                                            )
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                }
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : questionsByPart &&
                    !questionsByPart.useHierarchicalStructure ? (
                    // Non-hierarchical but grouped by part (flat arrays for part1/part2)
                    <div className="space-y-6">
                      {["part1", "part2"].map((partKey) => {
                        const list = questionsByPart[partKey] || [];
                        if (list.length === 0) return null;
                        const isPartExpanded = expandedParts.has(partKey);
                        return (
                          <div
                            key={partKey}
                            className="border rounded-lg overflow-hidden"
                          >
                            <div
                              className="flex items-center gap-2 p-4 bg-slate-50 dark:bg-slate-900 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              onClick={() => togglePart(partKey)}
                            >
                              <ChevronDown
                                className={`h-5 w-5 transition-transform duration-200 ${
                                  isPartExpanded ? "rotate-180" : ""
                                }`}
                              />
                              <Badge
                                variant="default"
                                className="text-lg px-3 py-1"
                              >
                                {partKey.replace(/part/i, "Part ")}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {partKey === "part1"
                                  ? "Auto-marked"
                                  : "Manual marking"}
                              </span>
                              <Badge variant="outline" className="ml-auto">
                                {list.length} questions
                              </Badge>
                            </div>
                            {isPartExpanded && (
                              <div className="p-4 space-y-4">
                                {list.map((q: any, qIdx: number) => (
                                  <QuestionDisplay
                                    key={q.id}
                                    question={q}
                                    index={qIdx}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Default flat list from exam.questions
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Part</TableHead>
                          <TableHead>Question</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Marks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(exam.questions || []).map((question) => (
                          <TableRow key={question.id}>
                            <TableCell>{question.order}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{question.part}</Badge>
                            </TableCell>
                            <TableCell className="max-w-md">
                              <span
                                className="rich-text-content"
                                dangerouslySetInnerHTML={{
                                  __html: prepareRichText(
                                    question.questionText ?? (question as any).question ?? ""
                                  ),
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {question.type.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>{question.marks}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule & Visibility Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exam Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Start Time
                  </div>
                  <div className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {safeFormatDate(exam.startTime)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">End Time</div>
                  <div className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {safeFormatDate(exam.endTime)}
                  </div>
                </div>
                {exam.windowStart && (
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Window Start
                    </div>
                    <div className="font-medium">
                      {safeFormatDate(exam.windowStart)}
                    </div>
                  </div>
                )}
                {exam.windowEnd && (
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Window End
                    </div>
                    <div className="font-medium">
                      {safeFormatDate(exam.windowEnd)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visibility & Audience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Target audience settings will be displayed here based on class
                assignment and visibility settings
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attempts Tab */}
        <TabsContent value="attempts">
          <Card>
            <CardHeader>
              <CardTitle>
                Exam Attempts (
                {exam._count?.attempts || exam.attempts?.length || 0})
              </CardTitle>
              <CardDescription>
                Student attempts and proctoring events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!exam.attempts || exam.attempts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No attempts yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started At</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Issues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exam.attempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell>
                          {attempt.student.firstName} {attempt.student.lastName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{attempt.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {safeFormatDate(attempt.startedAt)}
                        </TableCell>
                        <TableCell>
                          {attempt.submittedAt
                            ? safeFormatDate(attempt.submittedAt)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {attempt.score !== undefined ? attempt.score : "-"}
                        </TableCell>
                        <TableCell>
                          {attempt.proctoringEvents &&
                          attempt.proctoringEvents.length > 0 ? (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {attempt.proctoringEvents.length}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600">
                              Clean
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rankings Tab */}
        <TabsContent value="rankings">
          <Card>
            <CardHeader>
              <CardTitle>Rankings & Results</CardTitle>
              <CardDescription>
                {exam.status === "COMPLETED"
                  ? "View exam rankings and statistics"
                  : "Rankings will be available once the exam is completed"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {exam.status !== "COMPLETED" ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Rankings will be available after exam completion</p>
                </div>
              ) : !exam.rankings || exam.rankings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No rankings data available</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exam.rankings.map((ranking: any, index: number) => (
                      <TableRow key={ranking.id}>
                        <TableCell>
                          <Badge variant="outline">#{index + 1}</Badge>
                        </TableCell>
                        <TableCell>
                          {ranking.student?.firstName}{" "}
                          {ranking.student?.lastName}
                        </TableCell>
                        <TableCell>
                          {ranking.score} / {exam.totalMarks}
                        </TableCell>
                        <TableCell>
                          {((ranking.score / exam.totalMarks) * 100).toFixed(2)}
                          %
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Exam</DialogTitle>
            <DialogDescription>
              Approve "{exam.title}" for publication
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Approval Note (Optional)</Label>
              <Input
                placeholder="Add any notes or comments"
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleApprove}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Exam</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting "{exam.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Rejection Reason *</Label>
              <Textarea
                placeholder="Explain why this exam is being rejected"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={forceCloseDialogOpen}
        onOpenChange={setForceCloseDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Close Exam</DialogTitle>
            <DialogDescription>
              Force close "{exam.title}" immediately. This will end all active
              attempts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Reason (Optional)</Label>
              <Textarea
                placeholder="Explain why this exam is being force closed"
                value={forceCloseReason}
                onChange={(e) => setForceCloseReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setForceCloseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleForceClose}>
              Force Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={visibilityDialogOpen}
        onOpenChange={setVisibilityDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Visibility</DialogTitle>
            <DialogDescription>
              Update who can see "{exam.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Visibility</Label>
              <Select value={newVisibility} onValueChange={setNewVisibility}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal Only</SelectItem>
                  <SelectItem value="external">External Only</SelectItem>
                  <SelectItem value="both">Both Internal & External</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVisibilityDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateVisibility} disabled={!newVisibility}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
