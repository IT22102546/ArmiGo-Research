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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  GraduationCap,
  BookOpen,
  Loader2,
  Download,
  RefreshCw,
  Users,
  UserCog,
  CheckCircle2,
  Clock,
  Ban,
  AlertTriangle,
  TrendingUp,
  Calendar,
  ShieldCheck,
  Mail,
  Phone,
  Shield,
  MoreVertical,
  ExternalLink,
  XCircle,
  MapPin,
  UserCheck,
  UserX,
  Key,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { createLogger } from "@/lib/utils/logger";
import { handleApiError, handleApiSuccess } from "@/lib/error-handling";
import { usersApi } from "@/lib/api/endpoints/users";
import {
  teacherAssignmentsApi,
  TeacherAssignment,
} from "@/lib/api/endpoints/teacher-assignments";
import { gradesApi } from "@/lib/api/endpoints/grades";
import { mediumsApi } from "@/lib/api/endpoints/mediums";
import { subjectsApi } from "@/lib/api/endpoints/subjects";
import { academicYearsApi } from "@/lib/api/endpoints/academic-years";
import { ApiClient } from "@/lib/api/api-client";
import type { User } from "@/lib/api/types/auth.types";
import type {
  TeacherProfile,
  Grade,
  Medium,
  Subject,
  AcademicYear,
} from "@/lib/types";
import type { CreateTeacherAssignmentDto } from "@/lib/api/endpoints/teacher-assignments";
import { useTranslations } from "next-intl";

const logger = createLogger("TeacherManagement");

// Extended User type with profile information
interface UserWithProfile {
  id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: User["role"];
  status?: string;
  isActive?: boolean;
  avatar?: string;
  teacherProfile?: TeacherProfile;
  createdAt?: string;
  updatedAt?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
}

interface TeacherStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  verifiedUsers: number;
  unverifiedUsers: number;
}

