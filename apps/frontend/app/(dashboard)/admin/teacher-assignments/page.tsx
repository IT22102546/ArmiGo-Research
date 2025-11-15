"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Users,
  UserCircle,
  BookOpen,
  GraduationCap,
  Languages,
  Search,
  Filter,
  MoreHorizontal,
  Copy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Award,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Assignment {
  id: string;
  teacherProfileId: string;
  subjectId: string;
  gradeId: string;
  mediumId: string;
  maxStudents?: number;
  isActive: boolean;
  teacherProfile?: {
    id: string;
    employeeId?: string;
    specialization?: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      avatar?: string;
    };
  };
  subject?: {
    id: string;
    name: string;
    code?: string;
  };
  grade?: {
    id: string;
    name: string;
  };
  medium?: {
    id: string;
    name: string;
  };
}

interface Teacher {
  id: string;
  employeeId?: string;
  specialization?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
}

interface TeacherGroup {
  teacher: Teacher;
  assignments: Assignment[];
  activeAssignments: number;
  inactiveAssignments: number;
  subjects: Set<string>;
  grades: Set<string>;
  mediums: Set<string>;
}

export default function TeacherAssignmentsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [expandedTeachers, setExpandedTeachers] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    teacherProfileId: "",
    subjectId: "",
    gradeId: "",
    mediumId: "",
    maxStudents: 30,
    isActive: true,
  });

  // Fetch assignments
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["teacher-assignments"],
    queryFn: async () => {
      const response = await ApiClient.request<any>("/teacher-assignments");
      return (response?.assignments ||
        response?.data ||
        response ||
        []) as Assignment[];
    },
  });

  // Fetch teachers
  const { data: teachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/admin/teachers");
      return (response?.teachers ||
        response?.data ||
        response ||
        []) as Teacher[];
    },
  });

  // Fetch subjects
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/subjects");
      return Array.isArray(response)
        ? response
        : response?.subjects || response?.data || [];
    },
  });

  // Fetch grades
  const { data: grades } = useQuery({
    queryKey: ["grades"],
    queryFn: async () => {
      const response = await ApiClient.get<any>("/admin/grades");
      return response?.grades || response?.data || [];
    },
  });

  // Fetch mediums
  const { data: mediums } = useQuery({
    queryKey: ["mediums"],
    queryFn: async () => {
      const response = await ApiClient.request<any>("/admin/mediums");
      return response?.mediums || response?.data || [];
    },
  });

  // Group assignments by teacher
  const teacherGroups = useMemo(() => {
    if (!assignments) return [];

    const groups: Map<string, TeacherGroup> = new Map();

    assignments.forEach((assignment) => {
      const teacherId = assignment.teacherProfileId;
      const teacher = assignment.teacherProfile;

      if (!teacher) return;

      if (!groups.has(teacherId)) {
        groups.set(teacherId, {
          teacher,
          assignments: [],
          activeAssignments: 0,
          inactiveAssignments: 0,
          subjects: new Set(),
          grades: new Set(),
          mediums: new Set(),
        });
      }

      const group = groups.get(teacherId)!;
      group.assignments.push(assignment);

      if (assignment.isActive) {
        group.activeAssignments++;
      } else {
        group.inactiveAssignments++;
      }

      if (assignment.subject?.name) group.subjects.add(assignment.subject.name);
      if (assignment.grade?.name) group.grades.add(assignment.grade.name);
      if (assignment.medium?.name) group.mediums.add(assignment.medium.name);
    });

    let result = Array.from(groups.values()).sort((a, b) => {
      const nameA =
        `${a.teacher.user?.firstName} ${a.teacher.user?.lastName}`.toLowerCase();
      const nameB =
        `${b.teacher.user?.firstName} ${b.teacher.user?.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((group) => {
        const teacherName =
          `${group.teacher.user?.firstName} ${group.teacher.user?.lastName}`.toLowerCase();
        const employeeId = group.teacher.employeeId?.toLowerCase() || "";
        const email = group.teacher.user?.email?.toLowerCase() || "";
        return (
          teacherName.includes(query) ||
          employeeId.includes(query) ||
          email.includes(query)
        );
      });
    }

    // Apply status filter to assignments within groups
    if (statusFilter !== "all") {
      result = result
        .map((group) => ({
          ...group,
          assignments: group.assignments.filter((a) =>
            statusFilter === "active" ? a.isActive : !a.isActive
          ),
        }))
        .filter((group) => group.assignments.length > 0);
    }

    // Apply subject filter
    if (subjectFilter !== "all") {
      result = result
        .map((group) => ({
          ...group,
          assignments: group.assignments.filter(
            (a) => a.subjectId === subjectFilter
          ),
        }))
        .filter((group) => group.assignments.length > 0);
    }

    // Apply grade filter
    if (gradeFilter !== "all") {
      result = result
        .map((group) => ({
          ...group,
          assignments: group.assignments.filter(
            (a) => a.gradeId === gradeFilter
          ),
        }))
        .filter((group) => group.assignments.length > 0);
    }

    return result;
  }, [assignments, searchQuery, statusFilter, subjectFilter, gradeFilter]);

  // Statistics
  const stats = useMemo(() => {
    if (!assignments) return { total: 0, active: 0, inactive: 0, teachers: 0 };
    const uniqueTeachers = new Set(assignments.map((a) => a.teacherProfileId));
    return {
      total: assignments.length,
      active: assignments.filter((a) => a.isActive).length,
      inactive: assignments.filter((a) => !a.isActive).length,
      teachers: uniqueTeachers.size,
    };
  }, [assignments]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => ApiClient.post("/teacher-assignments", data),
    onSuccess: () => {
      toast.success("Assignment created successfully");
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create assignment"
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      ApiClient.put(`/teacher-assignments/${id}`, data),
    onSuccess: () => {
      toast.success("Assignment updated successfully");
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update assignment"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ApiClient.delete(`/teacher-assignments/${id}`),
    onSuccess: () => {
      toast.success("Assignment deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      setDeleteDialogOpen(false);
      setSelectedAssignment(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete assignment"
      );
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      ApiClient.put(`/teacher-assignments/${id}`, { isActive }),
    onSuccess: () => {
      toast.success("Assignment status updated");
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });

  // Toggle teacher expansion
  const toggleTeacher = (teacherId: string) => {
    setExpandedTeachers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(teacherId)) {
        newSet.delete(teacherId);
      } else {
        newSet.add(teacherId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedTeachers(new Set(teacherGroups.map((g) => g.teacher.id)));
  };

  const collapseAll = () => {
    setExpandedTeachers(new Set());
  };

  const handleOpenDialog = (
    assignment?: Assignment,
    preselectedTeacherId?: string
  ) => {
    if (assignment) {
      setSelectedAssignment(assignment);
      setFormData({
        teacherProfileId: assignment.teacherProfileId,
        subjectId: assignment.subjectId,
        gradeId: assignment.gradeId,
        mediumId: assignment.mediumId,
        maxStudents: assignment.maxStudents || 30,
        isActive: assignment.isActive,
      });
    } else {
      setSelectedAssignment(null);
      setFormData({
        teacherProfileId: preselectedTeacherId || "",
        subjectId: "",
        gradeId: "",
        mediumId: "",
        maxStudents: 30,
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedAssignment(null);
    setFormData({
      teacherProfileId: "",
      subjectId: "",
      gradeId: "",
      mediumId: "",
      maxStudents: 30,
      isActive: true,
    });
  };

  const handleSubmit = () => {
    if (
      !formData.teacherProfileId ||
      !formData.subjectId ||
      !formData.gradeId ||
      !formData.mediumId
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (selectedAssignment) {
      updateMutation.mutate({ id: selectedAssignment.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (selectedAssignment) {
      deleteMutation.mutate(selectedAssignment.id);
    }
  };

  const duplicateAssignment = (assignment: Assignment) => {
    setFormData({
      teacherProfileId: assignment.teacherProfileId,
      subjectId: assignment.subjectId,
      gradeId: "",
      mediumId: assignment.mediumId,
      maxStudents: assignment.maxStudents || 30,
      isActive: true,
    });
    setSelectedAssignment(null);
    setDialogOpen(true);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-primary" />
              Teacher Assignments
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage teacher-subject-grade-medium combinations
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Create Assignment
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Assignments
                  </p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Assignments
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.active}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Inactive Assignments
                  </p>
                  <p className="text-3xl font-bold text-gray-500">
                    {stats.inactive}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-gray-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Assigned Teachers
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.teachers}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 gap-4 w-full sm:w-auto">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search teachers by name, ID, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={expandAll}>
                    Expand All
                  </Button>
                  <Button variant="outline" size="sm" onClick={collapseAll}>
                    Collapse All
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Select
                  value={statusFilter}
                  onValueChange={(v: any) => setStatusFilter(v)}
                >
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={subjectFilter}
                  onValueChange={(v) => setSubjectFilter(v)}
                >
                  <SelectTrigger className="w-[160px]">
                    <BookOpen className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects
                      ?.filter((subject: any) => subject.id)
                      .map((subject: any) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Select
                  value={gradeFilter}
                  onValueChange={(v) => setGradeFilter(v)}
                >
                  <SelectTrigger className="w-[150px]">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {grades
                      ?.filter((grade: any) => grade.id)
                      .map((grade: any) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {(statusFilter !== "all" ||
                  subjectFilter !== "all" ||
                  gradeFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter("all");
                      setSubjectFilter("all");
                      setGradeFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teacher-wise Assignment List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Loading assignments...
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : teacherGroups.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Assignments Found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ||
                    statusFilter !== "all" ||
                    subjectFilter !== "all" ||
                    gradeFilter !== "all"
                      ? "No assignments match your search criteria"
                      : "Get started by creating your first teacher assignment"}
                  </p>
                  {!searchQuery &&
                    statusFilter === "all" &&
                    subjectFilter === "all" &&
                    gradeFilter === "all" && (
                      <Button onClick={() => handleOpenDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Assignment
                      </Button>
                    )}
                </div>
              </CardContent>
            </Card>
          ) : (
            teacherGroups.map((group) => (
              <Collapsible
                key={group.teacher.id}
                open={expandedTeachers.has(group.teacher.id)}
                onOpenChange={() => toggleTeacher(group.teacher.id)}
              >
                <Card className="overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {expandedTeachers.has(group.teacher.id) ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={group.teacher.user?.avatar} />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {getInitials(
                                  group.teacher.user?.firstName,
                                  group.teacher.user?.lastName
                                )}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                              {group.teacher.user?.firstName}{" "}
                              {group.teacher.user?.lastName}
                              {group.teacher.employeeId && (
                                <Badge
                                  variant="outline"
                                  className="font-mono text-xs"
                                >
                                  {group.teacher.employeeId}
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                              {group.teacher.user?.email && (
                                <span className="flex items-center gap-1 text-xs">
                                  <Mail className="h-3 w-3" />
                                  {group.teacher.user.email}
                                </span>
                              )}
                              {group.teacher.specialization && (
                                <Badge variant="secondary" className="text-xs">
                                  <Award className="h-3 w-3 mr-1" />
                                  {group.teacher.specialization}
                                </Badge>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden md:flex flex-wrap gap-1 max-w-xs">
                            {Array.from(group.subjects)
                              .slice(0, 3)
                              .map((subject) => (
                                <Badge
                                  key={subject}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {subject}
                                </Badge>
                              ))}
                            {group.subjects.size > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{group.subjects.size - 3} more
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Badge
                              variant="default"
                              className="bg-green-100 text-green-700 hover:bg-green-100"
                            >
                              {group.activeAssignments} Active
                            </Badge>
                            {group.inactiveAssignments > 0 && (
                              <Badge variant="secondary">
                                {group.inactiveAssignments} Inactive
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDialog(undefined, group.teacher.id);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Separator />
                    <CardContent className="pt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Medium</TableHead>
                            <TableHead>Max Students</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.assignments.map((assignment) => (
                            <TableRow
                              key={assignment.id}
                              className={cn(
                                !assignment.isActive && "opacity-60"
                              )}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">
                                    {assignment.subject?.name}
                                  </span>
                                  {assignment.subject?.code && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs font-mono"
                                    >
                                      {assignment.subject.code}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                  {assignment.grade?.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Languages className="h-4 w-4 text-muted-foreground" />
                                  {assignment.medium?.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  {assignment.maxStudents || "—"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={assignment.isActive}
                                    onCheckedChange={(checked) =>
                                      toggleStatusMutation.mutate({
                                        id: assignment.id,
                                        isActive: checked,
                                      })
                                    }
                                  />
                                  <span className="text-sm text-muted-foreground">
                                    {assignment.isActive
                                      ? "Active"
                                      : "Inactive"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleOpenDialog(assignment)
                                      }
                                    >
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit Assignment
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        duplicateAssignment(assignment)
                                      }
                                    >
                                      <Copy className="h-4 w-4 mr-2" />
                                      Duplicate for Another Grade
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => {
                                        setSelectedAssignment(assignment);
                                        setDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                {selectedAssignment
                  ? "Edit Assignment"
                  : "Create New Assignment"}
              </DialogTitle>
              <DialogDescription>
                {selectedAssignment
                  ? "Update the assignment details below"
                  : "Assign a teacher to a subject, grade, and medium combination"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>
                  Teacher <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.teacherProfileId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, teacherProfileId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers
                      ?.filter((teacher: any) => teacher.id)
                      .map((teacher: any) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          <div className="flex items-center gap-2">
                            <span>
                              {teacher.user?.firstName} {teacher.user?.lastName}
                            </span>
                            {teacher.employeeId && (
                              <span className="text-muted-foreground text-xs">
                                ({teacher.employeeId})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Subject <span className="text-red-500">*</span>
                  </Label>
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
                        ?.filter((subject: any) => subject.id)
                        .map((subject: any) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Grade <span className="text-red-500">*</span>
                  </Label>
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
                        ?.filter((grade: any) => grade.id)
                        .map((grade: any) => (
                          <SelectItem key={grade.id} value={grade.id}>
                            {grade.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Medium <span className="text-red-500">*</span>
                  </Label>
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
                        ?.filter((medium: any) => medium.id)
                        .map((medium: any) => (
                          <SelectItem key={medium.id} value={medium.id}>
                            {medium.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Students</Label>
                  <Input
                    type="number"
                    value={formData.maxStudents}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxStudents: parseInt(e.target.value) || 30,
                      })
                    }
                    placeholder="30"
                    min={1}
                    max={500}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                <div className="space-y-0.5">
                  <Label className="font-medium">Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Inactive assignments won't be available for scheduling
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : selectedAssignment
                    ? "Update Assignment"
                    : "Create Assignment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Delete Assignment
              </DialogTitle>
              <DialogDescription className="pt-2">
                Are you sure you want to delete this assignment?
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2">
                  <p>
                    <strong>Teacher:</strong>{" "}
                    {selectedAssignment?.teacherProfile?.user?.firstName}{" "}
                    {selectedAssignment?.teacherProfile?.user?.lastName}
                  </p>
                  <p>
                    <strong>Subject:</strong>{" "}
                    {selectedAssignment?.subject?.name}
                  </p>
                  <p>
                    <strong>Grade:</strong> {selectedAssignment?.grade?.name}
                  </p>
                  <p>
                    <strong>Medium:</strong> {selectedAssignment?.medium?.name}
                  </p>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  This action cannot be undone.
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setSelectedAssignment(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Assignment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
