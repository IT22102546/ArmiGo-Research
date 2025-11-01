"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Play,
  Square,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { classesApi } from "@/lib/api/endpoints/classes";

// Types matching backend
type ClassStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";

interface Teacher {
  id: string;
  fullName: string;
  email: string;
  department?: string;
  specialization?: string;
}

interface Student {
  id: string;
  fullName: string;
  email: string;
  grade?: string;
  academicYear?: string;
}

interface ClassItem {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  grade?: string;
  teacherId: string;
  teacher?: {
    firstName: string;
    lastName: string;
  };
  startDate: string;
  endDate?: string;
  schedule?: any;
  meetingLink?: string;
  recordingUrl?: string;
  materials?: string;
  maxStudents?: number;
  status: ClassStatus;
  fees?: number;
  isPaid?: boolean;
  isLive?: boolean;
  startedAt?: string;
  endedAt?: string;
  isRecurring?: boolean;
  recurrence?: string;
  createdAt: string;
  updatedAt: string;
}

// Status Badge Component
const StatusBadge = ({ status }: { status: ClassStatus }) => {
  const statusStyles = {
    DRAFT: "bg-gray-100 text-gray-800",
    ACTIVE: "bg-green-100 text-green-800",
    COMPLETED: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={cn(
        "px-3 py-1 rounded-md text-xs font-medium inline-block",
        statusStyles[status]
      )}
    >
      {status}
    </span>
  );
};

// Live Badge Component
const LiveBadge = ({ isLive }: { isLive?: boolean }) => {
  if (!isLive) return null;

  return (
    <span className="px-2 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1 bg-red-100 text-red-800 animate-pulse">
      <span className="h-2 w-2 rounded-full bg-red-500"></span>
      LIVE
    </span>
  );
};

// Add/Edit Class Dialog Component
interface AddEditClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  editClass: ClassItem | null;
  teachers: Teacher[];
}

