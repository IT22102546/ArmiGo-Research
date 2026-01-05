"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  GraduationCap,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Users,
  BookOpen,
  Award,
  Activity,
  TrendingUp,
  FileText,
  Briefcase,
} from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";
import { examsApi } from "@/lib/api/endpoints/exams";
import { gradesApi } from "@/lib/api/endpoints/grades";
import { mediumsApi } from "@/lib/api/endpoints/mediums";
import { subjectsApi } from "@/lib/api/endpoints/subjects";
import { classesApi } from "@/lib/api/endpoints/classes";
import { teacherAssignmentsApi } from "@/lib/api/endpoints/teacher-assignments";
import { teacherTransferApi } from "@/lib/api/endpoints/teacher-transfers";
import { handleApiError } from "@/lib/error-handling";
import { format } from "date-fns";

// Helper to safely format dates without throwing on invalid dates
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

interface TeacherDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
  teacherProfile: {
    id: string;
    employeeId?: string;
    department?: string;
    specialization?: string;
    experience?: number;
    qualifications?: string[];
    canCreateExams: boolean;
    canMonitorExams: boolean;
    canManageClasses: boolean;
    maxStudentsPerClass?: number;
    sourceInstitution?: string;
    maxClassesPerWeek?: number;
    availability?: any;
    certifications?: string[];
    performanceRating?: number;
    lastEvaluationDate?: string;
    institutionId?: string;
    institution?: {
      id: string;
      name: string;
      code?: string;
    };
  };
}

interface TeacherAssignment {
  id: string;
  subjectId: string;
  gradeId: string;
  mediumId: string;
  academicYear: string;
  isActive: boolean;
  canCreateExams?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  subject?: {
    id: string;
    name: string;
    code?: string;
  };
  grade?: {
    id: string;
    name: string;
    level?: number;
  };
  medium?: {
    id: string;
    name: string;
  };
}

interface TeacherClass {
  id: string;
  name: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
  maxStudents?: number;
  subject: {
    id: string;
    name: string;
  };
  grade?: {
    name: string;
  };
}

interface TeacherExam {
  id: string;
  title: string;
  status: string;
  examDate?: string;
  duration: number;
  totalMarks: number;
  class: {
    id: string;
    name: string;
  };
}

