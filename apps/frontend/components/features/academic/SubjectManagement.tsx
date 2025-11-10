// apps/frontend/components/dashboard/subjects/DashSubjects.tsx - FIXED
import React, { useState, useEffect } from "react";
import { asApiError } from "@/lib/error-handling";
import { gradesApi } from "@/lib/api/endpoints/grades";
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
  ArrowLeft,
  Search,
  Filter,
  Plus,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
  XCircle,
  Loader2,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  subjectsApi,
  CreateSubjectDto,
  UpdateSubjectDto,
  SubjectGradeAssignment,
  Grade,
} from "@/lib/api/endpoints/subjects";

// Types
interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  category?: string;
  isActive: boolean;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  gradeSubjects?: {
    gradeId: string;
    subjectId: string;
    isActive: boolean;
    medium?: string;
    grade: {
      id: string;
      name: string;
      code?: string;
    };
  }[];
  gradeAssignments?: SubjectGradeAssignment[];
}

interface StatusBadgeProps {
  status: boolean;
}

interface SubjectTableRowProps {
  subject: Subject;
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
  onView: (subject: Subject) => void;
  onManageGrades?: (subject: Subject) => void;
}

interface SubjectTableProps {
  subjects: Subject[];
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
  onView: (subject: Subject) => void;
  onManageGrades?: (subject: Subject) => void;
}

interface AddEditSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (subjectData: CreateSubjectDto | UpdateSubjectDto) => void;
  editSubject: Subject | null;
  isSubmitting: boolean;
  grades: Grade[];
  gradesLoading?: boolean;
}

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

// Status Badge Component
const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <span
      className={cn(
        "px-3 py-1 rounded-md text-xs font-medium inline-block",
        status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      )}
    >
      {status ? "Active" : "Inactive"}
    </span>
  );
};

// Grade Assignment Badge Component
const GradeAssignmentBadge = ({
  assignments,
}: {
  assignments?: SubjectGradeAssignment[];
}) => {
  if (!assignments || assignments.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">No grades assigned</span>
    );
  }

  const activeAssignments = assignments.filter((a) => a.isActive !== false);

  return (
    <div className="flex flex-wrap gap-1">
      {activeAssignments.slice(0, 3).map((assignment, index) => (
        <span
          key={assignment.id || index}
          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
        >
          {assignment.grade?.name} ({assignment.medium})
        </span>
      ))}
      {activeAssignments.length > 3 && (
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
          +{activeAssignments.length - 3} more
        </span>
      )}
    </div>
  );
};

// Subject Table Row Component
const SubjectTableRow = ({
  subject,
  onEdit,
  onDelete,
  onView,
  onManageGrades,
}: SubjectTableRowProps) => {
  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="p-4">
        <Checkbox />
      </td>
      <td className="p-4 font-medium text-foreground">{subject.name}</td>
      <td className="p-4 text-foreground">{subject.code || "N/A"}</td>
      <td className="p-4">
        <StatusBadge status={subject.isActive} />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onView(subject)}
            className="h-8 w-8"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {onManageGrades && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onManageGrades(subject)}
              className="h-8 w-8"
              title="Manage grade assignments"
            >
              <BookOpen className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(subject)}
            className="h-8 w-8"
            title="Edit subject"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(subject.id)}
            className="h-8 w-8 text-destructive hover:text-destructive"
            title="Delete subject"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

