"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge, BadgeVariant } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserPlus,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  BookOpen,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
const logger = createLogger("StudentEnrollmentManagement");
import { GradeSelect } from "@/components/shared/selects";
import { AcademicYearSelect } from "@/components/shared/selects/AcademicYearSelect";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  studentProfile?: {
    grade?: string;
    batch?: string;
  };
}

interface Class {
  id: string;
  name: string;
  subject?: {
    id: string;
    name: string;
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

interface Enrollment {
  id: string;
  classId: string;
  studentId: string;
  status: string;
  enrolledAt: string;
  progress: number;
  isPaid: boolean;
  student: Student;
  class: Class;
}

interface EnrollmentStats {
  total: number;
  active: number;
  completed: number;
  pending: number;
}

const StudentEnrollmentManagement: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EnrollmentStats>({
    total: 0,
    active: 0,
    completed: 0,
    pending: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [academicYearFilter, setAcademicYearFilter] = useState<string>("");
  const [activeTab, setActiveTab] = useState("all");

  // Modals
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<Enrollment | null>(null);

  // New Enrollment Form
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchEnrollments();
    fetchStudents();
    fetchClasses();
  }, []);

  useEffect(() => {
    filterEnrollments();
  }, [
    enrollments,
    searchTerm,
    statusFilter,
    gradeFilter,
    paymentFilter,
    academicYearFilter,
    activeTab,
  ]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.get<Enrollment[]>("/enrollments");
      const enrollmentData = Array.isArray(response) ? response : [];
      setEnrollments(enrollmentData);
      calculateStats(enrollmentData);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      toast.error("Failed to load enrollments");
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await ApiClient.get<any>("/users", {
        params: {
          role: "INTERNAL_STUDENT,EXTERNAL_STUDENT",
          limit: 1000,
        },
      });
      const studentsArr = Array.isArray(response)
        ? response
        : (response.data ?? []);
      setStudents(studentsArr);
    } catch (error) {
      console.error(" Error fetching students:", error);
      setStudents([]);
    }
  };

  const fetchClasses = async () => {
    try {
      // Remove status filter to avoid 500 error
      const response = await ApiClient.get<any>("/classes", {
        params: { limit: 1000, status: "ACTIVE" },
      });
      const classesArr = Array.isArray(response)
        ? response
        : (response.data ?? []);
      setClasses(classesArr);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setClasses([]);
    }
  };

  const calculateStats = (data: Enrollment[]) => {
    const stats = {
      total: data.length,
      active: data.filter((e) => e.status === "ACTIVE").length,
      completed: data.filter((e) => e.status === "COMPLETED").length,
      pending: data.filter((e) => e.status === "PENDING").length,
    };
    setStats(stats);
  };

