"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDisplayName } from "@/lib/utils/display";
import { prepareRichText } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Calendar,
  Clock,
  Target,
  Award,
  FileText,
  CheckCircle2,
  XCircle,
  ListOrdered,
  User,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { ApiClient } from "@/lib/api/api-client";

interface ExamQuestion {
  id: string;
  question: string;
  questionType: string;
  marks: number;
  order: number;
  part: number;
  options?: any;
  correctAnswer?: string;
  explanation?: string;
}

interface Creator {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ExamPreview {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  level: string;
  medium: string;
  examType: string;
  scheduledAt: string | null;
  publishAt: string | null;
  duration: number;
  passingScore: number;
  totalMarks: number;
  status: string;
  approvalStatus: string;
  allowLateSubmission: boolean;
  randomizeQuestions: boolean;
  showResults: boolean;
  enableRanking: boolean;
  creator: Creator;
  createdAt: string;
  questions: ExamQuestion[];
  part1Questions: number;
  part2Questions: number;
}

interface ExamPreviewModalProps {
  examId: string;
  open: boolean;
  onClose: () => void;
}

export default function ExamPreviewModal({
  examId,
  open,
  onClose,
}: ExamPreviewModalProps) {
  const [exam, setExam] = useState<ExamPreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && examId) {
      fetchExamPreview();
    }
  }, [open, examId]);

  const fetchExamPreview = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.get<ExamPreview>(
        `/api/v1/exams/${examId}/preview`
      );
      setExam(response);
    } catch (error) {
      console.error("Error fetching exam preview:", error);
      toast.error("Failed to load exam preview");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case "MCQ":
        return "Multiple Choice";
      case "MATCHING":
        return "Matching";
      case "FILL_IN_BLANK":
        return "Fill in the Blank";
      case "SUB_QUESTION":
        return "Sub-questions";
      case "SHORT_ANSWER":
        return "Short Answer";
      case "ESSAY":
        return "Essay";
      default:
        return type;
    }
  };

  const renderQuestionOptions = (question: ExamQuestion) => {
    if (question.questionType === "MCQ" && question.options) {
      const options = Array.isArray(question.options)
        ? question.options
        : typeof question.options === "string"
          ? JSON.parse(question.options)
          : question.options;

      return (
        <div className="mt-3 space-y-2">
          {options.map((option: any, idx: number) => {
            const isCorrect =
              option.isCorrect || option.text === question.correctAnswer;
            return (
              <div
                key={idx}
                className={`flex items-start gap-2 p-2 rounded-md ${
                  isCorrect ? "bg-green-50 border border-green-200" : "bg-muted"
                }`}
              >
                <span className="font-medium text-sm">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span className="flex-1 text-sm">{option.text || option}</span>
                {isCorrect && (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (question.questionType === "MATCHING" && question.options) {
      const pairs = Array.isArray(question.options)
        ? question.options
        : typeof question.options === "string"
          ? JSON.parse(question.options)
          : question.options;

      return (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Matching Pairs:
          </p>
          {pairs.map((pair: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2 bg-blue-50 rounded-md"
            >
              <span className="font-medium text-sm">{idx + 1}.</span>
              <span className="flex-1 text-sm">{pair.left}</span>
              <span className="text-muted-foreground">↔</span>
              <span className="flex-1 text-sm">{pair.right}</span>
            </div>
          ))}
        </div>
      );
    }

    if (question.questionType === "SUB_QUESTION" && question.options) {
      const subQuestions = Array.isArray(question.options)
        ? question.options
        : typeof question.options === "string"
          ? JSON.parse(question.options)
          : question.options;

      return (
        <div className="mt-3 space-y-3 ml-4">
          {subQuestions.map((sub: any, idx: number) => (
            <div key={idx} className="border-l-2 border-blue-300 pl-3">
              <p className="text-sm font-medium">
                {String.fromCharCode(97 + idx)}.{" "}
                <span
                  className="rich-text-content"
                  dangerouslySetInnerHTML={{
                    __html: prepareRichText(sub.question),
                  }}
                />
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Marks: {sub.marks}
              </p>
            </div>
          ))}
        </div>
      );
    }

    if (question.correctAnswer) {
      return (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm font-medium text-green-900">Correct Answer:</p>
          <p className="text-sm text-green-800 mt-1">
            {question.correctAnswer}
          </p>
        </div>
      );
    }

    return null;
  };

  const renderQuestions = (part: number) => {
    const partQuestions = exam?.questions.filter((q) => q.part === part) || [];
    if (partQuestions.length === 0) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Part {part} ({partQuestions.length} questions)
        </h3>
        {partQuestions.map((question, idx) => (
          <Card key={question.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">Q{idx + 1}</Badge>
                    <Badge variant="outline">
                      {getQuestionTypeIcon(question.questionType)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {question.marks} {question.marks === 1 ? "mark" : "marks"}
                    </span>
                  </div>
                  <div
                    className="text-sm font-medium mb-2 max-w-none rich-text-content"
                    dangerouslySetInnerHTML={{
                      __html: prepareRichText(question.question),
                    }}
                  />
                  {renderQuestionOptions(question)}
                  {question.explanation && (
                    <div className="mt-3 p-2 bg-blue-50 rounded-md">
                      <p className="text-xs font-medium text-blue-900">
                        Explanation:
                      </p>
                      <p className="text-xs text-blue-800 mt-1">
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Exam Preview
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading exam preview...</span>
          </div>
        ) : exam ? (
          <div className="h-[calc(90vh-8rem)] overflow-y-auto">
            <div className="space-y-6 pr-4">
              {/* Exam Details */}
              <Card>
                <CardHeader>
                  <CardTitle>{exam.title}</CardTitle>
                  {exam.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {exam.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Subject</p>
                        <p className="text-sm font-medium">
                          {getDisplayName(exam.subject)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Level</p>
                        <p className="text-sm font-medium">{exam.level}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Medium</p>
                        <p className="text-sm font-medium">
                          {getDisplayName(exam.medium)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Duration
                        </p>
                        <p className="text-sm font-medium">
                          {exam.duration} minutes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total Marks
                        </p>
                        <p className="text-sm font-medium">{exam.totalMarks}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Pass Score
                        </p>
                        <p className="text-sm font-medium">
                          {exam.passingScore}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Scheduled At
                        </p>
                        <p className="text-sm font-medium">
                          {formatDate(exam.scheduledAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Publish At
                        </p>
                        <p className="text-sm font-medium">
                          {formatDate(exam.publishAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        exam.allowLateSubmission ? "default" : "secondary"
                      }
                    >
                      {exam.allowLateSubmission ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : (
                        <XCircle className="mr-1 h-3 w-3" />
                      )}
                      Late Submission
                    </Badge>
                    <Badge
                      variant={
                        exam.randomizeQuestions ? "default" : "secondary"
                      }
                    >
                      {exam.randomizeQuestions ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : (
                        <XCircle className="mr-1 h-3 w-3" />
                      )}
                      Randomize Questions
                    </Badge>
                    <Badge variant={exam.showResults ? "default" : "secondary"}>
                      {exam.showResults ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : (
                        <XCircle className="mr-1 h-3 w-3" />
                      )}
                      Show Results
                    </Badge>
                    <Badge
                      variant={exam.enableRanking ? "default" : "secondary"}
                    >
                      {exam.enableRanking ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : (
                        <XCircle className="mr-1 h-3 w-3" />
                      )}
                      Enable Ranking
                    </Badge>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Created By
                      </p>
                      <p className="text-sm font-medium">
                        {exam.creator?.firstName || ""}{" "}
                        {exam.creator?.lastName || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {exam.creator?.email || ""}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Question Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListOrdered className="h-5 w-5" />
                    Question Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {exam.questions.length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total Questions
                      </p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {exam.part1Questions}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Part 1 (MCQ)
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {exam.part2Questions}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Part 2 (Subjective)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Questions */}
              {exam.part1Questions > 0 && (
                <>
                  {renderQuestions(1)}
                  <Separator />
                </>
              )}
              {exam.part2Questions > 0 && renderQuestions(2)}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Exam not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
