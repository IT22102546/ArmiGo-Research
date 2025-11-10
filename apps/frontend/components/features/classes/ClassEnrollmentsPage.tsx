"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Users,
  UserPlus,
  UserMinus,
  Search,
  Mail,
  Phone,
} from "lucide-react";
import { classesApi } from "@/lib/api/endpoints/classes";
import { handleApiError } from "@/lib/error-handling";
import { format } from "date-fns";

const safeFormatDate = (value?: string | Date | null, fmt = "PPp") => {
  if (!value) return "-";
  let d: Date;
  try {
    d = typeof value === "string" ? new Date(value) : (value as Date);
  } catch (e) {
    return "-";
  }
  if (!d || Number.isNaN(d.getTime())) return "-";
  try {
    return format(d, fmt);
  } catch (e) {
    return "-";
  }
};

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  studentProfile?: {
    registrationNumber?: string;
    grade?: {
      name: string;
    };
  };
}

interface Enrollment {
  id: string;
  studentId: string;
  status: string;
  enrolledAt: string;
  progress: number;
  isPaid: boolean;
  student: Student;
}

interface ClassDetail {
  id: string;
  name: string;
  maxStudents?: number;
  grade?: {
    id: string;
    name: string;
  };
  subject?: {
    name: string;
  };
}

export function ClassEnrollmentsPage({ classId }: { classId: string }) {
  const router = useRouter();
  const t = useTranslations("classes");
  const tc = useTranslations("common");
  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [unenrollDialogOpen, setUnenrollDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<Enrollment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  useEffect(() => {
    fetchClassDetail();
    fetchEnrollments();
  }, [classId]);

  const fetchClassDetail = async () => {
    try {
      const response = await classesApi.getById(classId);
      setClassDetail(response);
    } catch (error) {
      handleApiError(error, "Failed to fetch class details");
    }
  };

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await classesApi.getEnrolledStudents(classId);
      setEnrollments(
        Array.isArray(response)
          ? response
          : response.students?.map((s: any) => ({
              id: s.enrollmentId || s.id,
              studentId: s.id,
              status: s.enrollmentStatus || "ACTIVE",
              enrolledAt: s.enrolledAt || new Date().toISOString(),
              progress: s.progress || 0,
              isPaid: s.isPaid || false,
              student: s,
            })) || []
      );
    } catch (error) {
      handleApiError(error, "Failed to fetch enrollments");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const response = await classesApi.getStudentsList(classDetail?.grade?.id);
      const enrolledIds = new Set(enrollments.map((e) => e.studentId));
      const available = (
        Array.isArray(response) ? response : response.students || []
      ).filter((s: Student) => !enrolledIds.has(s.id));
      setAvailableStudents(available);
    } catch (error) {
      handleApiError(error, "Failed to fetch available students");
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedStudentId) return;
    try {
      await classesApi.enrollStudent(classId, {
        studentId: selectedStudentId,
        isPaid: false,
      });
      setEnrollDialogOpen(false);
      setSelectedStudentId("");
      fetchEnrollments();
    } catch (error) {
      handleApiError(error, "Failed to enroll student");
    }
  };

  const handleUnenrollStudent = async () => {
    if (!selectedEnrollment) return;
    try {
      await classesApi.unenrollStudent(classId, selectedEnrollment.studentId);
      setUnenrollDialogOpen(false);
      setSelectedEnrollment(null);
      fetchEnrollments();
    } catch (error) {
      handleApiError(error, "Failed to unenroll student");
    }
  };

  const openEnrollDialog = () => {
    fetchAvailableStudents();
    setEnrollDialogOpen(true);
  };

  const openUnenrollDialog = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setUnenrollDialogOpen(true);
  };

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const student = enrollment.student;
    const searchLower = searchTerm.toLowerCase();
    return (
      student.firstName.toLowerCase().includes(searchLower) ||
      student.lastName.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower) ||
      student.studentProfile?.registrationNumber
        ?.toLowerCase()
        .includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "APPROVED":
        return <Badge className="bg-green-500">{t("statusActive")}</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500">{t("statusPending")}</Badge>;
      case "COMPLETED":
        return <Badge className="bg-blue-500">{t("statusCompleted")}</Badge>;
      case "CANCELLED":
      case "DROPPED":
        return <Badge className="bg-red-500">{t("statusCancelled")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/class-management")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToClasses")}
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {t("enrollments")}
            </h2>
            {classDetail && (
              <p className="text-muted-foreground">
                {classDetail.name} - {classDetail.grade?.name} -{" "}
                {classDetail.subject?.name}
              </p>
            )}
          </div>
        </div>
        <Button onClick={openEnrollDialog}>
          <UserPlus className="mr-2 h-4 w-4" />
          {t("enrollStudent")}
        </Button>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalEnrolled")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length}</div>
            {classDetail?.maxStudents && (
              <p className="text-xs text-muted-foreground mt-1">
                {t("ofMaxStudents", { max: classDetail.maxStudents })}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("activeStudents")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                enrollments.filter(
                  (e) => e.status === "ACTIVE" || e.status === "APPROVED"
                ).length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("availableSlots")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classDetail?.maxStudents
                ? classDetail.maxStudents - enrollments.length
                : t("unlimited")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchStudentsPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Enrollments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            {t("enrolledStudents")}
          </CardTitle>
          <CardDescription>{t("manageEnrollmentsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? t("noStudentsMatchingSearch")
                : t("noStudentsEnrolled")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("regNumber")}</TableHead>
                  <TableHead>{tc("name")}</TableHead>
                  <TableHead>{tc("email")}</TableHead>
                  <TableHead>{t("phone")}</TableHead>
                  <TableHead>{t("grade")}</TableHead>
                  <TableHead>{t("enrolledDate")}</TableHead>
                  <TableHead>{t("progress")}</TableHead>
                  <TableHead>{tc("status")}</TableHead>
                  <TableHead>{t("paid")}</TableHead>
                  <TableHead className="text-right">{tc("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      {enrollment.student.studentProfile?.registrationNumber ||
                        "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {enrollment.student.firstName}{" "}
                      {enrollment.student.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Mail className="mr-1 h-3 w-3 text-muted-foreground" />
                        {enrollment.student.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Phone className="mr-1 h-3 w-3 text-muted-foreground" />
                        {enrollment.student.phoneNumber || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {enrollment.student.studentProfile?.grade?.name || "-"}
                    </TableCell>
                    <TableCell>
                      {safeFormatDate(enrollment.enrolledAt, "PP")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {t("progressComplete", {
                            percent: enrollment.progress,
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={enrollment.isPaid ? "default" : "outline"}
                      >
                        {enrollment.isPaid
                          ? t("paidStatus")
                          : t("unpaidStatus")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openUnenrollDialog(enrollment)}
                      >
                        <UserMinus className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Enroll Student Dialog */}
      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("enrollStudent")}</DialogTitle>
            <DialogDescription>{t("selectStudentToEnroll")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="student">{t("student")}</Label>
              <select
                id="student"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("selectStudentToEnroll")}
              >
                <option value="">{t("selectAStudent")}</option>
                {availableStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} ({student.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEnrollDialogOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button onClick={handleEnrollStudent} disabled={!selectedStudentId}>
              {t("enroll")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unenroll Dialog */}
      <Dialog open={unenrollDialogOpen} onOpenChange={setUnenrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("unenrollStudent")}</DialogTitle>
            <DialogDescription>
              {t("confirmUnenroll", {
                firstName: selectedEnrollment?.student.firstName || "",
                lastName: selectedEnrollment?.student.lastName || "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnenrollDialogOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleUnenrollStudent}>
              {t("unenroll")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