  const filterEnrollments = () => {
    let filtered = [...enrollments];

    // Tab filter (student type)
    if (activeTab !== "all") {
      filtered = filtered.filter((e) => {
        const isInternal = e.student?.role === "INTERNAL_STUDENT";
        return activeTab === "internal" ? isInternal : !isInternal;
      });
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          `${e.student?.firstName || ""} ${e.student?.lastName || ""}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          e.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.class?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    // Grade filter
    if (gradeFilter) {
      filtered = filtered.filter((e) => e.class?.grade?.id === gradeFilter);
    }

    // Payment filter
    if (paymentFilter !== "all") {
      const isPaid = paymentFilter === "paid";
      filtered = filtered.filter((e) => e.isPaid === isPaid);
    }

    setFilteredEnrollments(filtered);
  };

  const handleEnrollStudent = async () => {
    if (!selectedStudent || !selectedClass) {
      toast.error("Please select both student and class");
      return;
    }

    setEnrolling(true);
    try {
      await ApiClient.post("/enrollments", {
        studentId: selectedStudent,
        classId: selectedClass,
        status: "ACTIVE",
      });
      handleApiSuccess("Student enrolled successfully");
      setIsEnrollModalOpen(false);
      setSelectedStudent("");
      setSelectedClass("");
      fetchEnrollments();
    } catch (error) {
      logger.error("Error enrolling student:", error);
      handleApiError(
        error,
        "StudentEnrollmentManagement.handleEnrollStudent",
        "Failed to enroll student"
      );
    } finally {
      setEnrolling(false);
    }
  };

  const handleRemoveEnrollment = async (id: string) => {
    if (!confirm("Are you sure you want to remove this enrollment?")) {
      return;
    }

    try {
      await ApiClient.delete(`/enrollments/${id}`);
      handleApiSuccess("Enrollment removed successfully");
      fetchEnrollments();
    } catch (error) {
      logger.error("Error removing enrollment:", error);
      handleApiError(
        error,
        "StudentEnrollmentManagement.handleRemoveEnrollment",
        "Failed to remove enrollment"
      );
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await ApiClient.patch(`/enrollments/${id}`, { status: newStatus });
      handleApiSuccess("Enrollment status updated");
      fetchEnrollments();
    } catch (error) {
      logger.error("Error updating enrollment:", error);
      handleApiError(
        error,
        "StudentEnrollmentManagement.handleUpdateStatus",
        "Failed to update status"
      );
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: BadgeVariant; className: string }
    > = {
      ACTIVE: { variant: "default", className: "bg-green-500" },
      PENDING: { variant: "default", className: "bg-yellow-500" },
      COMPLETED: { variant: "default", className: "bg-blue-500" },
      CANCELLED: { variant: "secondary", className: "" },
    };

    const config = variants[status] || { variant: "secondary", className: "" };
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Enrollments
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Student Enrollment Management
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={fetchEnrollments} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setIsEnrollModalOpen(true)} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Enroll Student
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students or classes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <GradeSelect
              value={gradeFilter}
              onValueChange={setGradeFilter}
              placeholder="All Grades"
            />
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Students</TabsTrigger>
              <TabsTrigger value="internal">Internal Students</TabsTrigger>
              <TabsTrigger value="external">External Students</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredEnrollments.length === 0 ? (
                <div className="text-center py-12 border rounded-md bg-muted/30">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No enrollments found</p>
                  <Button
                    onClick={() => setIsEnrollModalOpen(true)}
                    variant="outline"
                    className="mt-4"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Enroll First Student
                  </Button>
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <div className="min-w-full inline-block align-middle">
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[150px]">
                              Student
                            </TableHead>
                            <TableHead className="min-w-[150px]">
                              Class
                            </TableHead>
                            <TableHead className="min-w-[120px]">
                              Subject
                            </TableHead>
                            <TableHead className="min-w-[100px]">
                              Grade
                            </TableHead>
                            <TableHead className="min-w-[100px]">
                              Medium
                            </TableHead>
                            <TableHead className="min-w-[100px]">
                              Status
                            </TableHead>
                            <TableHead className="min-w-[100px]">
                              Progress
                            </TableHead>
                            <TableHead className="min-w-[100px]">
                              Payment
                            </TableHead>
                            <TableHead className="text-right min-w-[120px]">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEnrollments.map((enrollment) => (
                            <TableRow key={enrollment.id}>
                              <TableCell className="font-medium">
                                <div>
                                  <div>
                                    {enrollment.student.firstName}{" "}
                                    {enrollment.student.lastName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {enrollment.student.email}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
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
                                {getStatusBadge(enrollment.status)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                    {/* eslint-disable-next-line react/forbid-dom-props */}
                                    <div
                                      className="h-full bg-primary transition-all"
                                      style={{
                                        width: `${Math.min(100, enrollment.progress || 0)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs">
                                    {enrollment.progress || 0}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    enrollment.isPaid ? "default" : "outline"
                                  }
                                >
                                  {enrollment.isPaid ? "Paid" : "Unpaid"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedEnrollment(enrollment);
                                      setIsViewModalOpen(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveEnrollment(enrollment.id)
                                    }
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Enroll Student Modal */}
      <Dialog open={isEnrollModalOpen} onOpenChange={setIsEnrollModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enroll Student in Class</DialogTitle>
            <DialogDescription>
              Select a student and class to create a new enrollment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Student *</Label>
              <Select
                value={selectedStudent}
                onValueChange={setSelectedStudent}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students
                    .filter((student) => student.id)
                    .map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName} ({student.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Class *</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes
                    .filter((cls) => cls.id)
                    .map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.subject?.name || "N/A"} (
                        {cls.grade?.name || "N/A"})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEnrollModalOpen(false)}
              disabled={enrolling}
            >
              Cancel
            </Button>
            <Button onClick={handleEnrollStudent} disabled={enrolling}>
              {enrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enroll Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Enrollment Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enrollment Details</DialogTitle>
          </DialogHeader>
          {selectedEnrollment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Student</Label>
                  <p className="font-medium">
                    {selectedEnrollment.student.firstName}{" "}
                    {selectedEnrollment.student.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">
                    {selectedEnrollment.student.email}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Class</Label>
                  <p className="font-medium">
                    {selectedEnrollment.class?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Subject</Label>
                  <p className="font-medium">
                    {selectedEnrollment.class?.subject?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Grade</Label>
                  <p className="font-medium">
                    {selectedEnrollment.class?.grade?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Medium</Label>
                  <p className="font-medium">
                    {selectedEnrollment.class?.medium?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedEnrollment.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment</Label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        selectedEnrollment.isPaid ? "default" : "outline"
                      }
                    >
                      {selectedEnrollment.isPaid ? "Paid" : "Unpaid"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Progress</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      {/* eslint-disable-next-line react/forbid-dom-props */}
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${Math.min(100, selectedEnrollment.progress || 0)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {selectedEnrollment.progress || 0}%
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Enrolled At</Label>
                  <p className="font-medium">
                    {new Date(
                      selectedEnrollment.enrolledAt
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Label>Update Status</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant={
                      selectedEnrollment.status === "ACTIVE"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      handleUpdateStatus(selectedEnrollment.id, "ACTIVE")
                    }
                  >
                    Active
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      selectedEnrollment.status === "PENDING"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      handleUpdateStatus(selectedEnrollment.id, "PENDING")
                    }
                  >
                    Pending
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      selectedEnrollment.status === "COMPLETED"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      handleUpdateStatus(selectedEnrollment.id, "COMPLETED")
                    }
                  >
                    Completed
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      selectedEnrollment.status === "CANCELLED"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      handleUpdateStatus(selectedEnrollment.id, "CANCELLED")
                    }
                  >
                    Cancelled
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentEnrollmentManagement;
