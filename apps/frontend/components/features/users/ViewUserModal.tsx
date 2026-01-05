"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  Globe,
  GraduationCap,
  BookOpen,
  Award,
  Clock,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDisplayName } from "@/lib/utils/display";
import { format } from "date-fns";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
const logger = createLogger("ViewUserModal");

interface Subject {
  id: string;
  name: string;
  medium?: string;
}

interface Enrollment {
  id: string;
  classId: string;
  status: string;
  enrolledAt: string;
  progress: number;
  isPaid: boolean;
  class: {
    id: string;
    name: string;
    subject: {
      id: string;
      name: string;
    };
    grade: {
      id: string;
      name: string;
    };
    medium: {
      id: string;
      name: string;
    };
  };
}

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  medium?: string;
  institution?: string;
  studentProfile?: {
    grade?: string;
    batch?: { id: string; name: string } | string;
    enrollments?: any[];
  };
  teacherProfile?: {
    specialization?: string;
    experience?: number;
  };
  teachingSubjects?: Subject[];
}

interface ViewUserModalProps {
  open: boolean;
  user: UserData | null;
  onClose: () => void;
  onUserUpdated?: () => void;
}

const ViewUserModal: React.FC<ViewUserModalProps> = ({
  open,
  user,
  onClose,
  onUserUpdated,
}) => {
  const t = useTranslations("users");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [removingEnrollmentId, setRemovingEnrollmentId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (open && user && user.role.includes("STUDENT")) {
      fetchEnrollments();
    }
  }, [open, user]);

  const fetchEnrollments = async () => {
    if (!user) return;

    try {
      setLoadingEnrollments(true);
      const response = await ApiClient.get<any>(
        `/enrollments?studentId=${user.id}`
      );
      const enrollmentsData = Array.isArray(response)
        ? response
        : response.data
          ? response.data
          : [];
      setEnrollments(enrollmentsData);
    } catch (error) {
      logger.error("Error fetching enrollments:", error);
      handleApiError(
        error,
        "ViewUserModal.fetchEnrollments",
        "Failed to load enrollments"
      );
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const handleRemoveEnrollment = async (
    enrollmentId: string,
    className: string
  ) => {
    if (!confirm(t("modals.viewUser.confirmRemove", { className }))) {
      return;
    }

    try {
      setRemovingEnrollmentId(enrollmentId);
      await ApiClient.delete(`/enrollments/${enrollmentId}`);
      toast.success(t("modals.viewUser.removeSuccess"));
      fetchEnrollments();
      onUserUpdated?.();
    } catch (error) {
      logger.error("Error removing enrollment:", error);
      handleApiError(
        error,
        "ViewUserModal.handleRemoveEnrollment",
        "Failed to remove enrollment"
      );
    } finally {
      setRemovingEnrollmentId(null);
    }
  };

  if (!user) return null;

  const isStudent = user.role.includes("STUDENT");
  const isTeacher = user.role.includes("TEACHER");

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  const getRoleDisplay = (role: string) => {
    return role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("modals.viewUser.title")}</DialogTitle>
          <DialogDescription>
            {t("modals.viewUser.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              {t("modals.viewUser.basicInfo")}
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("modals.viewUser.firstName")}
                  </p>
                  <p className="font-medium">{user.firstName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("modals.viewUser.lastName")}
                  </p>
                  <p className="font-medium">{user.lastName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("modals.viewUser.email")}
                    </p>
                    <p className="font-medium break-all">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("modals.viewUser.phone")}
                    </p>
                    <p className="font-medium">
                      {user.phone || t("modals.viewUser.notProvided")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("modals.viewUser.role")}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {getRoleDisplay(user.role)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("modals.viewUser.status")}
                  </p>
                  <Badge
                    className={cn(
                      "mt-1",
                      user.status === "ACTIVE" && "bg-green-500",
                      user.status === "INACTIVE" && "bg-muted",
                      user.status === "PENDING" && "bg-yellow-500",
                      user.status === "SUSPENDED" && "bg-red-500"
                    )}
                  >
                    {user.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Globe className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("modals.viewUser.medium")}
                    </p>
                    <p className="font-medium">
                      {getDisplayName(user.medium) ||
                        t("modals.viewUser.notSpecified")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("modals.viewUser.institution")}
                    </p>
                    <p className="font-medium">
                      {user.institution || t("modals.viewUser.notSpecified")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("modals.viewUser.memberSince")}
                  </p>
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Student-specific information */}
          {isStudent && user.studentProfile && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  {t("modals.viewUser.studentInfo")}
                </h3>
                <div className="space-y-3">
                  {/* Registration Number - Prominent Display */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">
                      {t("modals.viewUser.registrationNumber")}
                    </p>
                    <p className="font-bold text-lg text-primary">
                      {(user.studentProfile as any).registrationNumber || t("modals.viewUser.notAssigned")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("modals.viewUser.grade")}
                      </p>
                      <p className="font-medium">
                        {user.studentProfile.grade
                          ? t("modals.viewUser.gradeValue", {
                              value: getDisplayName(user.studentProfile.grade),
                            })
                          : t("modals.viewUser.notAssigned")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("modals.viewUser.batch")}
                      </p>
                      <p className="font-medium">
                        {typeof user.studentProfile.batch === "object" &&
                        user.studentProfile.batch
                          ? user.studentProfile.batch.name ||
                            t("modals.viewUser.notAssigned")
                          : user.studentProfile.batch ||
                            t("modals.viewUser.notAssigned")}
                      </p>
                    </div>
                  </div>

                  {/* Detailed Enrollment Table */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold">
                        {t("modals.viewUser.classEnrollments")}
                      </p>
                      {loadingEnrollments && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>

                    {loadingEnrollments ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm">
                          {t("modals.viewUser.loadingEnrollments")}
                        </p>
                      </div>
                    ) : enrollments.length === 0 ? (
                      <div className="text-center py-8 border rounded-md bg-muted/30">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {t("modals.viewUser.noEnrollmentsFound")}
                        </p>
                      </div>
                    ) : (
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>
                                {t("modals.viewUser.enrollmentTable.class")}
                              </TableHead>
                              <TableHead>
                                {t("modals.viewUser.enrollmentTable.subject")}
                              </TableHead>
                              <TableHead>
                                {t("modals.viewUser.enrollmentTable.grade")}
                              </TableHead>
                              <TableHead>
                                {t("modals.viewUser.enrollmentTable.medium")}
                              </TableHead>
                              <TableHead>
                                {t("modals.viewUser.enrollmentTable.status")}
                              </TableHead>
                              <TableHead>
                                {t("modals.viewUser.enrollmentTable.progress")}
                              </TableHead>
                              <TableHead>
                                {t("modals.viewUser.enrollmentTable.payment")}
                              </TableHead>
                              <TableHead className="text-right">
                                {t("modals.viewUser.enrollmentTable.actions")}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {enrollments.map((enrollment) => (
                              <TableRow key={enrollment.id}>
                                <TableCell className="font-medium">
                                  {enrollment.class?.name || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {enrollment.class?.subject?.name || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {enrollment.class?.grade?.name || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {enrollment.class?.medium?.name || "N/A"}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      enrollment.status === "ACTIVE"
                                        ? "default"
                                        : enrollment.status === "COMPLETED"
                                          ? "default"
                                          : "secondary"
                                    }
                                    className={cn(
                                      enrollment.status === "ACTIVE" &&
                                        "bg-green-500",
                                      enrollment.status === "COMPLETED" &&
                                        "bg-blue-500"
                                    )}
                                  >
                                    {enrollment.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <ProgressBar
                                    value={Math.min(100, enrollment.progress)}
                                    size="sm"
                                    showLabel
                                    className="w-20"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      enrollment.isPaid ? "default" : "outline"
                                    }
                                    className={cn(
                                      enrollment.isPaid && "bg-green-500"
                                    )}
                                  >
                                    {enrollment.isPaid
                                      ? t("modals.viewUser.paid")
                                      : t("modals.viewUser.unpaid")}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveEnrollment(
                                        enrollment.id,
                                        enrollment.class?.name || "this class"
                                      )
                                    }
                                    disabled={
                                      removingEnrollmentId === enrollment.id
                                    }
                                    className="text-destructive hover:text-destructive"
                                  >
                                    {removingEnrollmentId === enrollment.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Teacher-specific information */}
          {isTeacher && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  {t("modals.viewUser.teacherInfo")}
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <Award className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t("modals.viewUser.specialization")}
                        </p>
                        <p className="font-medium">
                          {user.teacherProfile?.specialization ||
                            t("modals.viewUser.notSpecified")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t("modals.viewUser.experience")}
                        </p>
                        <p className="font-medium">
                          {user.teacherProfile?.experience
                            ? t("modals.viewUser.experienceYears", {
                                years: user.teacherProfile.experience,
                              })
                            : t("modals.viewUser.notSpecified")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {t("modals.viewUser.teachingSubjects")}
                    </p>
                    {user.teachingSubjects &&
                    user.teachingSubjects.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.teachingSubjects.map((subject) => (
                          <Badge key={subject.id} variant="secondary">
                            {subject.name}
                            {subject.medium && (
                              <span className="ml-1 text-xs opacity-75">
                                ({subject.medium})
                              </span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t("modals.viewUser.noSubjectsAssigned")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Additional Information */}
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {t("modals.viewUser.additionalInfo")}
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("modals.viewUser.userId")}
                </span>
                <span className="font-mono text-xs">{user.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("modals.viewUser.created")}
                </span>
                <span>{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewUserModal;
