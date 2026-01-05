"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  User,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getDisplayName } from "@/lib/utils/display";
import { ApiClient } from "@/lib/api/api-client";
import ExamPreviewModal from "./ExamPreviewModal";
import ApproveExamDialog from "./ApproveExamDialog";
import RejectExamDialog from "./RejectExamDialog";

interface Creator {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface PendingExam {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  level: string;
  medium: string;
  examType: string;
  scheduledAt: string | null;
  duration: number;
  passingScore: number;
  totalMarks: number;
  status: string;
  approvalStatus: string;
  creator: Creator;
  createdAt: string;
  _count?: {
    questions: number;
  };
}

interface PaginatedResponse {
  exams: PendingExam[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ExamApprovalQueue() {
  const [exams, setExams] = useState<PendingExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Modal states
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  useEffect(() => {
    fetchPendingExams();
  }, [page]);

  const fetchPendingExams = async () => {
    try {
      setLoading(true);
      const response: any = await ApiClient.get(
        `/api/v1/exams/pending-approval?page=${page}&limit=${limit}`
      );

      // Backend returns array directly, not paginated
      const examsArray = Array.isArray(response) ? response : [];
      setExams(examsArray);
      setTotal(examsArray.length);
      setTotalPages(1);
    } catch (error) {
      console.error("Error fetching pending exams:", error);
      toast.error("Failed to load pending exams");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (examId: string) => {
    setSelectedExamId(examId);
    setPreviewOpen(true);
  };

  const handleApprove = (examId: string) => {
    setSelectedExamId(examId);
    setApproveDialogOpen(true);
  };

  const handleReject = (examId: string) => {
    setSelectedExamId(examId);
    setRejectDialogOpen(true);
  };

  const onApproveSuccess = () => {
    setApproveDialogOpen(false);
    setSelectedExamId(null);
    fetchPendingExams();
    toast.success("Exam approved successfully");
  };

  const onRejectSuccess = () => {
    setRejectDialogOpen(false);
    setSelectedExamId(null);
    fetchPendingExams();
    toast.success("Exam rejected");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not scheduled";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getApprovalStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            <Clock className="mr-1 h-3 w-3" />
            Pending Review
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading exams...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              Exam Approval Queue
            </CardTitle>
            <Badge variant="secondary" className="text-sm">
              {total} Pending {total === 1 ? "Exam" : "Exams"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                No exams pending approval
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                All exams have been reviewed
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam Details</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Subject & Level</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exams.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{exam.title}</p>
                            {exam.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {exam.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {exam.examType}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {exam.duration} min • {exam.totalMarks} marks
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {exam.creator?.firstName || ""}{" "}
                                {exam.creator?.lastName || "Unknown"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {exam.creator?.email || ""}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {getDisplayName(exam.subject)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {exam.level} • {getDisplayName(exam.medium)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formatDate(exam.scheduledAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {exam._count?.questions || 0} Questions
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getApprovalStatusBadge(exam.approvalStatus)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(exam.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(exam.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(exam.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} • Total: {total} exams
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedExamId && (
        <>
          <ExamPreviewModal
            examId={selectedExamId}
            open={previewOpen}
            onClose={() => {
              setPreviewOpen(false);
              setSelectedExamId(null);
            }}
          />
          <ApproveExamDialog
            examId={selectedExamId}
            open={approveDialogOpen}
            onClose={() => {
              setApproveDialogOpen(false);
              setSelectedExamId(null);
            }}
            onSuccess={onApproveSuccess}
          />
          <RejectExamDialog
            examId={selectedExamId}
            open={rejectDialogOpen}
            onClose={() => {
              setRejectDialogOpen(false);
              setSelectedExamId(null);
            }}
            onSuccess={onRejectSuccess}
          />
        </>
      )}
    </>
  );
}
