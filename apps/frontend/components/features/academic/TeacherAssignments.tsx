import React, { useState, useEffect } from "react";
import { asApiError } from "@/lib/error-handling";
import { getDisplayName } from "@/lib/utils/display";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  GraduationCap,
  BookOpen,
  Languages,
  Calendar,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiClient } from "@/lib/api/api-client";
import { gradesApi } from "@/lib/api/endpoints/grades";
import { mediumsApi } from "@/lib/api/endpoints/mediums";
import { academicYearsApi } from "@/lib/api/endpoints/academic-years";

// Types
interface TeacherAssignment {
  id: string;
  teacherProfileId: string;
  subjectId: string;
  gradeId: string;
  mediumId: string;
  academicYear: string;
  isActive: boolean;
  createdAt: string;
  teacherProfile: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  subject: {
    id: string;
    name: string;
    code?: string;
  };
  grade: {
    id: string;
    name: string;
    code?: string;
  };
  medium: {
    id: string;
    name: string;
    code?: string;
  };
}

interface Teacher {
  id: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Subject {
  id: string;
  name: string;
  code?: string;
}

interface Grade {
  id: string;
  name: string;
  code?: string;
}

interface Medium {
  id: string;
  name: string;
  code?: string;
}

interface AcademicYear {
  id: string;
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
}

interface FilteredSubject extends Subject {
  assignedTeachers: number;
}

interface FilteredTeacher extends Teacher {
  canTeach: boolean;
}

interface TeacherCapability {
  grade: Grade;
  subjects: {
    subject: Subject;
    mediums: Medium[];
  }[];
}

// Assignment Card Component
const AssignmentCard = ({
  assignment,
  onEdit,
  onDelete,
  onView,
}: {
  assignment: TeacherAssignment;
  onEdit: (assignment: TeacherAssignment) => void;
  onDelete: (id: string) => void;
  onView: (assignment: TeacherAssignment) => void;
}) => {
  const teacherName = `${assignment.teacherProfile?.user?.firstName || ""} ${assignment.teacherProfile?.user?.lastName || "Unknown"}`;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{teacherName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {assignment.teacherProfile?.user?.email || ""}
            </p>
          </div>
          <Badge variant={assignment.isActive ? "default" : "secondary"}>
            {assignment.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <div>
              <p className="text-muted-foreground">Subject</p>
              <p className="font-medium">
                {getDisplayName(assignment.subject)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <div>
              <p className="text-muted-foreground">Grade</p>
              <p className="font-medium">{getDisplayName(assignment.grade)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-primary" />
            <div>
              <p className="text-muted-foreground">Medium</p>
              <p className="font-medium">{getDisplayName(assignment.medium)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <div>
              <p className="text-muted-foreground">Academic Year</p>
              <p className="font-medium">{assignment.academicYear}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(assignment)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(assignment)}
            className="flex-1"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(assignment.id)}
            className="flex-1 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Add/Edit Dialog
const AddEditAssignmentDialog = ({
  open,
  onOpenChange,
  onSave,
  editAssignment,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => Promise<void>;
  editAssignment: TeacherAssignment | null;
  isSubmitting: boolean;
}) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    teacherProfileId: "",
    subjectId: "",
    gradeId: "",
    mediumId: "",
    academicYear: "",
    isActive: true,
  });

  useEffect(() => {
    if (open) {
      fetchDropdownData();
    }
  }, [open]);

  useEffect(() => {
    if (editAssignment && academicYears.length > 0) {
      setFormData({
        teacherProfileId: editAssignment.teacherProfileId,
        subjectId: editAssignment.subjectId,
        gradeId: editAssignment.gradeId,
        mediumId: editAssignment.mediumId,
        academicYear: editAssignment.academicYear,
        isActive: editAssignment.isActive,
      });
    } else if (open && academicYears.length > 0) {
      // Set current academic year if available
      const currentAcademicYear = academicYears.find((ay) => ay.isCurrent);
      const defaultYear = currentAcademicYear?.year || "";

      setFormData({
        teacherProfileId: "",
        subjectId: "",
        gradeId: "",
        mediumId: "",
        academicYear: defaultYear,
        isActive: true,
      });
    }
  }, [editAssignment, open, academicYears]);

  const fetchDropdownData = async () => {
    try {
      setLoading(true);
      const [
        teachersRes,
        subjectsRes,
        gradesRes,
        mediumsRes,
        academicYearsRes,
      ] = await Promise.all([
        ApiClient.get<{ teachers: Teacher[] }>("/admin/teachers"),
        ApiClient.get<Subject[]>("/subjects?isActive=true"),
        gradesApi.getAll({ includeInactive: true }),
        mediumsApi.getAll({ includeInactive: true }),
        academicYearsApi.getAll({ includeInactive: true }),
      ]);

      setTeachers(
        Array.isArray(teachersRes?.teachers) ? teachersRes.teachers : []
      );
      setSubjects(Array.isArray(subjectsRes) ? subjectsRes : []);
      setGrades(Array.isArray(gradesRes?.grades) ? gradesRes.grades : []);
      setMediums(Array.isArray(mediumsRes?.mediums) ? mediumsRes.mediums : []);
      setAcademicYears(academicYearsRes?.academicYears || []);
    } catch (error) {
      toast.error("Failed to load form data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.teacherProfileId ||
      !formData.subjectId ||
      !formData.gradeId ||
      !formData.mediumId
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    await onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editAssignment ? "Edit Assignment" : "Create New Assignment"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teacher">Teacher *</Label>
            <Select
              value={formData.teacherProfileId}
              onValueChange={(value) =>
                setFormData({ ...formData, teacherProfileId: value })
              }
              disabled={isSubmitting || loading || !!editAssignment}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers
                  .filter((teacher) => teacher.id)
                  .map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.user.firstName} {teacher.user.lastName} (
                      {teacher.user.email})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Select
              value={formData.subjectId}
              onValueChange={(value) =>
                setFormData({ ...formData, subjectId: value })
              }
              disabled={isSubmitting || loading || !!editAssignment}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects
                  .filter((subject) => subject.id)
                  .map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} {subject.code && `(${subject.code})`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade">Grade *</Label>
            <Select
              value={formData.gradeId}
              onValueChange={(value) =>
                setFormData({ ...formData, gradeId: value })
              }
              disabled={isSubmitting || loading || !!editAssignment}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {grades
                  .filter((grade) => grade.id)
                  .map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name} {grade.code && `(${grade.code})`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medium">Medium *</Label>
            <Select
              value={formData.mediumId}
              onValueChange={(value) =>
                setFormData({ ...formData, mediumId: value })
              }
              disabled={isSubmitting || loading || !!editAssignment}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select medium" />
              </SelectTrigger>
              <SelectContent>
                {mediums
                  .filter((medium) => medium.id)
                  .map((medium) => (
                    <SelectItem key={medium.id} value={medium.id}>
                      {medium.name} {medium.code && `(${medium.code})`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="academicYear">Academic Year *</Label>
            <Select
              value={formData.academicYear}
              onValueChange={(value) =>
                setFormData({ ...formData, academicYear: value })
              }
              disabled={isSubmitting || loading || !!editAssignment}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((academicYear) => (
                  <SelectItem
                    key={academicYear.id}
                    value={academicYear.year.split("/")[0]}
                  >
                    {academicYear.year} {academicYear.isCurrent && "(Current)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked as boolean })
              }
              disabled={isSubmitting}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || loading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editAssignment ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Delete Confirmation Dialog
const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the teacher's assignment for this
            subject-grade-medium combination. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Main Component
const TeacherAssignments = () => {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [internalTeacherCount, setInternalTeacherCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<TeacherAssignment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchAssignments(), fetchInternalTeacherCount()]);
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.get<{ assignments: TeacherAssignment[] }>(
        "/admin/teacher-assignments"
      );
      setAssignments(Array.isArray(data?.assignments) ? data.assignments : []);
    } catch (error) {
      toast.error("Failed to load teacher assignments");
    } finally {
      setLoading(false);
    }
  };

  const fetchInternalTeacherCount = async () => {
    try {
      const data = await ApiClient.get<{
        data: { total: number; teachers: any[] };
      }>("/admin/teachers");
      // Backend returns { success: true, data: { total, teachers } }
      setInternalTeacherCount(data?.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch internal teacher count:", error);
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const teacherName =
      `${assignment.teacherProfile?.user?.firstName || ""} ${assignment.teacherProfile?.user?.lastName || ""}`.toLowerCase();
    const matchesSearch =
      teacherName.includes(searchQuery.toLowerCase()) ||
      (assignment.subject?.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (assignment.grade?.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && assignment.isActive) ||
      (statusFilter === "inactive" && !assignment.isActive);

    const matchesGrade =
      gradeFilter === "all" || assignment.gradeId === gradeFilter;

    const matchesSubject =
      subjectFilter === "all" || assignment.subjectId === subjectFilter;

    return matchesSearch && matchesStatus && matchesGrade && matchesSubject;
  });

  const handleAddAssignment = () => {
    setEditingAssignment(null);
    setIsAddDialogOpen(true);
  };

  const handleEditAssignment = (assignment: TeacherAssignment) => {
    setEditingAssignment(assignment);
    setIsAddDialogOpen(true);
  };

  const handleDeleteAssignment = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    try {
      setDeleting(true);
      await ApiClient.delete(`/admin/teacher-assignments/${deletingId}`);
      await fetchAssignments();
      toast.success("Assignment deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (error) {
      toast.error("Failed to delete assignment");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveAssignment = async (data: any) => {
    try {
      setSubmitting(true);
      if (editingAssignment) {
        // For updates, only send the updatable fields
        const updateData = {
          isActive: data.isActive,
          canCreateExams: data.canCreateExams,
          notes: data.notes,
        };
        await ApiClient.put(
          `/admin/teacher-assignments/${editingAssignment.id}`,
          updateData
        );
        toast.success("Assignment updated successfully");
      } else {
        await ApiClient.post("/admin/teacher-assignments", data);
        toast.success("Assignment created successfully");
      }
      await fetchAssignments();
      setIsAddDialogOpen(false);
      setEditingAssignment(null);
    } catch (error) {
      const message =
        asApiError(error).response?.data?.message ||
        "Failed to save assignment";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewAssignment = (assignment: TeacherAssignment) => {
    toast.info(
      `Viewing ${assignment.teacherProfile?.user?.firstName || ""} ${assignment.teacherProfile?.user?.lastName || "Unknown"}'s assignment`
    );
  };

  const uniqueGrades = Array.from(
    new Set(assignments.map((a) => a.grade?.id).filter(Boolean))
  )
    .map((id) => {
      const assignment = assignments.find((a) => a.grade?.id === id);
      return assignment?.grade;
    })
    .filter(Boolean) as Grade[];

  const uniqueSubjects = Array.from(
    new Set(assignments.map((a) => a.subject?.id).filter(Boolean))
  )
    .map((id) => {
      const assignment = assignments.find((a) => a.subject?.id === id);
      return assignment?.subject;
    })
    .filter(Boolean) as Subject[];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">
            Loading teacher assignments...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Teacher Assignments
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage teacher subject-grade-medium assignments
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {assignments.filter((a) => a.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inactive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {assignments.filter((a) => !a.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Internal Teachers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{internalTeacherCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by teacher, subject, or grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {uniqueGrades
                .filter((grade) => grade.id)
                .map((grade) => (
                  <SelectItem key={grade.id} value={grade.id}>
                    {grade.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {uniqueSubjects
                .filter((subject) => subject.id)
                .map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <div className="ml-auto">
            <Button onClick={handleAddAssignment} className="gap-2">
              <Plus className="h-4 w-4" />
              New Assignment
            </Button>
          </div>
        </div>

        {/* Assignments Grid */}
        {filteredAssignments.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No assignments found
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ||
                statusFilter !== "all" ||
                gradeFilter !== "all" ||
                subjectFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by creating your first teacher assignment"}
              </p>
              {!searchQuery &&
                statusFilter === "all" &&
                gradeFilter === "all" &&
                subjectFilter === "all" && (
                  <Button onClick={handleAddAssignment}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onEdit={handleEditAssignment}
                onDelete={handleDeleteAssignment}
                onView={handleViewAssignment}
              />
            ))}
          </div>
        )}

        {/* Dialogs */}
        <AddEditAssignmentDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSave={handleSaveAssignment}
          editAssignment={editingAssignment}
          isSubmitting={submitting}
        />

        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          isDeleting={deleting}
        />
      </div>
    </div>
  );
};

export default TeacherAssignments;