const AddEditClassDialog = ({
  open,
  onOpenChange,
  onSave,
  editClass,
  teachers,
}: AddEditClassDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    grade: "",
    teacherId: "",
    startDate: "",
    endDate: "",
    meetingLink: "",
    recordingUrl: "",
    materials: "",
    maxStudents: 30,
    fees: 0,
    isPaid: false,
    status: "DRAFT" as ClassStatus,
  });

  useEffect(() => {
    if (editClass) {
      setFormData({
        title: editClass.title,
        description: editClass.description || "",
        subject: editClass.subject || "",
        grade: editClass.grade || "",
        teacherId: editClass.teacherId,
        startDate: editClass.startDate.split("T")[0],
        endDate: editClass.endDate?.split("T")[0] || "",
        meetingLink: editClass.meetingLink || "",
        recordingUrl: editClass.recordingUrl || "",
        materials: editClass.materials || "",
        maxStudents: editClass.maxStudents || 30,
        fees: editClass.fees || 0,
        isPaid: editClass.isPaid || false,
        status: editClass.status,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        subject: "",
        grade: "",
        teacherId: "",
        startDate: "",
        endDate: "",
        meetingLink: "",
        recordingUrl: "",
        materials: "",
        maxStudents: 30,
        fees: 0,
        isPaid: false,
        status: "DRAFT",
      });
    }
  }, [editClass, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.teacherId || !formData.startDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : undefined,
      };

      if (editClass) {
        await classesApi.update(editClass.id, payload);
        toast.success("Class updated successfully");
      } else {
        await classesApi.create(payload);
        toast.success("Class created successfully");
      }

      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save class");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editClass ? "Edit Class" : "Add New Class"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">
                Class Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Advanced Mathematics - Grade 12"
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Class description..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                placeholder="Mathematics"
              />
            </div>

            <div>
              <Label htmlFor="grade">Grade</Label>
              <Select
                value={formData.grade}
                onValueChange={(value) =>
                  setFormData({ ...formData, grade: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(13)].map((_, i) => (
                    <SelectItem key={i + 1} value={`${i + 1}`}>
                      Grade {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="teacherId">
                Teacher <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.teacherId}
                onValueChange={(value) =>
                  setFormData({ ...formData, teacherId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.fullName}
                      {teacher.specialization && ` - ${teacher.specialization}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="maxStudents">Max Students</Label>
              <Input
                id="maxStudents"
                type="number"
                value={formData.maxStudents}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxStudents: parseInt(e.target.value),
                  })
                }
                min={1}
              />
            </div>

            <div>
              <Label htmlFor="fees">Fees</Label>
              <Input
                id="fees"
                type="number"
                value={formData.fees}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fees: parseFloat(e.target.value),
                  })
                }
                min={0}
                step={0.01}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="meetingLink">Meeting Link</Label>
              <Input
                id="meetingLink"
                value={formData.meetingLink}
                onChange={(e) =>
                  setFormData({ ...formData, meetingLink: e.target.value })
                }
                placeholder="https://zoom.us/j/..."
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="recordingUrl">Recording URL</Label>
              <Input
                id="recordingUrl"
                value={formData.recordingUrl}
                onChange={(e) =>
                  setFormData({ ...formData, recordingUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="materials">
                Materials (JSON format or comma-separated URLs)
              </Label>
              <Textarea
                id="materials"
                value={formData.materials}
                onChange={(e) =>
                  setFormData({ ...formData, materials: e.target.value })
                }
                placeholder='["https://...", "https://..."]'
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: ClassStatus) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editClass ? "Update" : "Create"} Class
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// View Class Dialog Component
interface ViewClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classItem: ClassItem | null;
}

const ViewClassDialog = ({
  open,
  onOpenChange,
  classItem,
}: ViewClassDialogProps) => {
  if (!classItem) return null;

  const teacher = classItem.teacher
    ? `${classItem.teacher.firstName} ${classItem.teacher.lastName}`
    : "N/A";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Class Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">
              {classItem.title || "Untitled Class"}
            </h3>
            {classItem.description && (
              <p className="text-muted-foreground mt-1">
                {classItem.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Subject</Label>
              <p className="font-medium">{classItem.subject || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Grade</Label>
              <p className="font-medium">{classItem.grade || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Teacher</Label>
              <p className="font-medium">{teacher}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">
                <StatusBadge status={classItem.status} />
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Start Date</Label>
              <p className="font-medium">
                {new Date(classItem.startDate).toLocaleDateString()}
              </p>
            </div>
            {classItem.endDate && (
              <div>
                <Label className="text-muted-foreground">End Date</Label>
                <p className="font-medium">
                  {new Date(classItem.endDate).toLocaleDateString()}
                </p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Max Students</Label>
              <p className="font-medium">{classItem.maxStudents || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Fees</Label>
              <p className="font-medium">
                ${classItem.fees?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>

          {classItem.meetingLink && (
            <div>
              <Label className="text-muted-foreground">Meeting Link</Label>
              <a
                href={classItem.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline block mt-1"
              >
                {classItem.meetingLink}
              </a>
            </div>
          )}

          {classItem.recordingUrl && (
            <div>
              <Label className="text-muted-foreground">Recording URL</Label>
              <a
                href={classItem.recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline block mt-1"
              >
                {classItem.recordingUrl}
              </a>
            </div>
          )}

          {classItem.materials && (
            <div>
              <Label className="text-muted-foreground">Materials</Label>
              <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                {classItem.materials}
              </pre>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p>Created: {new Date(classItem.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(classItem.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Delete Confirm Dialog Component
interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading: boolean;
}

const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  loading,
}: DeleteConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the class
            and all related data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Enrolled Students Dialog Component
interface EnrolledStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string | null;
}

const EnrolledStudentsDialog = ({
  open,
  onOpenChange,
  classId,
}: EnrolledStudentsDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [enrolledData, setEnrolledData] = useState<{
    students: any[];
    totalEnrolled: number;
    maxStudents: number;
    availableSlots: number;
  } | null>(null);

  useEffect(() => {
    if (open && classId) {
      fetchEnrolledStudents();
    }
  }, [open, classId]);

  const fetchEnrolledStudents = async () => {
    if (!classId) return;

    try {
      setLoading(true);
      const response = await classesApi.getEnrolledStudents(classId);
      setEnrolledData(response);
    } catch (error: any) {
      toast.error("Failed to fetch enrolled students");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enrolled Students</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : enrolledData ? (
          <div className="space-y-4">
            {/* Capacity Info */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total Enrolled</p>
                <p className="text-2xl font-bold">
                  {enrolledData.totalEnrolled}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Max Capacity</p>
                <p className="text-2xl font-bold">{enrolledData.maxStudents}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Slots</p>
                <p className="text-2xl font-bold text-green-600">
                  {enrolledData.availableSlots}
                </p>
              </div>
            </div>

            {/* Students List */}
            {enrolledData.students.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No students enrolled yet
              </p>
            ) : (
              <div className="space-y-2">
                {enrolledData.students.map((enrollment: any) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">
                        {enrollment.student.firstName}{" "}
                        {enrollment.student.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {enrollment.student.email}
                      </p>
                      {enrollment.student.profile?.grade && (
                        <p className="text-xs text-muted-foreground">
                          Grade {enrollment.student.profile.grade}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        Enrolled:{" "}
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </p>
                      <span
                        className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          enrollment.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        )}
                      >
                        {enrollment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No data available
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main Component
export default function ClassManagement() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");

  // Dialog states
  const [addEditDialogOpen, setAddEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [enrolledStudentsDialogOpen, setEnrolledStudentsDialogOpen] =
    useState(false);
  const [editClass, setEditClass] = useState<ClassItem | null>(null);
  const [viewClass, setViewClass] = useState<ClassItem | null>(null);
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [startStopLoading, setStartStopLoading] = useState<string | null>(null);

  // Fetch data
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await classesApi.getAll({
        status: statusFilter !== "all" ? statusFilter : undefined,
        grade: gradeFilter !== "all" ? gradeFilter : undefined,
      });
      setClasses(response.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch classes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await classesApi.getTeachersList();
      setTeachers(response.data || []);
    } catch (error: any) {
      console.error("Failed to fetch teachers", error);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, [statusFilter, gradeFilter]);

  // Handlers
  const handleAdd = () => {
    setEditClass(null);
    setAddEditDialogOpen(true);
  };

  const handleEdit = (classItem: ClassItem) => {
    setEditClass(classItem);
    setAddEditDialogOpen(true);
  };

  const handleView = (classItem: ClassItem) => {
    setViewClass(classItem);
    setViewDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteClassId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteClassId) return;

    try {
      setDeleteLoading(true);
      await classesApi.delete(deleteClassId);
      toast.success("Class deleted successfully");
      fetchClasses();
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to delete class");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSave = () => {
    fetchClasses();
  };

  const handleStartClass = async (classId: string) => {
    try {
      setStartStopLoading(classId);
      await classesApi.startClass(classId);
      toast.success("Class started successfully");
      fetchClasses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to start class");
    } finally {
      setStartStopLoading(null);
    }
  };

  const handleStopClass = async (classId: string) => {
    try {
      setStartStopLoading(classId);
      await classesApi.stopClass(classId);
      toast.success("Class stopped successfully");
      fetchClasses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to stop class");
    } finally {
      setStartStopLoading(null);
    }
  };

  const handleViewEnrolledStudents = (classId: string) => {
    setSelectedClassId(classId);
    setEnrolledStudentsDialogOpen(true);
  };

  // Filter classes by search query
  const filteredClasses = classes.filter((classItem) => {
    const matchesSearch =
      classItem.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classItem.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classItem.grade?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Class Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your classes, schedules, and student enrollments
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Grade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {[...Array(13)].map((_, i) => (
              <SelectItem key={i + 1} value={`${i + 1}`}>
                Grade {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">No classes found</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                  Title
                </th>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                  Subject
                </th>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                  Grade
                </th>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                  Teacher
                </th>
                <th className="p-4 text-left text-sm font-medium text-muted-foreground">
                  Start Date
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
              {filteredClasses.map((classItem) => (
                <tr
                  key={classItem.id}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="p-4 font-medium">
                    {classItem.title || "Untitled Class"}
                  </td>
                  <td className="p-4">{classItem.subject || "N/A"}</td>
                  <td className="p-4">{classItem.grade || "N/A"}</td>
                  <td className="p-4">
                    {classItem.teacher
                      ? `${classItem.teacher.firstName} ${classItem.teacher.lastName}`
                      : "N/A"}
                  </td>
                  <td className="p-4">
                    {new Date(classItem.startDate).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={classItem.status} />
                      <LiveBadge isLive={classItem.isLive} />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {/* Start/Stop Class Buttons */}
                      {classItem.status === "ACTIVE" && (
                        <>
                          {!classItem.isLive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartClass(classItem.id)}
                              disabled={startStopLoading === classItem.id}
                              className="h-8 text-green-600 hover:text-green-700"
                            >
                              {startStopLoading === classItem.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStopClass(classItem.id)}
                              disabled={startStopLoading === classItem.id}
                              className="h-8 text-red-600 hover:text-red-700"
                            >
                              {startStopLoading === classItem.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </>
                      )}

                      {/* Enrolled Students Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewEnrolledStudents(classItem.id)}
                        className="h-8 w-8"
                        title="View enrolled students"
                      >
                        <Users className="h-4 w-4" />
                      </Button>

                      {/* Standard Actions */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(classItem)}
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(classItem)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(classItem.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialogs */}
      <AddEditClassDialog
        open={addEditDialogOpen}
        onOpenChange={setAddEditDialogOpen}
        onSave={handleSave}
        editClass={editClass}
        teachers={teachers}
      />
      <ViewClassDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        classItem={viewClass}
      />
      <EnrolledStudentsDialog
        open={enrolledStudentsDialogOpen}
        onOpenChange={setEnrolledStudentsDialogOpen}
        classId={selectedClassId}
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </div>
  );
}