interface TransferRequest {
  id: string;
  registrationId: string;
  currentSchool: string;
  currentZone: string;
  fromZone: string;
  toZones: string[];
  subject: string;
  medium: string;
  level: string;
  status: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export function TeacherDetailPage({
  teacherId,
  initialTab,
}: {
  teacherId: string;
  initialTab?: string | undefined;
}) {
  const router = useRouter();
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<string>(initialTab || "profile");
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [exams, setExams] = useState<TeacherExam[]>([]);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [attendancePattern, setAttendancePattern] = useState<
    Array<{
      date: string;
      sessions: number;
      present: number;
      total: number;
      percent: number;
    }>
  >([]);

  // Dialog states
  const [editProfileDialog, setEditProfileDialog] = useState(false);
  const [editPermissionsDialog, setEditPermissionsDialog] = useState(false);
  const [addAssignmentDialog, setAddAssignmentDialog] = useState(false);
  const [deactivateDialog, setDeactivateDialog] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState<any>({});
  const [permissionsForm, setPermissionsForm] = useState({
    canCreateExams: true,
    canMonitorExams: true,
    canManageClasses: true,
  });
  const [assignmentForm, setAssignmentForm] = useState({
    subjectId: "",
    gradeId: "",
    mediumId: "",
    academicYear: new Date().getFullYear().toString(),
    canCreateExams: true,
  });

  // Dropdown data
  const [grades, setGrades] = useState<
    Array<{ id: string; name: string; level?: number }>
  >([]);
  const [mediums, setMediums] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [subjects, setSubjects] = useState<
    Array<{ id: string; name: string; code?: string }>
  >([]);

  // Stats
  const [stats, setStats] = useState({
    totalClasses: 0,
    activeClasses: 0,
    totalExams: 0,
    averageFeedback: 0,
    attendanceRate: 0,
  });

  useEffect(() => {
    fetchTeacherDetails();
    fetchGrades();
    fetchMediums();
    fetchSubjects();
  }, [teacherId]);

  useEffect(() => {
    // Prefer path-based tab (e.g., /admin/teachers/<id>/assignments), fallback to ?tab=
    const pathSegs = pathname?.split("/") || [];
    // pathname segments: ["", "admin", "teachers", "<id>", "assignments"]
    const pathTab = pathSegs?.[4];
    const queryTab = searchParams?.get("tab");
    const candidate = pathTab ?? queryTab ?? initialTab ?? "profile";
    if (
      candidate &&
      [
        "profile",
        "assignments",
        "classes",
        "performance",
        "transfers",
      ].includes(candidate)
    ) {
      setActiveTab(candidate);
    }
  }, [searchParams, pathname, initialTab]);

  const fetchTeacherDetails = async () => {
    try {
      setLoading(true);
      const response = (await ApiClient.get(`/users/${teacherId}`)) as any;
      const teacherData = response.user || response;
      setTeacher(teacherData);

      // Initialize edit form
      setEditForm({
        firstName: teacherData.firstName,
        lastName: teacherData.lastName,
        email: teacherData.email,
        // Note: phone cannot be updated (primary identifier)
        employeeId: teacherData.teacherProfile?.employeeId || "",
        department: teacherData.teacherProfile?.department || "",
        specialization: teacherData.teacherProfile?.specialization || "",
        experience: teacherData.teacherProfile?.experience || 0,
        maxClassesPerWeek: teacherData.teacherProfile?.maxClassesPerWeek || 20,
        maxStudentsPerClass:
          teacherData.teacherProfile?.maxStudentsPerClass || 30,
      });

      // Initialize permissions form
      if (teacherData.teacherProfile) {
        setPermissionsForm({
          canCreateExams: teacherData.teacherProfile.canCreateExams,
          canMonitorExams: teacherData.teacherProfile.canMonitorExams,
          canManageClasses: teacherData.teacherProfile.canManageClasses,
        });
      }

      // Fetch related data
      if (teacherData.teacherProfile?.id) {
        await fetchAssignments(teacherData.teacherProfile.id);
        const classList = await fetchClasses(teacherId);
        await fetchExams(teacherId, classList);
        await fetchTransfers(teacherId);
        await fetchTeacherStats(teacherId);
        // Set initial performance stats
        setStats((prev) => ({
          ...prev,
          averageFeedback: teacherData.teacherProfile?.performanceRating || 0,
        }));
      }
    } catch (error) {
      handleApiError(error, "Failed to fetch teacher details");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async (teacherProfileId: string) => {
    try {
      const response = await teacherAssignmentsApi.getByTeacher(
        teacherProfileId,
        { includeInactive: true }
      );
      setAssignments(response.assignments || []);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    }
  };

  const fetchClasses = async (teacherId: string) => {
    try {
      // Backend may not expose classes by teacherId; fetch classes and filter
      const response = await classesApi.getAll({
        page: 1,
        limit: 100,
        teacherId,
      });
      const classListRaw = Array.isArray(response)
        ? response
        : response.data || response.classes || [];
      const classList = classListRaw.filter(
        (c: any) => c.teacher?.id === teacherId
      ) as TeacherClass[];
      setClasses(classList);
      return classList;

      // Calculate stats
      const active = classList.filter((c) => c.status === "ACTIVE").length;
      setStats((prev) => ({
        ...prev,
        totalClasses: classList.length,
        activeClasses: active,
      }));
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    }
  };

  const fetchExams = async (teacherId: string, classList?: TeacherClass[]) => {
    try {
      // Load all exams and filter by classes owned by this teacher
      const response = await examsApi.getAll({ limit: 100, teacherId });
      const examsData = Array.isArray(response)
        ? response
        : response.data || response.exams || [];
      const classIds = (classList || classes).map((c) => c.id);
      const examsList = examsData.filter((exam: any) =>
        classIds.includes(exam.class?.id)
      );
      setExams(examsList || []);
      setStats((prev) => ({
        ...prev,
        totalExams: examsList.length,
      }));
    } catch (error) {
      console.error("Failed to fetch exams:", error);
    }
  };

  const fetchTeacherStats = async (teacherId: string) => {
    try {
      const response = await ApiClient.get<any>(
        `/users/${teacherId}/teacher-stats`
      );
      if (response) {
        setStats((prev) => ({
          ...prev,
          totalClasses: response.totalClasses || prev.totalClasses,
          activeClasses: response.activeClasses || prev.activeClasses,
          totalExams: response.totalExams || prev.totalExams,
          attendanceRate:
            response.avgAttendancePercent ||
            response.avgAttendance ||
            response.averageAttendancePercent ||
            prev.attendanceRate ||
            0,
          averageFeedback:
            response.averageFeedback ||
            prev.averageFeedback ||
            prev.averageFeedback ||
            0,
        }));
        setAttendancePattern(response.attendancePattern || []);
      }
    } catch (error) {
      console.error("Failed to fetch teacher stats:", error);
    }
  };

  const fetchTransfers = async (teacherId: string) => {
    try {
      const response = await ApiClient.get<{
        transfers: TransferRequest[];
      }>(`/teacher-transfers?requesterId=${teacherId}`);
      setTransfers(response.transfers || []);
    } catch (error) {
      console.error("Failed to fetch transfers:", error);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await gradesApi.getAll({ includeInactive: true });
      if (Array.isArray(response)) {
        setGrades(response);
      } else {
        setGrades(response.grades || []);
      }
    } catch (error) {
      console.error("Failed to fetch grades:", error);
    }
  };

  const fetchMediums = async () => {
    try {
      const response = await mediumsApi.getAll({ includeInactive: true });
      if (Array.isArray(response)) {
        setMediums(response);
      } else {
        setMediums(response.mediums || []);
      }
    } catch (error) {
      console.error("Failed to fetch mediums:", error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await subjectsApi.findAll(true);
      setSubjects(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    }
  };

  const handleEditProfile = async () => {
    try {
      await ApiClient.patch(`/users/${teacherId}`, editForm);
      await fetchTeacherDetails();
      setEditProfileDialog(false);
    } catch (error) {
      handleApiError(error, "Failed to update teacher profile");
    }
  };

  const handleUpdatePermissions = async () => {
    try {
      await ApiClient.patch(`/users/${teacherId}/teacher-profile`, {
        canCreateExams: permissionsForm.canCreateExams,
        canMonitorExams: permissionsForm.canMonitorExams,
        canManageClasses: permissionsForm.canManageClasses,
      });
      await fetchTeacherDetails();
      setEditPermissionsDialog(false);
    } catch (error) {
      handleApiError(error, "Failed to update permissions");
    }
  };

  const handleAddAssignment = async () => {
    try {
      if (!teacher?.teacherProfile?.id) return;

      await teacherAssignmentsApi.create({
        teacherProfileId: teacher.teacherProfile.id,
        subjectId: assignmentForm.subjectId,
        gradeId: assignmentForm.gradeId,
        mediumId: assignmentForm.mediumId,
        academicYear: assignmentForm.academicYear,
        canCreateExams: assignmentForm.canCreateExams,
      });

      await fetchAssignments(teacher.teacherProfile.id);
      setAddAssignmentDialog(false);
      setAssignmentForm({
        subjectId: "",
        gradeId: "",
        mediumId: "",
        academicYear: new Date().getFullYear().toString(),
        canCreateExams: true,
      });
    } catch (error) {
      handleApiError(error, "Failed to add assignment");
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      await teacherAssignmentsApi.delete(assignmentId);
      if (teacher?.teacherProfile?.id) {
        await fetchAssignments(teacher.teacherProfile.id);
      }
    } catch (error) {
      handleApiError(error, "Failed to remove assignment");
    }
  };

  const handleDeactivate = async () => {
    try {
      const newStatus = teacher?.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await ApiClient.patch(`/users/${teacherId}/status`, {
        status: newStatus,
      });
      await fetchTeacherDetails();
      setDeactivateDialog(false);
    } catch (error) {
      handleApiError(error, "Failed to update teacher status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Teacher Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The teacher you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/admin/users")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  const profile = teacher.teacherProfile;
  const isExternal =
    profile?.sourceInstitution !== null &&
    profile?.sourceInstitution !== undefined;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/users")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {teacher.firstName} {teacher.lastName}
            </h1>
            <p className="text-muted-foreground">Teacher Profile</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditProfileDialog(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
          <Button
            variant={teacher.status === "ACTIVE" ? "destructive" : "default"}
            onClick={() => setDeactivateDialog(true)}
          >
            {teacher.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeClasses} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exams Created</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExams}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">
              {assignments.filter((a) => a.isActive).length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Feedback</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profile?.performanceRating?.toFixed(1) || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">Out of 5.0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Experience</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.experience || 0}</div>
            <p className="text-xs text-muted-foreground">Years</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v);
          // update url with path-based tab
          if (v === "profile") {
            router.replace(`/admin/teachers/${teacherId}`);
          } else {
            router.replace(`/admin/teachers/${teacherId}/${v}`);
          }
        }}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="classes">Classes & Exams</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          {isExternal && <TabsTrigger value="transfers">Transfers</TabsTrigger>}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Personal and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">First Name</Label>
                    <p className="font-medium">{teacher.firstName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Name</Label>
                    <p className="font-medium">{teacher.lastName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{teacher.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{teacher.phoneNumber}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        teacher.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {teacher.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Professional Details</CardTitle>
                <CardDescription>Employment and qualifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Role</Label>
                  <div className="mt-1">
                    <Badge variant={isExternal ? "outline" : "default"}>
                      {isExternal ? "External Teacher" : "Internal Teacher"}
                    </Badge>
                  </div>
                </div>
                {profile?.employeeId && (
                  <div>
                    <Label className="text-muted-foreground">
                      Employee/Registration ID
                    </Label>
                    <p className="font-medium">{profile.employeeId}</p>
                  </div>
                )}
                {profile?.department && (
                  <div>
                    <Label className="text-muted-foreground">Department</Label>
                    <p className="font-medium">{profile.department}</p>
                  </div>
                )}
                {profile?.specialization && (
                  <div>
                    <Label className="text-muted-foreground">
                      Specialization
                    </Label>
                    <p className="font-medium">{profile.specialization}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Experience</Label>
                  <p className="font-medium">
                    {profile?.experience || 0} years
                  </p>
                </div>
                {isExternal && profile?.sourceInstitution && (
                  <div>
                    <Label className="text-muted-foreground">
                      Source Institution/Zone
                    </Label>
                    <p className="font-medium">{profile.sourceInstitution}</p>
                  </div>
                )}
                {profile?.institution && (
                  <div>
                    <Label className="text-muted-foreground">
                      Current Institution
                    </Label>
                    <p className="font-medium">{profile.institution.name}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Qualifications & Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile?.qualifications &&
                profile.qualifications.length > 0 ? (
                  <div>
                    <Label className="text-muted-foreground">
                      Qualifications
                    </Label>
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      {profile.qualifications.map((qual, idx) => (
                        <li key={idx} className="text-sm">
                          {qual}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {profile?.certifications &&
                profile.certifications.length > 0 ? (
                  <div>
                    <Label className="text-muted-foreground">
                      Certifications
                    </Label>
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      {profile.certifications.map((cert, idx) => (
                        <li key={idx} className="text-sm">
                          {cert}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {(!profile?.qualifications ||
                  profile.qualifications.length === 0) &&
                  (!profile?.certifications ||
                    profile.certifications.length === 0) && (
                    <p className="text-sm text-muted-foreground">
                      No qualifications or certifications recorded
                    </p>
                  )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Permissions</CardTitle>
                <CardDescription>
                  Teaching and management permissions
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditPermissionsDialog(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Can Create Exams</span>
                  </div>
                  {profile?.canCreateExams ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Can Monitor Exams</span>
                  </div>
                  {profile?.canMonitorExams ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Can Manage Classes</span>
                  </div>
                  {profile?.canManageClasses ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capacity & Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">
                  Max Classes Per Week
                </Label>
                <p className="font-medium">
                  {profile?.maxClassesPerWeek || "Not set"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">
                  Max Students Per Class
                </Label>
                <p className="font-medium">
                  {profile?.maxStudentsPerClass || "Not set"}
                </p>
              </div>
              {profile?.lastEvaluationDate && (
                <div>
                  <Label className="text-muted-foreground">
                    Last Evaluation
                  </Label>
                  <p className="font-medium">
                    {safeFormatDate(profile.lastEvaluationDate, "PPP")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Subject Assignments</CardTitle>
                <CardDescription>
                  Grades, subjects, and mediums assigned to this teacher
                </CardDescription>
              </div>
              <Button onClick={() => setAddAssignmentDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Assignment
              </Button>
            </CardHeader>
            <CardContent>
              {assignments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Medium</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Can Create Exams</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          {assignment.subject?.name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {assignment.grade?.name ||
                            `Grade ${assignment.grade?.level}` ||
                            "Unknown"}
                        </TableCell>
                        <TableCell>
                          {assignment.medium?.name || "Unknown"}
                        </TableCell>
                        <TableCell>{assignment.academicYear}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              assignment.isActive ? "default" : "secondary"
                            }
                          >
                            {assignment.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {assignment.canCreateExams ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveAssignment(assignment.id)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No assignments found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classes & Exams Tab */}
        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Classes</CardTitle>
              <CardDescription>Classes owned by this teacher</CardDescription>
            </CardHeader>
            <CardContent>
              {classes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Max Students</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">
                          {cls.name}
                        </TableCell>
                        <TableCell>{cls.subject?.name || "N/A"}</TableCell>
                        <TableCell>{cls.grade?.name || "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              cls.status === "ACTIVE" ? "default" : "secondary"
                            }
                          >
                            {cls.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {safeFormatDate(cls.startDate, "PPP")}
                        </TableCell>
                        <TableCell>
                          {safeFormatDate(cls.endDate, "PPP")}
                        </TableCell>
                        <TableCell>{cls.maxStudents || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No classes found
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exams Created</CardTitle>
              <CardDescription>Exams created by this teacher</CardDescription>
            </CardHeader>
            <CardContent>
              {exams.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Exam Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Total Marks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exams.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">
                          {exam.title}
                        </TableCell>
                        <TableCell>{exam.class?.name || "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              exam.status === "PUBLISHED"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {exam.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {exam.examDate
                            ? safeFormatDate(exam.examDate, "PPP")
                            : "Not scheduled"}
                        </TableCell>
                        <TableCell>{exam.duration} mins</TableCell>
                        <TableCell>{exam.totalMarks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No exams found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">
                    Performance Rating
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-2xl font-bold">
                      {profile?.performanceRating?.toFixed(1) || "N/A"}
                    </div>
                    <span className="text-sm text-muted-foreground">/ 5.0</span>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Total Classes Conducted
                  </Label>
                  <p className="text-2xl font-bold mt-1">
                    {stats.totalClasses}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Active Classes
                  </Label>
                  <p className="text-2xl font-bold mt-1">
                    {stats.activeClasses}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Exams Created</Label>
                  <p className="text-2xl font-bold mt-1">{stats.totalExams}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Class Attendance Pattern</CardTitle>
                <CardDescription>
                  Average attendance in teacher's classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Average attendance rate
                  </p>
                </div>
                <div className="mt-4">
                  {attendancePattern.length > 0 ? (
                    <svg
                      viewBox="0 0 100 30"
                      preserveAspectRatio="none"
                      className="w-full h-10"
                    >
                      {(() => {
                        const max = 100;
                        const step =
                          100 / Math.max(1, attendancePattern.length - 1);
                        return attendancePattern.map((p, i) => {
                          const x = i * step;
                          const y = 30 - (p.percent / max) * 30;
                          return (
                            <circle
                              key={p.date}
                              cx={x}
                              cy={y}
                              r={1.2}
                              fill="#0ea5e9"
                            />
                          );
                        });
                      })()}
                      {(() => {
                        const max = 100;
                        const step =
                          100 / Math.max(1, attendancePattern.length - 1);
                        const path = attendancePattern
                          .map((p, i) => {
                            const x = i * step;
                            const y = 30 - (p.percent / max) * 30;
                            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                          })
                          .join(" ");
                        return (
                          <path
                            d={path}
                            fill="none"
                            stroke="#0ea5e9"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        );
                      })()}
                    </svg>
                  ) : (
                    <p className="text-center text-muted-foreground py-2">
                      No attendance data
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Average Feedback Score</CardTitle>
              <CardDescription>
                Student feedback across all classes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-4xl font-bold">
                  {stats.averageFeedback.toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Out of 5.0 stars
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transfers Tab */}
        {isExternal && (
          <TabsContent value="transfers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transfer Requests</CardTitle>
                <CardDescription>
                  Transfer requests submitted by this external teacher
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transfers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Registration ID</TableHead>
                        <TableHead>Current School</TableHead>
                        <TableHead>From Zone</TableHead>
                        <TableHead>To Zones</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Medium</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transfers.map((transfer) => (
                        <TableRow key={transfer.id}>
                          <TableCell className="font-medium">
                            {transfer.registrationId}
                          </TableCell>
                          <TableCell>{transfer.currentSchool}</TableCell>
                          <TableCell>{transfer.fromZone}</TableCell>
                          <TableCell>{transfer.toZones.join(", ")}</TableCell>
                          <TableCell>{transfer.subject}</TableCell>
                          <TableCell>{transfer.medium}</TableCell>
                          <TableCell>{transfer.level}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                transfer.status === "COMPLETED"
                                  ? "default"
                                  : transfer.status === "REJECTED"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {transfer.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {transfer.verified ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </TableCell>
                          <TableCell>
                            {safeFormatDate(transfer.createdAt, "PPP")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No transfer requests found
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileDialog} onOpenChange={setEditProfileDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Teacher Profile</DialogTitle>
            <DialogDescription>
              Update teacher information and professional details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email (Read-only)</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email || ""}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>
            <div>
              <Label htmlFor="employeeId">Employee/Registration ID</Label>
              <Input
                id="employeeId"
                value={editForm.employeeId || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, employeeId: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={editForm.department || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, department: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={editForm.specialization || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, specialization: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="experience">Experience (Years)</Label>
              <Input
                id="experience"
                type="number"
                value={editForm.experience || 0}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    experience: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="maxClassesPerWeek">Max Classes Per Week</Label>
              <Input
                id="maxClassesPerWeek"
                type="number"
                value={editForm.maxClassesPerWeek || 20}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    maxClassesPerWeek: parseInt(e.target.value) || 20,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="maxStudentsPerClass">
                Max Students Per Class
              </Label>
              <Input
                id="maxStudentsPerClass"
                type="number"
                value={editForm.maxStudentsPerClass || 30}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    maxStudentsPerClass: parseInt(e.target.value) || 30,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditProfileDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog
        open={editPermissionsDialog}
        onOpenChange={setEditPermissionsDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Permissions</DialogTitle>
            <DialogDescription>
              Manage teaching and class management permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canCreateExams"
                checked={permissionsForm.canCreateExams}
                onCheckedChange={(checked) =>
                  setPermissionsForm({
                    ...permissionsForm,
                    canCreateExams: checked === true,
                  })
                }
              />
              <Label htmlFor="canCreateExams" className="cursor-pointer">
                Can Create Exams
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canMonitorExams"
                checked={permissionsForm.canMonitorExams}
                onCheckedChange={(checked) =>
                  setPermissionsForm({
                    ...permissionsForm,
                    canMonitorExams: checked === true,
                  })
                }
              />
              <Label htmlFor="canMonitorExams" className="cursor-pointer">
                Can Monitor Exams
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canManageClasses"
                checked={permissionsForm.canManageClasses}
                onCheckedChange={(checked) =>
                  setPermissionsForm({
                    ...permissionsForm,
                    canManageClasses: checked === true,
                  })
                }
              />
              <Label htmlFor="canManageClasses" className="cursor-pointer">
                Can Manage Classes
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditPermissionsDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdatePermissions}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Assignment Dialog */}
      <Dialog open={addAssignmentDialog} onOpenChange={setAddAssignmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subject Assignment</DialogTitle>
            <DialogDescription>
              Assign a subject, grade, and medium to this teacher
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="subjectId">Subject</Label>
              <Select
                value={assignmentForm.subjectId}
                onValueChange={(value) =>
                  setAssignmentForm({ ...assignmentForm, subjectId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects
                    .filter((subject) => subject.id)
                    .map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                        {subject.code && ` (${subject.code})`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="gradeId">Grade</Label>
              <Select
                value={assignmentForm.gradeId}
                onValueChange={(value) =>
                  setAssignmentForm({ ...assignmentForm, gradeId: value })
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
                        {grade.name || `Grade ${grade.level}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mediumId">Medium</Label>
              <Select
                value={assignmentForm.mediumId}
                onValueChange={(value) =>
                  setAssignmentForm({ ...assignmentForm, mediumId: value })
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
            <div>
              <Label htmlFor="academicYear">Academic Year</Label>
              <Input
                id="academicYear"
                value={assignmentForm.academicYear}
                onChange={(e) =>
                  setAssignmentForm({
                    ...assignmentForm,
                    academicYear: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canCreateExamsAssignment"
                checked={assignmentForm.canCreateExams}
                onCheckedChange={(checked) =>
                  setAssignmentForm({
                    ...assignmentForm,
                    canCreateExams: checked === true,
                  })
                }
              />
              <Label
                htmlFor="canCreateExamsAssignment"
                className="cursor-pointer"
              >
                Can create exams for this assignment
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddAssignmentDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddAssignment}>Add Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate/Reactivate Dialog */}
      <Dialog open={deactivateDialog} onOpenChange={setDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {teacher.status === "ACTIVE" ? "Deactivate" : "Reactivate"}{" "}
              Teacher
            </DialogTitle>
            <DialogDescription>
              {teacher.status === "ACTIVE"
                ? "Are you sure you want to deactivate this teacher? They will not be able to access their classes or exams."
                : "Are you sure you want to reactivate this teacher? They will regain access to their classes and exams."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeactivateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant={teacher.status === "ACTIVE" ? "destructive" : "default"}
              onClick={handleDeactivate}
            >
              {teacher.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