const TeacherManagement: React.FC = () => {
  const t = useTranslations("users");
  const [activeTab, setActiveTab] = useState<string>("INTERNAL_TEACHER");
  const [teachers, setTeachers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedTeacher, setSelectedTeacher] =
    useState<UserWithProfile | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewTeacher, setQuickViewTeacher] =
    useState<UserWithProfile | null>(null);
  const [loadingQuickView, setLoadingQuickView] = useState(false);
  const [stats, setStats] = useState<TeacherStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    suspendedUsers: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
  });

  // Reference data
  const [grades, setGrades] = useState<Grade[]>([]);
  const [mediums, setMediums] = useState<Medium[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>("");

  // Load reference data on mount
  useEffect(() => {
    loadReferenceData();
  }, []);

  // Load teachers when tab changes
  useEffect(() => {
    loadTeachers();
    fetchStats();
  }, [activeTab]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = (await ApiClient.get(
        `/users/stats?role=${activeTab}`
      )) as TeacherStats;
      setStats(
        response || {
          totalUsers: 0,
          activeUsers: 0,
          pendingUsers: 0,
          suspendedUsers: 0,
          newUsersToday: 0,
          newUsersThisWeek: 0,
          verifiedUsers: 0,
          unverifiedUsers: 0,
        }
      );
    } catch (error) {
      console.debug("Stats endpoint not available");
    } finally {
      setLoadingStats(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      const [gradesRes, mediumsRes, subjectsRes, yearsRes] = await Promise.all([
        gradesApi.getAll({ includeInactive: false }),
        mediumsApi.getAll({ includeInactive: false }),
        subjectsApi.findAll(false),
        academicYearsApi.getAll(),
      ]);

      setGrades(gradesRes.grades || []);
      setMediums(mediumsRes.mediums || []);
      setSubjects(subjectsRes || []);
      setAcademicYears(yearsRes.academicYears || []);

      const current = yearsRes.academicYears?.find(
        (y: AcademicYear) => y.isCurrent
      );
      if (current) setCurrentAcademicYear(current.year);
    } catch (error) {
      logger.error("Error loading reference data:", error);
      handleApiError(
        error,
        "TeacherManagement.loadReferenceData",
        "Failed to load reference data"
      );
    }
  };

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const response = await usersApi.getAll({ role: activeTab });
      console.log("[TeacherManagement] Teachers API Response:", response);
      console.log("[TeacherManagement] Response structure:", {
        hasUsers: !!response?.users,
        usersLength: response?.users?.length || 0,
        hasData: !!response?.data,
        dataLength: response?.data?.length || 0,
      });
      const teachersData = response?.users || [];
      console.log("[TeacherManagement] Teachers Data:", teachersData);
      console.log("[TeacherManagement] First teacher sample:", teachersData[0]);
      setTeachers(teachersData as UserWithProfile[]);
    } catch (error) {
      logger.error("Error loading teachers:", error);
      handleApiError(
        error,
        "TeacherManagement.loadTeachers",
        "Failed to load teachers"
      );
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter teachers based on search and filters
  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      searchTerm === "" ||
      `${teacher.firstName} ${teacher.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || teacher.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Debug filtering
  React.useEffect(() => {
    console.log("[TeacherManagement] Filtering debug:", {
      totalTeachers: teachers.length,
      filteredTeachers: filteredTeachers.length,
      filterStatus,
      searchTerm,
      sampleStatus: teachers[0]?.status,
    });
  }, [teachers.length, filteredTeachers.length, filterStatus, searchTerm]);

  const handleDelete = async () => {
    if (!teacherToDelete) return;

    try {
      await usersApi.delete(teacherToDelete);
      toast.success(t("teacherManagement.deleteSuccess"));
      loadTeachers();
      fetchStats();
      setDeleteDialogOpen(false);
      setTeacherToDelete(null);
    } catch (error) {
      logger.error("Error deleting teacher:", error);
      handleApiError(
        error,
        "TeacherManagement.handleDelete",
        "Failed to delete teacher"
      );
    }
  };

  const fetchQuickViewData = async (teacher: UserWithProfile) => {
    setLoadingQuickView(true);
    setQuickViewTeacher(teacher);
    setQuickViewOpen(true);
    try {
      // Fetch additional data if needed (assignments, workload, etc.)
      const enrichedTeacher = { ...teacher };
      setQuickViewTeacher(enrichedTeacher);
    } catch (error) {
      console.debug("Quick view data not fully available");
    } finally {
      setLoadingQuickView(false);
    }
  };

  const openDeleteDialog = (teacherId: string) => {
    setTeacherToDelete(teacherId);
    setDeleteDialogOpen(true);
  };

  const openAssignModal = (teacher: UserWithProfile) => {
    setSelectedTeacher(teacher);
    setIsAssignModalOpen(true);
  };

  const handleExport = () => {
    usersApi.exportUsers({
      role: activeTab,
      status: filterStatus === "all" ? undefined : filterStatus,
      search: searchTerm || undefined,
    });
    toast.success(t("teacherManagement.exportStarted"));
  };

  const handleRefresh = () => {
    loadTeachers();
    fetchStats();
  };

  // Verification badges component
  const getVerificationBadges = (user: UserWithProfile) => {
    const badges: React.ReactNode[] = [];

    if (user.emailVerified) {
      badges.push(
        <TooltipProvider key="email">
          <Tooltip>
            <TooltipTrigger>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1"
              >
                <Mail className="h-3 w-3" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Email Verified</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (user.phoneVerified) {
      badges.push(
        <TooltipProvider key="phone">
          <Tooltip>
            <TooltipTrigger>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1"
              >
                <Phone className="h-3 w-3" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Phone Verified</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (user.twoFactorEnabled) {
      badges.push(
        <TooltipProvider key="2fa">
          <Tooltip>
            <TooltipTrigger>
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-1"
              >
                <Shield className="h-3 w-3" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>2FA Enabled</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return badges.length > 0 ? (
      <div className="flex items-center gap-1">{badges}</div>
    ) : (
      <span className="text-xs text-muted-foreground">-</span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {t("teacherManagement.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("teacherManagement.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh Data</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1.5" />
            {t("teacherManagement.export")}
          </Button>
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1.5" />
            {t("teacherManagement.addTeacher")}
          </Button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("stats.total")}
                </p>
                <p className="text-xl font-bold">
                  {loadingStats ? "-" : stats.totalUsers}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("stats.active")}
                </p>
                <p className="text-xl font-bold text-green-600">
                  {loadingStats ? "-" : stats.activeUsers}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("stats.pending")}
                </p>
                <p className="text-xl font-bold text-yellow-600">
                  {loadingStats ? "-" : stats.pendingUsers}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("stats.suspended")}
                </p>
                <p className="text-xl font-bold text-red-600">
                  {loadingStats ? "-" : stats.suspendedUsers}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Ban className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("stats.newToday")}
                </p>
                <p className="text-xl font-bold">
                  {loadingStats ? "-" : stats.newUsersToday}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("stats.thisWeek")}
                </p>
                <p className="text-xl font-bold">
                  {loadingStats ? "-" : stats.newUsersThisWeek}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("stats.verified")}
                </p>
                <p className="text-xl font-bold text-green-600">
                  {loadingStats ? "-" : stats.verifiedUsers}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("stats.unverified")}
                </p>
                <p className="text-xl font-bold text-orange-600">
                  {loadingStats ? "-" : stats.unverifiedUsers}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Internal/External Teachers */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger
            value="INTERNAL_TEACHER"
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            {t("tabs.internalTeachers")}
          </TabsTrigger>
          <TabsTrigger
            value="EXTERNAL_TEACHER"
            className="flex items-center gap-2"
          >
            <UserCog className="h-4 w-4" />
            {t("tabs.externalTeachers")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-4">
          {/* Filters */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("teacherManagement.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[120px] h-9">
                    <SelectValue placeholder={t("table.status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("table.allStatus")}</SelectItem>
                    <SelectItem value="ACTIVE">{t("table.active")}</SelectItem>
                    <SelectItem value="INACTIVE">
                      {t("table.inactive")}
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Results count */}
                <div className="text-xs text-muted-foreground ml-auto">
                  {t("teacherManagement.showingTeachers", {
                    filtered: filteredTeachers.length,
                    total: teachers.length,
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teachers Table */}
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {t("teacherManagement.noTeachersFound")}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("table.name")}</TableHead>
                        <TableHead>{t("table.email")}</TableHead>
                        <TableHead>{t("table.phone")}</TableHead>
                        <TableHead>{t("assignSubjects.department")}</TableHead>
                        <TableHead>
                          {t("assignSubjects.specialization")}
                        </TableHead>
                        <TableHead>{t("table.verified")}</TableHead>
                        <TableHead>{t("table.status")}</TableHead>
                        <TableHead className="text-right">
                          {t("table.actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTeachers.map((teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">
                            {teacher.firstName} {teacher.lastName}
                          </TableCell>
                          <TableCell className="text-sm">
                            {teacher.email}
                          </TableCell>
                          <TableCell>{teacher.phone || "-"}</TableCell>
                          <TableCell>
                            {teacher.teacherProfile?.department || "-"}
                          </TableCell>
                          <TableCell>
                            {teacher.teacherProfile?.specialization || "-"}
                          </TableCell>
                          <TableCell>
                            {getVerificationBadges(teacher)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                teacher.status === "ACTIVE"
                                  ? "success"
                                  : "destructive"
                              }
                            >
                              {teacher.status === "ACTIVE"
                                ? t("table.active")
                                : teacher.status === "PENDING"
                                  ? t("table.pending")
                                  : teacher.status === "SUSPENDED"
                                    ? t("table.suspended")
                                    : t("table.inactive")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        fetchQuickViewData(teacher)
                                      }
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {t("table.quickView")}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-56"
                                >
                                  <DropdownMenuLabel>
                                    {t("table.actions")}
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      window.location.href = `/admin/teachers/${teacher.id}`;
                                    }}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    {t("table.viewProfile")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedTeacher(teacher);
                                      setIsEditModalOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    {t("table.edit")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openAssignModal(teacher)}
                                  >
                                    <GraduationCap className="h-4 w-4 mr-2" />
                                    {t("table.assignSubjects")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const status =
                                        teacher.status === "ACTIVE"
                                          ? "INACTIVE"
                                          : "ACTIVE";
                                      usersApi
                                        .updateStatus(teacher.id, status)
                                        .then(() => {
                                          toast.success(
                                            "Status updated successfully"
                                          );
                                          loadTeachers();
                                          fetchStats();
                                        })
                                        .catch((error) => {
                                          handleApiError(
                                            error,
                                            "TeacherManagement",
                                            "Failed to update status"
                                          );
                                        });
                                    }}
                                  >
                                    {teacher.status === "ACTIVE" ? (
                                      <>
                                        <UserX className="h-4 w-4 mr-2" />
                                        {t("table.deactivate")}
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="h-4 w-4 mr-2" />
                                        {t("table.activate")}
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => openDeleteDialog(teacher.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {t("table.delete")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("teacherManagement.deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("teacherManagement.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("teacherManagement.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t("teacherManagement.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick View Sheet */}
      <Sheet open={quickViewOpen} onOpenChange={setQuickViewOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              {quickViewTeacher && (
                <>
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={quickViewTeacher.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                      {quickViewTeacher.firstName?.[0]}
                      {quickViewTeacher.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {quickViewTeacher.firstName} {quickViewTeacher.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground font-normal">
                      {quickViewTeacher.email}
                    </p>
                  </div>
                </>
              )}
            </SheetTitle>
            <SheetDescription>Teacher Quick View</SheetDescription>
          </SheetHeader>

          {loadingQuickView ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            quickViewTeacher && (
              <div className="mt-6 space-y-6">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      quickViewTeacher.status === "ACTIVE"
                        ? "success"
                        : "destructive"
                    }
                  >
                    {quickViewTeacher.status === "ACTIVE"
                      ? t("table.active")
                      : quickViewTeacher.status === "PENDING"
                        ? t("table.pending")
                        : quickViewTeacher.status === "SUSPENDED"
                          ? t("table.suspended")
                          : t("table.inactive")}
                  </Badge>
                </div>

                <Separator />

                {/* Contact Information */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">
                        {quickViewTeacher.phone || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium truncate">
                        {quickViewTeacher.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Registered</p>
                      <p className="font-medium">
                        {quickViewTeacher.createdAt
                          ? format(new Date(quickViewTeacher.createdAt), "PP")
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Professional Information */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Professional Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Department</p>
                      <p className="font-medium">
                        {quickViewTeacher.teacherProfile?.department || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Specialization</p>
                      <p className="font-medium">
                        {quickViewTeacher.teacherProfile?.specialization || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Experience</p>
                      <p className="font-medium">
                        {quickViewTeacher.teacherProfile?.experience
                          ? `${quickViewTeacher.teacherProfile.experience} years`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium">
                        {quickViewTeacher.teacherProfile?.isExternalTransferOnly
                          ? "External"
                          : "Internal"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Verification Status */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Verification Status
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Verified
                      </span>
                      {quickViewTeacher.emailVerified ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Verified
                      </span>
                      {quickViewTeacher.phoneVerified ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        2FA Enabled
                      </span>
                      {quickViewTeacher.twoFactorEnabled ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </SheetContent>
      </Sheet>

      {/* Assign Subjects Modal */}
      {isAssignModalOpen && selectedTeacher && (
        <AssignSubjectsModal
          teacher={selectedTeacher}
          open={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedTeacher(null);
          }}
          grades={grades}
          mediums={mediums}
          subjects={subjects}
          currentAcademicYear={currentAcademicYear}
          onSuccess={loadTeachers}
        />
      )}
    </div>
  );
};

// Assign Subjects Modal Component
interface AssignSubjectsModalProps {
  teacher: UserWithProfile;
  open: boolean;
  onClose: () => void;
  grades: Grade[];
  mediums: Medium[];
  subjects: Subject[];
  currentAcademicYear: string;
  onSuccess: () => void;
}

const AssignSubjectsModal: React.FC<AssignSubjectsModalProps> = ({
  teacher,
  open,
  onClose,
  grades,
  mediums,
  subjects,
  currentAcademicYear,
  onSuccess,
}) => {
  const t = useTranslations("users");
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [gradeId, setGradeId] = useState("");
  const [mediumId, setMediumId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  useEffect(() => {
    if (open && teacher.teacherProfile?.id) {
      loadAssignments();
    }
  }, [open, teacher]);

  const loadAssignments = async () => {
    if (!teacher.teacherProfile?.id) return;

    setLoading(true);
    try {
      const response = await teacherAssignmentsApi.getByTeacher(
        teacher.teacherProfile.id
      );
      setAssignments(response.assignments || []);
    } catch (error) {
      logger.error("Error loading assignments:", error);
      handleApiError(
        error,
        "TeacherManagement.AssignModal.loadAssignments",
        "Failed to load teacher assignments"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssignment = async () => {
    if (!teacher.teacherProfile?.id || !gradeId || !mediumId || !subjectId) {
      toast.error("Please fill all fields");
      return;
    }

    setSubmitting(true);
    try {
      const data: CreateTeacherAssignmentDto = {
        teacherProfileId: teacher.teacherProfile.id,
        gradeId,
        mediumId,
        subjectId,
        academicYear: currentAcademicYear,
      };

      await teacherAssignmentsApi.create(data);
      handleApiSuccess("Assignment added successfully");
      loadAssignments();
      setGradeId("");
      setMediumId("");
      setSubjectId("");
    } catch (error) {
      logger.error("Error adding assignment:", error);
      handleApiError(
        error,
        "TeacherManagement.AssignModal.handleAddAssignment",
        "Failed to add assignment"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      await teacherAssignmentsApi.delete(id);
      handleApiSuccess("Assignment removed successfully");
      loadAssignments();
    } catch (error) {
      logger.error("Error deleting assignment:", error);
      handleApiError(
        error,
        "TeacherManagement.AssignModal.handleDeleteAssignment",
        "Failed to remove assignment"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("assignSubjects.title", {
              name: `${teacher.firstName} ${teacher.lastName}`,
            })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("assignSubjects.addNew")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>{t("table.grade")}</Label>
                  <Select value={gradeId} onValueChange={setGradeId}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("assignSubjects.selectGrade")}
                      />
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
                <div>
                  <Label>{t("table.medium")}</Label>
                  <Select value={mediumId} onValueChange={setMediumId}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("assignSubjects.selectMedium")}
                      />
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
                  <Label>{t("table.subject")}</Label>
                  <Select value={subjectId} onValueChange={setSubjectId}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("assignSubjects.selectSubject")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects
                        .filter((subject) => subject.id)
                        .map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleAddAssignment}
                disabled={submitting || !gradeId || !mediumId || !subjectId}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {t("assignSubjects.addAssignment")}
              </Button>
            </CardContent>
          </Card>

          {/* Current Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("assignSubjects.currentAssignments")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : assignments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t("assignSubjects.noAssignments")}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.grade")}</TableHead>
                      <TableHead>{t("table.medium")}</TableHead>
                      <TableHead>{t("table.subject")}</TableHead>
                      <TableHead>{t("assignSubjects.academicYear")}</TableHead>
                      <TableHead>{t("table.status")}</TableHead>
                      <TableHead className="text-right">
                        {t("table.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>{assignment.grade?.name || "-"}</TableCell>
                        <TableCell>{assignment.medium?.name || "-"}</TableCell>
                        <TableCell>{assignment.subject?.name || "-"}</TableCell>
                        <TableCell>{assignment.academicYear}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              assignment.isActive ? "success" : "secondary"
                            }
                          >
                            {assignment.isActive
                              ? t("table.active")
                              : t("table.inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteAssignment(assignment.id)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherManagement;
