"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createLogger } from "@/lib/utils/logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Copy,
  Filter,
  Users,
  Calendar,
  ClipboardCheck,
  Plus,
} from "lucide-react";
import { examsApi } from "@/lib/api/endpoints/exams";
import { gradesApi } from "@/lib/api/endpoints/grades";
import { subjectsApi } from "@/lib/api/endpoints/subjects";
import { mediumsApi } from "@/lib/api/endpoints/mediums";
import { ApiClient } from "@/lib/api/api-client";
import { usersApi } from "@/lib/api/endpoints/users";
import { classesApi } from "@/lib/api/endpoints/classes";
import {
  GradeSelect,
  SubjectSelect,
  MediumSelect,
  PageHeader,
  LoadingSpinner,
  EmptyState,
  AutoStatusBadge,
} from "@/components/shared";
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

const getCreatorDisplayName = (
  creator?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
  },
  createdById?: string
) => {
  if (!creator && !createdById) return "-";
  if (creator) {
    const first = creator.firstName || "";
    const last = creator.lastName || "";
    const full = `${first} ${last}`.trim();
    if (full) return full;
    if (creator.name) return creator.name;
    if (creator.email) return creator.email;
  }
  return createdById || "-";
};

const logger = createLogger("ExamManagement");

interface Exam {
  id: string;
  title: string;
  type: string;
  status: string;
  approvalStatus: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalMarks: number;
  grade?: { id: string; name: string };
  gradeId?: string;
  subject?: { id: string; name: string };
  subjectId?: string;
  medium?: { id: string; name: string };
  mediumId?: string;
  creator?: { id: string; firstName: string; lastName: string };
  createdById?: string;
  class?: { id: string; name: string };
  classId?: string;
  _count?: {
    attempts: number;
    questions: number;
  };
}

