"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Eye,
  Filter,
  Search,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import { classesApi } from "@/lib/api/endpoints/classes";
import { gradesApi } from "@/lib/api/endpoints/grades";
import { mediumsApi } from "@/lib/api/endpoints/mediums";
import { subjectsApi } from "@/lib/api/endpoints/subjects";
import { teacherAssignmentsApi } from "@/lib/api/endpoints/teacher-assignments";
import { handleApiError } from "@/lib/error-handling";
import { format } from "date-fns";
import {
  PageHeader,
  LoadingSpinner,
  EmptyState,
  AutoStatusBadge,
} from "@/components/shared";

// Helper to safely format dates
const safeFormatDate = (value?: string | Date | null, fmt = "PP") => {
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

interface ClassItem {
  id: string;
  name: string;
  description?: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  startDate?: string | null;
  endDate?: string | null;
  isRecurring: boolean;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  grade?: {
    id: string;
    name: string;
    level?: number;
  };
  subject?: {
    id: string;
    name: string;
  };
  medium?: {
    id: string;
    name: string;
  };
  maxStudents?: number;
  enrollments?: any[];
}

interface Grade {
  id: string;
  name: string;
  level?: number;
}

interface Medium {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface TeacherAssignment {
  id: string;
  teacherProfileId: string;
  gradeId: string;
  subjectId: string;
  mediumId: string;
  teacher?: Teacher;
  grade?: Grade;
  subject?: Subject;
  medium?: Medium;
}

export function ClassesManagement() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter states
  const [selectedGrade, setSelectedGrade] = useState<string>("ALL");
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");
  const [selectedMedium, setSelectedMedium] = useState<string>("ALL");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Options for filters
  const [grades, setGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "DRAFT",
    isRecurring: false,
    maxStudents: 30,
    teacherAssignmentId: "",
    gradeId: "",
    subjectId: "",
    mediumId: "",
    teacherId: "",
  });

  const [teacherAssignments, setTeacherAssignments] = useState<
    TeacherAssignment[]
  >([]);

  useEffect(() => {
    fetchClasses();
    fetchFilterOptions();
  }, [page]);

  useEffect(() => {
    applyFilters();
  }, [
    classes,
    searchTerm,
    selectedGrade,
    selectedSubject,
    selectedMedium,
    selectedTeacher,
    selectedStatus,
  ]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await classesApi.getAll({ page, limit: 20 });
      const classesData = Array.isArray(response)
        ? response
        : response.data || response.classes || [];
      setClasses(classesData);
      if (response.totalPages) setTotalPages(response.totalPages);
    } catch (error) {
      handleApiError(error, "Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [gradesRes, subjectsRes, mediumsRes, teachersRes] =
        await Promise.all([
          gradesApi.getAll({ includeInactive: false }),
          subjectsApi.findAll(false),
          mediumsApi.getAll({ includeInactive: false }),
          classesApi.getTeachersList(),
        ]);

      setGrades(gradesRes.grades || []);
      setSubjects(Array.isArray(subjectsRes) ? subjectsRes : []);
      setMediums(mediumsRes.mediums || []);
      setTeachers(teachersRes || []);
    } catch (error) {
      console.error("Failed to fetch filter options:", error);
    }
  };

  const fetchTeacherAssignments = async (
    gradeId: string,
    subjectId: string,
    mediumId: string
  ) => {
    if (!gradeId || !subjectId || !mediumId) {
      setTeacherAssignments([]);
      return;
    }

    try {
      const response = await teacherAssignmentsApi.getBySubjectGradeMedium({
        gradeId,
        subjectId,
        mediumId,
      });
      setTeacherAssignments(response.assignments || []);
    } catch (error) {
      console.error("Failed to fetch teacher assignments:", error);
      setTeacherAssignments([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...classes];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (cls) =>
          cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cls.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Grade filter
    if (selectedGrade !== "ALL") {
      filtered = filtered.filter((cls) => cls.grade?.id === selectedGrade);
    }

    // Subject filter
    if (selectedSubject !== "ALL") {
      filtered = filtered.filter((cls) => cls.subject?.id === selectedSubject);
    }

    // Medium filter
    if (selectedMedium !== "ALL") {
      filtered = filtered.filter((cls) => cls.medium?.id === selectedMedium);
    }

    // Teacher filter
    if (selectedTeacher !== "ALL") {
      filtered = filtered.filter((cls) => cls.teacher?.id === selectedTeacher);
    }

    // Status filter
    if (selectedStatus !== "ALL") {
      filtered = filtered.filter((cls) => cls.status === selectedStatus);
    }

    setFilteredClasses(filtered);
  };

  const handleCreateClass = async () => {
    try {
      await classesApi.create(formData);
      setCreateDialogOpen(false);
      resetForm();
      fetchClasses();
    } catch (error) {
      handleApiError(error, "Failed to create class");
    }
  };

  const handleUpdateClass = async () => {
    if (!selectedClass) return;
    try {
      await classesApi.update(selectedClass.id, formData);
      setEditDialogOpen(false);
      resetForm();
      setSelectedClass(null);
      fetchClasses();
    } catch (error) {
      handleApiError(error, "Failed to update class");
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    try {
      await classesApi.delete(selectedClass.id);
      setDeleteDialogOpen(false);
      setSelectedClass(null);
      fetchClasses();
    } catch (error) {
      handleApiError(error, "Failed to delete class");
    }
  };

  const handleStatusChange = async (classId: string, newStatus: string) => {
    try {
      await classesApi.update(classId, { status: newStatus });
      fetchClasses();
    } catch (error) {
      handleApiError(error, "Failed to update class status");
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const openEditDialog = (cls: ClassItem) => {
    setSelectedClass(cls);
    setFormData({
      name: cls.name,
      description: cls.description || "",
      startDate: cls.startDate ? cls.startDate.split("T")[0] : "",
      endDate: cls.endDate ? cls.endDate.split("T")[0] : "",
      status: cls.status,
      isRecurring: cls.isRecurring,
      maxStudents: cls.maxStudents || 30,
      teacherAssignmentId: "",
      gradeId: cls.grade?.id || "",
      subjectId: cls.subject?.id || "",
      mediumId: cls.medium?.id || "",
      teacherId: cls.teacher?.id || "",
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (cls: ClassItem) => {
    setSelectedClass(cls);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      status: "DRAFT",
      isRecurring: false,
      maxStudents: 30,
      teacherAssignmentId: "",
      gradeId: "",
      subjectId: "",
      mediumId: "",
      teacherId: "",
    });
    setTeacherAssignments([]);
  };

  useEffect(() => {
    if (formData.gradeId && formData.subjectId && formData.mediumId) {
      fetchTeacherAssignments(
        formData.gradeId,
        formData.subjectId,
        formData.mediumId
      );
    }
  }, [formData.gradeId, formData.subjectId, formData.mediumId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Class Management"
        description="Manage classes, enrollments, and schedules"
        icon={BookOpen}
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create Class
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search classes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Grade Filter */}
            <div>
              <Label>Grade</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Grades</SelectItem>
                  {grades
                    .filter((grade) => grade.id)
                    .map((grade) => (
                      <SelectItem key={grade.id} value={grade.id}>
                        {grade.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject Filter */}
            <div>
              <Label>Subject</Label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Subjects</SelectItem>
                  {subjects
                    .filter(
                      (s) =>
                        s && typeof s === "object" && "id" in s && "name" in s
                    )
                    .map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {String(subject.name)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Medium Filter */}
            <div>
              <Label>Medium</Label>
              <Select value={selectedMedium} onValueChange={setSelectedMedium}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Mediums</SelectItem>
                  {mediums
                    .filter((medium) => medium.id)
                    .map((medium) => (
                      <SelectItem key={medium.id} value={medium.id}>
                        {medium.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Teacher Filter */}
            <div>
              <Label>Teacher</Label>
              <Select
                value={selectedTeacher}
                onValueChange={setSelectedTeacher}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Teachers</SelectItem>
                  {teachers
                    .filter((teacher) => teacher.id)
                    .map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedGrade("ALL");
                  setSelectedSubject("ALL");
                  setSelectedMedium("ALL");
                  setSelectedTeacher("ALL");
                  setSelectedStatus("ALL");
                }}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classes Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingSpinner text="Loading classes..." className="py-12" />
          ) : filteredClasses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No classes found"
              description="Create a new class or adjust your filters to see results."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Medium</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recurring</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          router.push(`/admin/class-detail/${cls.id}`)
                        }
                      >
                        {cls.name}
                      </Button>
                    </TableCell>
                    <TableCell>
                      {cls.grade?.name ||
                        (typeof cls.grade?.level === "number"
                          ? cls.grade.level
                          : "-")}
                    </TableCell>
                    <TableCell>
                      {typeof cls.subject === "object" &&
                      cls.subject !== null &&
                      "name" in cls.subject
                        ? cls.subject.name
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {typeof cls.medium === "object" &&
                      cls.medium !== null &&
                      "name" in cls.medium
                        ? cls.medium.name
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {cls.teacher
                        ? `${cls.teacher.firstName} ${cls.teacher.lastName}`
                        : "-"}
                    </TableCell>
                    <TableCell>{safeFormatDate(cls.startDate)}</TableCell>
                    <TableCell>{safeFormatDate(cls.endDate)}</TableCell>
                    <TableCell>
                      <Select
                        value={cls.status}
                        onValueChange={(value) =>
                          handleStatusChange(cls.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <AutoStatusBadge status={cls.status} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cls.isRecurring ? "default" : "outline"}>
                        {cls.isRecurring ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/admin/class-detail/${cls.id}/sessions`
                            )
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/admin/class-detail/${cls.id}/enrollments`
                            )
                          }
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(cls)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(cls)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {createDialogOpen ? "Create New Class" : "Edit Class"}
            </DialogTitle>
            <DialogDescription>
              {createDialogOpen
                ? "Fill in the details to create a new class"
                : "Update class information"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Class Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Advanced Mathematics"
              />
            </div>

            <div className="grid gap-2">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="grade">Grade *</Label>
                <Select
                  value={formData.gradeId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gradeId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades
                      .filter((grade) => grade.id)
                      .map((grade) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select
                  value={formData.subjectId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subjectId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects
                      .filter(
                        (s) =>
                          s && typeof s === "object" && "id" in s && "name" in s
                      )
                      .map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {String(subject.name)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="medium">Medium *</Label>
                <Select
                  value={formData.mediumId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, mediumId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select medium" />
                  </SelectTrigger>
                  <SelectContent>
                    {mediums
                      .filter((medium) => medium.id)
                      .map((medium) => (
                        <SelectItem key={medium.id} value={medium.id}>
                          {medium.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="teacherAssignment">Teacher Assignment *</Label>
              <Select
                value={formData.teacherAssignmentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, teacherAssignmentId: value })
                }
                disabled={teacherAssignments.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      teacherAssignments.length === 0
                        ? "Select grade, subject, and medium first"
                        : "Select teacher assignment"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {teacherAssignments
                    .filter((assignment) => assignment.id)
                    .map((assignment) => (
                      <SelectItem key={assignment.id} value={assignment.id}>
                        {assignment.teacher
                          ? `${assignment.teacher.firstName} ${assignment.teacher.lastName}`
                          : "Unknown Teacher"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="maxStudents">Max Students</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  value={formData.maxStudents}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxStudents: parseInt(e.target.value) || 30,
                    })
                  }
                  min={1}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) =>
                  setFormData({ ...formData, isRecurring: e.target.checked })
                }
                className="h-4 w-4"
                aria-label="Recurring class checkbox"
              />
              <Label htmlFor="isRecurring" className="cursor-pointer">
                Recurring Class
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setEditDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={createDialogOpen ? handleCreateClass : handleUpdateClass}
            >
              {createDialogOpen ? "Create" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedClass?.name}"? This
              action will set the status to CANCELLED.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClass}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
