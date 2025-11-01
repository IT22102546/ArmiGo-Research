import React, { useState, useEffect } from "react";
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
  Upload,
  Eye,
  Pencil,
  Trash2,
  XCircle,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { subjectsApi, Subject as ApiSubject, CreateSubjectDto, UpdateSubjectDto } from "@/lib/api/endpoints/subjects";

// Types
interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  medium?: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  teacherId?: string;
  credits?: number;
  duration?: number;
  isActive: boolean;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StatusBadgeProps {
  status: boolean;
}

interface SubjectTableRowProps {
  subject: Subject;
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
  onView: (subject: Subject) => void;
}

interface SubjectTableProps {
  subjects: Subject[];
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
  onView: (subject: Subject) => void;
}

interface AddEditSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (subjectData: CreateSubjectDto | UpdateSubjectDto) => void;
  editSubject: Subject | null;
  isSubmitting: boolean;
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

// Subject Table Row Component
const SubjectTableRow = ({
  subject,
  onEdit,
  onDelete,
  onView,
}: SubjectTableRowProps) => {
  const teacherName = subject.teacher
    ? `${subject.teacher.firstName} ${subject.teacher.lastName}`
    : "Unassigned";

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="p-4">
        <Checkbox />
      </td>
      <td className="p-4">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden">
          {subject.imageUrl ? (
            <Image
              src={subject.imageUrl}
              alt="Subject"
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-primary font-semibold">
              {subject.name[0]}
            </span>
          )}
        </div>
      </td>
      <td className="p-4 font-medium text-foreground">{subject.name}</td>
      <td className="p-4 text-foreground">{subject.medium || "N/A"}</td>
      <td className="p-4 text-foreground">{teacherName}</td>
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
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(subject)}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(subject.id)}
            className="h-8 w-8 text-destructive hover:text-destructive"
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
              Image
            </th>
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">
              Subject
            </th>
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">
              Medium
            </th>
            <th className="p-4 text-left text-sm font-medium text-muted-foreground">
              Teacher
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
}: AddEditSubjectDialogProps) => {
  const [formData, setFormData] = useState<CreateSubjectDto | UpdateSubjectDto>({
    name: "",
    code: "",
    description: "",
    medium: "",
    teacherId: "",
    credits: undefined,
    duration: undefined,
    imageUrl: "",
    isActive: true,
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editSubject) {
      setFormData({
        name: editSubject.name,
        code: editSubject.code || "",
        description: editSubject.description || "",
        medium: editSubject.medium || "",
        teacherId: editSubject.teacherId || "",
        credits: editSubject.credits,
        duration: editSubject.duration,
        imageUrl: editSubject.imageUrl || "",
        isActive: editSubject.isActive,
      });
      setImagePreview(editSubject.imageUrl || "");
      setSelectedFile(null);
    } else {
      setFormData({
        name: "",
        code: "",
        description: "",
        medium: "",
        teacherId: "",
        credits: undefined,
        duration: undefined,
        imageUrl: "",
        isActive: true,
      });
      setImagePreview("");
      setSelectedFile(null);
    }
  }, [editSubject, open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview("");
    setFormData({ ...formData, imageUrl: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("Please enter a subject name");
      return;
    }

    try {
      let finalFormData = { ...formData };

      // Upload image if a new file is selected
      if (selectedFile) {
        setUploading(true);
        try {
          const uploadResult = await subjectsApi.uploadImage(selectedFile);
          // Handle both direct response and wrapped response
          const imageUrl = (uploadResult as any).data?.url || (uploadResult as any).url;
          finalFormData.imageUrl = imageUrl;
          toast.success("Image uploaded successfully");
        } catch (error: any) {
          toast.error("Failed to upload image");
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      onSave(finalFormData);
    } catch (error) {
      toast.error("Failed to process form");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Subject Code</Label>
            <Input
              id="code"
              placeholder="Enter subject code"
              value={formData.code || ""}
              disabled={isSubmitting}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, code: e.target.value })
              }
            />
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

          <div className="space-y-2">
            <Label htmlFor="medium">Medium</Label>
            <Select
              value={formData.medium || ""}
              disabled={isSubmitting}
              onValueChange={(value: string) =>
                setFormData({ ...formData, medium: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select medium" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="Sinhala">Sinhala</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Tamil">Tamil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                placeholder="Credits"
                min="0"
                disabled={isSubmitting}
                value={formData.credits || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ 
                    ...formData, 
                    credits: e.target.value ? parseInt(e.target.value) : undefined 
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (mins)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="Duration"
                min="0"
                disabled={isSubmitting}
                value={formData.duration || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ 
                    ...formData, 
                    duration: e.target.value ? parseInt(e.target.value) : undefined 
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUpload">Subject Image</Label>
            <div className="space-y-3">
              {imagePreview ? (
                <div className="relative w-full h-40 border-2 border-dashed border-border rounded-lg overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                    disabled={isSubmitting || uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
                  <label htmlFor="imageUpload" className="flex flex-col items-center cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload image
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      JPEG, PNG, WebP (Max 5MB)
                    </span>
                  </label>
                </div>
              )}
              <Input
                id="imageUpload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isSubmitting || uploading}
              />
            </div>
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
              disabled={isSubmitting || uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                editSubject ? "Update" : "Add Subject"
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
const DashSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch subjects on mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const data = await subjectsApi.findAll(true); // Include inactive
      setSubjects(data as Subject[]);
    } catch (error) {
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter((subject) => {
    const teacherName = subject.teacher
      ? `${subject.teacher.firstName} ${subject.teacher.lastName}`
      : "";
      
    const matchesSearch =
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subject.code?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      teacherName.toLowerCase().includes(searchQuery.toLowerCase());

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

  const handleSaveSubject = async (subjectData: CreateSubjectDto | UpdateSubjectDto): Promise<void> => {
    try {
      setSubmitting(true);
      
      if (editingSubject) {
        // Update existing subject
        await subjectsApi.update(editingSubject.id, subjectData as UpdateSubjectDto);
        toast.success("Subject updated successfully");
      } else {
        // Add new subject
        await subjectsApi.create(subjectData as CreateSubjectDto);
        toast.success("Subject created successfully");
      }

      await fetchSubjects(); // Refresh list
      setIsAddDialogOpen(false);
      setEditingSubject(null);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to save subject";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewSubject = (subject: Subject): void => {
    toast.info(`Viewing details for ${subject.name} - ${subject.code || "N/A"}`);
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
            Manage all subjects in the academic system
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
              <SelectItem value="Draft">Draft</SelectItem>
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
        />

        {/* Dialogs */}
        <AddEditSubjectDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSave={handleSaveSubject}
          editSubject={editingSubject}
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

export default DashSubjects;