export function ExamManagementPage() {
  const router = useRouter();

  // Filter states
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedMedium, setSelectedMedium] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedApprovalStatus, setSelectedApprovalStatus] =
    useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Data states
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const cacheRef = useRef({
    grades: new Map<string, any>(),
    subjects: new Map<string, any>(),
    mediums: new Map<string, any>(),
    users: new Map<string, any>(),
    classes: new Map<string, any>(),
  });

  // Prefetch master data (grades, mediums, subjects) to populate cache and avoid per-item calls
  useEffect(() => {
    const prefetch = async () => {
      try {
        // Get up to 500 items to ensure we have full list for small instance
        const [gradesRes, mediumsRes, classesRes] = await Promise.all([
          gradesApi.getAll({ limit: 500 }),
          mediumsApi.getAll({ limit: 500 }),
          classesApi.getAll({ limit: 500 }),
        ]);

        const allGrades = gradesRes?.grades || [];
        allGrades.forEach((g: any) => cacheRef.current.grades.set(g.id, g));

        // mediumsApi returns { mediums }
        const allMediums = mediumsRes?.mediums || [];
        const allClasses = classesRes?.data || classesRes?.classes || [];
        allMediums.forEach((m: any) => cacheRef.current.mediums.set(m.id, m));
        allClasses.forEach((c: any) => cacheRef.current.classes.set(c.id, c));

        // We don't need to prefetch subjects here as they were already being mapped successfully
        logger.debug("Prefetched metadata", {
          grades: allGrades.length,
          mediums: allMediums.length,
          classes: allClasses.length,
        });
      } catch (err) {
        // Prefetch failures are non-fatal
        logger.debug("Prefetch failed", err);
      }
    };
    prefetch();
  }, []);

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalNote, setApprovalNote] = useState("");

  // Fetch exams
  const fetchExams = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
      };

      if (selectedGrade && selectedGrade !== "clear")
        params.gradeId = selectedGrade;
      if (selectedSubject && selectedSubject !== "clear")
        params.subjectId = selectedSubject;
      if (selectedMedium && selectedMedium !== "clear")
        params.mediumId = selectedMedium;
      if (selectedType && selectedType !== "all") params.type = selectedType;
      if (selectedStatus && selectedStatus !== "all")
        params.status = selectedStatus;
      if (selectedApprovalStatus && selectedApprovalStatus !== "all")
        params.approvalStatus = selectedApprovalStatus;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      logger.debug("Fetching exams with filters:", params);

      const response = await examsApi.getAll(params);
      // Support multiple API shapes robustly (arrays and nested data)
      const raw = response as any;

      const examsData: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.data?.data)
            ? raw.data.data
            : raw?.exams || [];

      // If returned exams only have IDs for related fields, fetch related metadata
      const gradeIds = new Set<string>();
      const subjectIds = new Set<string>();
      const mediumIds = new Set<string>();
      const userIds = new Set<string>();
      const classIds = new Set<string>();
      examsData.forEach((e: any) => {
        if (!e.grade && e.gradeId && !cacheRef.current.grades.has(e.gradeId))
          gradeIds.add(e.gradeId);
        if (
          !e.subject &&
          e.subjectId &&
          !cacheRef.current.subjects.has(e.subjectId)
        )
          subjectIds.add(e.subjectId);
        if (
          !e.medium &&
          e.mediumId &&
          !cacheRef.current.mediums.has(e.mediumId)
        )
          mediumIds.add(e.mediumId);
        if (
          !e.creator &&
          e.createdById &&
          !cacheRef.current.users.has(e.createdById)
        )
          userIds.add(e.createdById);
        if (!e.class && e.classId && !cacheRef.current.classes.has(e.classId))
          classIds.add(e.classId);
      });

      // Fetch metadata in parallel (ignore failures)
      const [gradesArr, subjectsArr, mediumsArr, usersArr, classesArr] =
        await Promise.all([
          gradeIds.size
            ? Promise.all(
                [...gradeIds].map((id) =>
                  gradesApi.getOne(id).catch(() => null)
                )
              )
            : Promise.resolve([]),
          subjectIds.size
            ? Promise.all(
                [...subjectIds].map((id) =>
                  subjectsApi.findOne(id).catch(() => null)
                )
              )
            : Promise.resolve([]),
          mediumIds.size
            ? Promise.all(
                [...mediumIds].map((id) =>
                  mediumsApi.getOne(id).catch(() => null)
                )
              )
            : Promise.resolve([]),
          userIds.size
            ? Promise.all(
                [...userIds].map((id) => usersApi.getById(id).catch(() => null))
              )
            : Promise.resolve([]),
          classIds.size
            ? Promise.all(
                [...classIds].map((id) =>
                  classesApi.getById(id).catch(() => null)
                )
              )
            : Promise.resolve([]),
        ] as any);

      const unwrap = (obj: any) => {
        if (!obj) return null;
        if (obj?.data) return obj.data;
        if (obj?.grade) return obj.grade;
        if (obj?.subject) return obj.subject;
        if (obj?.medium) return obj.medium;
        if (obj?.class) return obj.class;
        if (obj?.user) return obj.user;
        return obj;
      };

      const gradeMap = new Map<string, any>();
      (gradesArr || []).forEach((g: any) => {
        const val = unwrap(g);
        if (val && val.id) {
          gradeMap.set(val.id, val);
          cacheRef.current.grades.set(val.id, val);
        }
      });
      const subjectMap = new Map<string, any>();
      (subjectsArr || []).forEach((s: any) => {
        const val = unwrap(s);
        if (val && val.id) {
          subjectMap.set(val.id, val);
          cacheRef.current.subjects.set(val.id, val);
        }
      });
      const mediumMap = new Map<string, any>();
      (mediumsArr || []).forEach((m: any) => {
        const val = unwrap(m);
        if (val && val.id) {
          mediumMap.set(val.id, val);
          cacheRef.current.mediums.set(val.id, val);
        }
      });
      const userMap = new Map<string, any>();
      (usersArr || []).forEach((u: any) => {
        const val = unwrap(u) || u;
        const userObj = val?.user || val;
        if (userObj && userObj.id) {
          userMap.set(userObj.id, userObj);
          cacheRef.current.users.set(userObj.id, userObj);
        }
      });
      const classMap = new Map<string, any>();
      (classesArr || []).forEach((c: any) => {
        const val = unwrap(c) || c;
        const cls = val?.class || val;
        if (cls && cls.id) {
          classMap.set(cls.id, cls);
          cacheRef.current.classes.set(cls.id, cls);
        }
      });

      // Attach human-readable objects where missing but IDs exist
      const mappedExams = (examsData || []).map((e: any) => ({
        ...e,
        grade:
          e.grade ||
          cacheRef.current.grades.get(e.gradeId || "") ||
          (e.gradeId ? gradeMap.get(e.gradeId) : undefined),
        subject:
          e.subject ||
          cacheRef.current.subjects.get(e.subjectId || "") ||
          (e.subjectId ? subjectMap.get(e.subjectId) : undefined),
        medium:
          e.medium ||
          cacheRef.current.mediums.get(e.mediumId || "") ||
          (e.mediumId ? mediumMap.get(e.mediumId) : undefined),
        creator:
          e.creator ||
          cacheRef.current.users.get(e.createdById || "") ||
          (e.createdById ? userMap.get(e.createdById) : undefined),
        class:
          e.class ||
          cacheRef.current.classes.get(e.classId || "") ||
          (e.classId ? classMap.get(e.classId) : undefined),
      }));

      logger.debug("Mapped exams (first 5):", mappedExams.slice(0, 5));
      setExams(mappedExams);

      const totalCount =
        raw?.pagination?.total ||
        raw?.data?.pagination?.total ||
        raw?.data?.total ||
        raw?.total ||
        (Array.isArray(raw) ? raw.length : examsData.length) ||
        0;

      setTotal(totalCount);
    } catch (error) {
      logger.error("Error fetching exams:", error);
      handleApiError(error, "Failed to fetch exams");
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [
    selectedGrade,
    selectedSubject,
    selectedMedium,
    selectedType,
    selectedStatus,
    selectedApprovalStatus,
    dateFrom,
    dateTo,
    page,
  ]);

  // useEffect(() => {
  //   fetchExams();
  // }, [
  //   selectedGrade,
  //   selectedSubject,
  //   selectedMedium,
  //   selectedType,
  //   selectedStatus,
  //   selectedApprovalStatus,
  //   dateFrom,
  //   dateTo,
  //   page,
  // ]);

  // const fetchExams = async () => {
  //   try {
  //     setLoading(true);
  //     const params: any = {
  //       page,
  //       limit,
  //     };

  //     if (selectedGrade && selectedGrade !== "clear")
  //       params.gradeId = selectedGrade;
  //     if (selectedSubject && selectedSubject !== "clear")
  //       params.subjectId = selectedSubject;
  //     if (selectedMedium && selectedMedium !== "clear")
  //       params.mediumId = selectedMedium;
  //     if (selectedType && selectedType !== "all") params.type = selectedType;
  //     if (selectedStatus && selectedStatus !== "all")
  //       params.status = selectedStatus;
  //     if (selectedApprovalStatus && selectedApprovalStatus !== "all")
  //       params.approvalStatus = selectedApprovalStatus;
  //     if (dateFrom) params.dateFrom = dateFrom;
  //     if (dateTo) params.dateTo = dateTo;

  //     logger.debug("Fetching exams with filters:", params);

  //     const response = await examsApi.getAll(params);
  //     setExams(Array.isArray(response) ? response : response.exams || []);
  //     setTotal(response.total || response.length || 0);
  //   } catch (error) {
  //     logger.error("Error fetching exams:", error);
  //     handleApiError(error, "Failed to fetch exams");
  //     setExams([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleApprove = async () => {
    if (!selectedExam) return;

    try {
      await examsApi.approveExam(selectedExam.id, {
        note: approvalNote || undefined,
      });
      handleApiSuccess("Exam approved successfully");
      setApproveDialogOpen(false);
      setApprovalNote("");
      setSelectedExam(null);
      // TODO: Implement refetch when using react-query
      // refetch();
    } catch (error) {
      handleApiError(error, "Failed to approve exam");
    }
  };

  const handleReject = async () => {
    if (!selectedExam || !rejectionReason.trim()) {
      handleApiError(null, "Please provide a rejection reason");
      return;
    }

    try {
      await examsApi.rejectExam(selectedExam.id, {
        reason: rejectionReason,
      });
      handleApiSuccess("Exam rejected");
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedExam(null);
      // TODO: Implement refetch when using react-query
      // refetch();
    } catch (error) {
      handleApiError(error, "Failed to reject exam");
    }
  };

  const handleDuplicate = async () => {
    if (!selectedExam) return;

    try {
      await examsApi.duplicateExam(selectedExam.id);
      handleApiSuccess("Exam duplicated as template");
      setDuplicateDialogOpen(false);
      setSelectedExam(null);
      // TODO: Implement refetch when using react-query
      // refetch();
    } catch (error) {
      handleApiError(error, "Failed to duplicate exam");
    }
  };

  const handleChangeVisibility = async (examId: string, visibility: string) => {
    try {
      await examsApi.updateVisibility(examId, { visibility });
      handleApiSuccess("Visibility updated");
      // TODO: Implement refetch when using react-query
      // refetch();
    } catch (error) {
      handleApiError(error, "Failed to update visibility");
    }
  };

  const getStatusBadge = (status: string) => {
    return <AutoStatusBadge status={status} />;
  };

  const getApprovalBadge = (approvalStatus: string) => {
    return <AutoStatusBadge status={approvalStatus} />;
  };

  const filteredExams = exams.filter((exam) => {
    if (!searchTerm) return true;
    return exam.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <PageHeader
          title="Exam Management"
          description="Manage, approve, and monitor all exams"
          icon={ClipboardCheck}
        />
        <Button onClick={() => router.push("/admin/exam-management/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Exam
        </Button>
      </div>

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Library ({filteredExams.length} exams)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner text="Loading exams..." className="py-8" />
          ) : filteredExams.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No exams found"
              description="No exams match your current filters. Try adjusting the filters or create a new exam."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Medium</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div>
                        <div className="font-semibold">{exam.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {exam.duration} min • {exam.totalMarks} marks
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {exam.grade?.name || exam.gradeId || "-"}
                    </TableCell>
                    <TableCell>{exam.subject?.name || "-"}</TableCell>
                    <TableCell>
                      {exam.medium?.name || exam.mediumId || "-"}
                    </TableCell>
                    <TableCell>
                      {exam.class?.name || exam.classId || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {exam.type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {safeFormatDate(exam.startTime, "PP")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {safeFormatDate(exam.startTime, "p")}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(exam.status)}</TableCell>
                    <TableCell>
                      {getApprovalBadge(exam.approvalStatus)}
                    </TableCell>
                    <TableCell>
                      {getCreatorDisplayName(exam.creator, exam.createdById)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {exam._count?.questions || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {exam._count?.attempts || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* View Details */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/exam-detail/${exam.id}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Approve */}
                        {exam.approvalStatus === "PENDING" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedExam(exam);
                              setApproveDialogOpen(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}

                        {/* Reject */}
                        {exam.approvalStatus === "PENDING" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedExam(exam);
                              setRejectDialogOpen(true);
                            }}
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        )}

                        {/* Duplicate */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedExam(exam);
                            setDuplicateDialogOpen(true);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, total)} of {total} exams
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page * limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Exam</DialogTitle>
            <DialogDescription>
              Approve "{selectedExam?.title}" for publication
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Exam</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting "{selectedExam?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Rejection Reason *</Label>
              <Input
                placeholder="Explain why this exam is being rejected"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
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

      {/* Duplicate Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Exam as Template</DialogTitle>
            <DialogDescription>
              Create a copy of "{selectedExam?.title}" as a reusable template
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will create a new exam with all questions and settings copied
              from the original. The new exam will be in DRAFT status.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDuplicateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleDuplicate}>Duplicate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