// Subject Table Component
const SubjectTable = ({
  subjects,
  onEdit,
  onDelete,
  onView,
  onManageGrades,
}: SubjectTableProps) => {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr className="border-b border-border">
            <th className="p-4 text-left">
              <Checkbox />
            </th>
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">
              Subject Name
            </th>
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">
              Code
            </th>
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">
              Status
            </th>
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject) => (
            <SubjectTableRow
              key={subject.id}
              subject={subject}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              onManageGrades={onManageGrades}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Add/Edit Subject Dialog Component
const AddEditSubjectDialog = ({
  open,
  onOpenChange,
  onSave,
  editSubject,
  isSubmitting,
  grades,
  gradesLoading = false,
}: AddEditSubjectDialogProps) => {
  const [formData, setFormData] = useState<CreateSubjectDto | UpdateSubjectDto>(
    {
      name: "",
      code: "",
      description: "",
      isActive: true,
      gradeAssignments: [],
    }
  );

  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);

  useEffect(() => {
    if (editSubject) {
      setFormData({
        name: editSubject.name,
        code: editSubject.code || "",
        description: editSubject.description || "",
        isActive: editSubject.isActive,
        gradeAssignments: editSubject.gradeAssignments || [],
      });

      // Pre-select grades from existing assignments
      let existingGradeIds: string[] = [];

      // Check if we have gradeAssignments (frontend format)
      if (
        editSubject.gradeAssignments &&
        editSubject.gradeAssignments.length > 0
      ) {
        existingGradeIds = editSubject.gradeAssignments
          .filter((assignment) => assignment.isActive !== false)
          .map((assignment) => assignment.gradeId);
      }
      // Check if we have gradeSubjects (backend format with include)
      else if (
        editSubject.gradeSubjects &&
        editSubject.gradeSubjects.length > 0
      ) {
        existingGradeIds = editSubject.gradeSubjects
          .filter((gs) => gs.isActive !== false)
          .map((gs) => gs.gradeId);

        // Also convert gradeSubjects to gradeAssignments format for formData
        const gradeAssignments = editSubject.gradeSubjects
          .filter((gs) => gs.isActive !== false)
          .map((gs) => ({
            gradeId: gs.gradeId,
            medium: gs.medium || "English",
            isActive: gs.isActive,
          }));

        setFormData((prev) => ({
          ...prev,
          gradeAssignments,
        }));
      }

      setSelectedGrades(existingGradeIds);
    } else {
      setFormData({
        name: "",
        code: "",
        description: "",
        isActive: true,
        gradeAssignments: [],
      });
      setSelectedGrades([]);
    }
  }, [editSubject, open]);

  const handleGradeSelection = (gradeId: string) => {
    const newSelectedGrades = selectedGrades.includes(gradeId)
      ? selectedGrades.filter((id) => id !== gradeId)
      : [...selectedGrades, gradeId];

    setSelectedGrades(newSelectedGrades);

    // Update gradeAssignments in formData
    const gradeAssignments = newSelectedGrades.map((gradeId) => ({
      gradeId,
      medium: "Sinhala", // Default medium, you can make this selectable if needed
      isActive: true,
    }));

    setFormData((prev) => ({
      ...prev,
      gradeAssignments,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("Please enter a subject name");
      return;
    }

    if (selectedGrades.length === 0) {
      toast.error("Please select at least one grade");
      return;
    }

    try {
      // Clean up empty fields
      const cleanedData = { ...formData };

      if (!cleanedData.code || cleanedData.code.trim() === "") {
        delete cleanedData.code;
      }

      if (!cleanedData.description || cleanedData.description.trim() === "") {
        delete cleanedData.description;
      }

      onSave(cleanedData);
    } catch (error) {
      toast.error("Failed to process form");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editSubject ? "Edit Subject" : "Add New Subject"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Subject Name *</Label>
            <Input
              id="name"
              placeholder="Enter subject name"
              value={formData.name}
              disabled={isSubmitting}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const name = e.target.value;
                // Auto-generate code from name (uppercase letters only)
                const code = name
                  .toUpperCase()
                  .replace(/[^A-Z]/g, "")
                  .slice(0, 10); // Limit to 10 characters
                setFormData({ ...formData, name, code });
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Subject Code (Auto-generated)</Label>
            <Input
              id="code"
              placeholder="Auto-generated from name"
              value={formData.code || ""}
              disabled={true}
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Code is automatically generated from the subject name
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Enter subject description"
              value={formData.description || ""}
              disabled={isSubmitting}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
            />
          </div>

          {/* Grade Selection */}
          <div className="space-y-3">
            <Label>Assign to Grades *</Label>
            <p className="text-xs text-muted-foreground">
              Select one or more grades for this subject
            </p>

            {gradesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">
                  Loading grades...
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                {grades.map((grade) => (
                  <div key={grade.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`grade-${grade.id}`}
                      checked={selectedGrades.includes(grade.id)}
                      onCheckedChange={() => handleGradeSelection(grade.id)}
                      disabled={isSubmitting}
                    />
                    <Label
                      htmlFor={`grade-${grade.id}`}
                      className="text-sm font-normal cursor-pointer flex items-center gap-2"
                    >
                      {grade.name}
                      {grade.code && (
                        <span className="text-xs text-muted-foreground">
                          ({grade.code})
                        </span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {selectedGrades.length > 0 && (
              <p className="text-xs text-green-600">
                {selectedGrades.length} grade(s) selected
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              disabled={isSubmitting}
              onCheckedChange={(checked: boolean) =>
                setFormData({ ...formData, isActive: checked })
              }
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editSubject ? (
                "Update Subject"
              ) : (
                "Add Subject"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Delete Confirmation Dialog Component
const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[400px]">
        <AlertDialogHeader className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <AlertDialogTitle className="text-xl">Are you sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Do you really want to delete this subject?
            <br />
            This process cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="flex-1"
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

// Main Subjects Management Component
const SubjectManagement = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradesLoading, setGradesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch subjects and grades on mount
  useEffect(() => {
    fetchSubjects();
    fetchGrades();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const data = await subjectsApi.findAll(true); // Include inactive

      // Transform the data to include gradeAssignments if needed
      const transformedSubjects = data.map((subject: any) => ({
        ...subject,
        gradeAssignments: subject.gradeSubjects
          ? subject.gradeSubjects.map((gs: any) => ({
              gradeId: gs.gradeId,
              isActive: gs.isActive,
              grade: gs.grade,
            }))
          : [],
      }));

      setSubjects(transformedSubjects as Subject[]);
    } catch (error) {
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const fetchGrades = async () => {
    try {
      setGradesLoading(true);
      const response = await gradesApi.getAll({
        includeInactive: true,
        limit: 100, // Get all grades
      });

      // The response structure is { grades: Grade[], total, page, limit, totalPages }
      const gradesData = response.grades || [];
      setGrades(gradesData);
    } catch (error) {
      console.error("Failed to load grades:", error);
      toast.error("Failed to load grades");
      setGrades([]);
    } finally {
      setGradesLoading(false);
    }
  };

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subject.code?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (subject.category?.toLowerCase() || "").includes(
        searchQuery.toLowerCase()
      );

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "Active" && subject.isActive) ||
      (statusFilter === "Inactive" && !subject.isActive);

    return matchesSearch && matchesStatus;
  });

  const handleAddSubject = (): void => {
    setEditingSubject(null);
    setIsAddDialogOpen(true);
  };

  const handleEditSubject = (subject: Subject): void => {
    setEditingSubject(subject);
    setIsAddDialogOpen(true);
  };

  const handleDeleteSubject = (id: string): void => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleManageGrades = (subject: Subject): void => {
    toast.info(`Manage grade assignments for ${subject.name}`);
    // You can implement a separate dialog for managing grade assignments
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!deletingId) return;

    try {
      setDeleting(true);
      await subjectsApi.remove(deletingId);
      await fetchSubjects(); // Refresh list
      toast.success("Subject deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (error) {
      toast.error("Failed to delete subject");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveSubject = async (
    subjectData: CreateSubjectDto | UpdateSubjectDto
  ): Promise<void> => {
    try {
      setSubmitting(true);

      // Clean the data before sending
      const cleanedData = { ...subjectData };

      if (!cleanedData.code || cleanedData.code.trim() === "") {
        delete cleanedData.code;
      }

      if (!cleanedData.description || cleanedData.description.trim() === "") {
        delete cleanedData.description;
      }

      if (editingSubject) {
        // Update existing subject
        await subjectsApi.update(
          editingSubject.id,
          cleanedData as UpdateSubjectDto
        );
        toast.success("Subject updated successfully");
      } else {
        // Add new subject
        await subjectsApi.create(cleanedData as CreateSubjectDto);
        toast.success("Subject created successfully");
      }

      await fetchSubjects(); // Refresh list
      setIsAddDialogOpen(false);
      setEditingSubject(null);
    } catch (error) {
      const message =
        asApiError(error).response?.data?.message || "Failed to save subject";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewSubject = (subject: Subject): void => {
    toast.info(
      `Viewing details for ${subject.name} - ${subject.code || "N/A"}`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Academic Management</span>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Subject Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all subjects and their grade assignments in the academic
            system
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subjects..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              className="pl-10"
            />
          </div>

          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              Export As
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button onClick={handleAddSubject} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </div>
        </div>

        {/* Table */}
        <SubjectTable
          subjects={filteredSubjects}
          onEdit={handleEditSubject}
          onDelete={handleDeleteSubject}
          onView={handleViewSubject}
          onManageGrades={handleManageGrades}
        />

        {/* Dialogs */}
        <AddEditSubjectDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSave={handleSaveSubject}
          editSubject={editingSubject}
          isSubmitting={submitting}
          grades={grades}
          gradesLoading={gradesLoading}
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

export default SubjectManagement;
