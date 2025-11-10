"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  UserPlus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Download,
  RefreshCw,
  GraduationCap,
  BookOpen,
  Users,
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
import { handleApiError } from "@/lib/error-handling";
import { usersApi } from "@/lib/api/endpoints/users";
import { gradesApi } from "@/lib/api/endpoints/grades";
import { mediumsApi } from "@/lib/api/endpoints/mediums";
import { ApiClient } from "@/lib/api/api-client";
import type { User } from "@/lib/api/types/auth.types";
import type { Grade, Medium, StudentProfile } from "@/lib/types";
import { useTranslations } from "next-intl";

const logger = createLogger("StudentManagement");

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
  studentProfile?: StudentProfile;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  lastLoginAt?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
}

interface StudentStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  verifiedUsers: number;
  unverifiedUsers: number;
}

const StudentManagement: React.FC = () => {
  const t = useTranslations("users");
  const [activeTab, setActiveTab] = useState<string>("INTERNAL_STUDENT");
  const [students, setStudents] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [filterMedium, setFilterMedium] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewStudent, setQuickViewStudent] =
    useState<UserWithProfile | null>(null);
  const [loadingQuickView, setLoadingQuickView] = useState(false);
  const [stats, setStats] = useState<StudentStats>({
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

  // Load reference data on mount
  useEffect(() => {
    loadReferenceData();
  }, []);

  // Load students when tab changes
  useEffect(() => {
    loadStudents();
    fetchStats();
  }, [activeTab]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = (await ApiClient.get(
        `/users/stats?role=${activeTab}`
      )) as StudentStats;
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
      const [gradesRes, mediumsRes] = await Promise.all([
        gradesApi.getAll({ includeInactive: false }),
        mediumsApi.getAll({ includeInactive: false }),
      ]);
      setGrades(gradesRes.grades || []);
      setMediums(mediumsRes.mediums || []);
    } catch (error) {
      logger.error("Error loading reference data:", error);
      handleApiError(
        error,
        "StudentManagement.loadReferenceData",
        "Failed to load reference data"
      );
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await usersApi.getAll({ role: activeTab });
      console.log("[StudentManagement] Students API Response:", response);
      console.log("[StudentManagement] Response structure:", {
        hasUsers: !!response?.users,
        usersLength: response?.users?.length || 0,
        hasData: !!response?.data,
        dataLength: response?.data?.length || 0,
      });
      const studentsData = response?.users || [];
      console.log("[StudentManagement] Students Data:", studentsData);
      console.log("[StudentManagement] First student sample:", studentsData[0]);
      setStudents(studentsData as UserWithProfile[]);
    } catch (error) {
      logger.error("Error loading students:", error);
      handleApiError(
        error,
        "StudentManagement.loadStudents",
        "Failed to load students"
      );
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on search and filters
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      searchTerm === "" ||
      `${student.firstName} ${student.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentProfile?.studentId
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesGrade =
      filterGrade === "all" || student.studentProfile?.gradeId === filterGrade;

    const matchesMedium =
      filterMedium === "all" ||
      student.studentProfile?.mediumId === filterMedium;

    const matchesStatus =
      filterStatus === "all" || student.status === filterStatus;

    return matchesSearch && matchesGrade && matchesMedium && matchesStatus;
  });

  // Debug filtering
  React.useEffect(() => {
    console.log("[StudentManagement] Filtering debug:", {
      totalStudents: students.length,
      filteredStudents: filteredStudents.length,
      filterStatus,
      filterGrade,
      filterMedium,
      searchTerm,
      sampleStatus: students[0]?.status,
    });
  }, [
    students.length,
    filteredStudents.length,
    filterStatus,
    filterGrade,
    filterMedium,
    searchTerm,
  ]);

  const handleDelete = async () => {
    if (!studentToDelete) return;

    try {
      await usersApi.delete(studentToDelete);
      toast.success(t("studentManagement.deleteSuccess"));
      loadStudents();
      fetchStats();
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    } catch (error) {
      logger.error("Error deleting student:", error);
      handleApiError(
        error,
        "StudentManagement.handleDelete",
        "Failed to delete student"
      );
    }
  };

  const fetchQuickViewData = async (student: UserWithProfile) => {
    setLoadingQuickView(true);
    setQuickViewStudent(student);
    setQuickViewOpen(true);
    try {
      // Fetch additional data if needed
      const enrichedStudent = { ...student };
      setQuickViewStudent(enrichedStudent);
    } catch (error) {
      console.debug("Quick view data not fully available");
    } finally {
      setLoadingQuickView(false);
    }
  };

  const openDeleteDialog = (studentId: string) => {
    setStudentToDelete(studentId);
    setDeleteDialogOpen(true);
  };

  const handleExport = () => {
    usersApi.exportUsers({
      role: activeTab,
      status: filterStatus === "all" ? undefined : filterStatus,
      search: searchTerm || undefined,
    });
    toast.success(t("studentManagement.exportStarted"));
  };

  const handleRefresh = () => {
    loadStudents();
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
            <GraduationCap className="h-6 w-6 text-primary" />
            {t("studentManagement.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("studentManagement.subtitle")}
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
            {t("studentManagement.export")}
          </Button>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-1.5" />
            {t("studentManagement.addStudent")}
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

      {/* Tabs for Internal/External Students */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger
            value="INTERNAL_STUDENT"
            className="flex items-center gap-2"
          >
            <GraduationCap className="h-4 w-4" />
            {t("tabs.internalStudents")}
          </TabsTrigger>
          <TabsTrigger
            value="EXTERNAL_STUDENT"
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            {t("tabs.externalStudents")}
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
                    placeholder={t("studentManagement.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>

                <Select value={filterGrade} onValueChange={setFilterGrade}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder={t("table.grade")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("studentManagement.allGrades")}
                    </SelectItem>
                    {grades
                      .filter((grade) => grade.id)
                      .map((grade) => (
                        <SelectItem key={grade.id} value={grade.id}>
                          {grade.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <Select value={filterMedium} onValueChange={setFilterMedium}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder={t("table.medium")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("table.allMediums")}</SelectItem>
                    {mediums
                      .filter((medium) => medium.id)
                      .map((medium) => (
                        <SelectItem key={medium.id} value={medium.id}>
                          {medium.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

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
                  {t("studentManagement.showingStudents", {
                    filtered: filteredStudents.length,
                    total: students.length,
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Students Table */}
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {t("studentManagement.noStudentsFound")}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          {t("studentManagement.studentId")}
                        </TableHead>
                        <TableHead>{t("table.name")}</TableHead>
                        <TableHead>{t("table.email")}</TableHead>
                        <TableHead>{t("table.phone")}</TableHead>
                        <TableHead>{t("table.grade")}</TableHead>
                        <TableHead>{t("table.medium")}</TableHead>
                        <TableHead>{t("table.batch")}</TableHead>
                        <TableHead>{t("table.verified")}</TableHead>
                        <TableHead>{t("table.status")}</TableHead>
                        <TableHead className="text-right">
                          {t("table.actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-mono text-sm">
                            {student.studentProfile?.studentId || "-"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {student.firstName} {student.lastName}
                          </TableCell>
                          <TableCell className="text-sm">
                            {student.email}
                          </TableCell>
                          <TableCell>{student.phone || "-"}</TableCell>
                          <TableCell>
                            {grades.find(
                              (g) => g.id === student.studentProfile?.gradeId
                            )?.name || "-"}
                          </TableCell>
                          <TableCell>
                            {mediums.find(
                              (m) => m.id === student.studentProfile?.mediumId
                            )?.name || "-"}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const batch = student.studentProfile?.batch;
                              if (!batch) return "-";
                              if (typeof batch === "object")
                                return batch.name || "-";
                              return batch;
                            })()}
                          </TableCell>
                          <TableCell>
                            {getVerificationBadges(student)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                student.status === "ACTIVE"
                                  ? "success"
                                  : "destructive"
                              }
                            >
                              {student.status === "ACTIVE"
                                ? t("table.active")
                                : student.status === "PENDING"
                                  ? t("table.pending")
                                  : student.status === "SUSPENDED"
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
                                        fetchQuickViewData(student)
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
                                  className="w-48"
                                >
                                  <DropdownMenuLabel>
                                    {t("table.actions")}
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      window.location.href = `/admin/students/${student.id}`;
                                    }}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    {t("table.viewProfile")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      // Handle edit student
                                      console.log("Edit student:", student.id);
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    {t("table.edit")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const status =
                                        student.status === "ACTIVE"
                                          ? "INACTIVE"
                                          : "ACTIVE";
                                      usersApi
                                        .updateStatus(student.id, status)
                                        .then(() => {
                                          toast.success(
                                            "Status updated successfully"
                                          );
                                          loadStudents();
                                          fetchStats();
                                        })
                                        .catch((error) => {
                                          handleApiError(
                                            error,
                                            "StudentManagement",
                                            "Failed to update status"
                                          );
                                        });
                                    }}
                                  >
                                    {student.status === "ACTIVE" ? (
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
                                    onClick={() => openDeleteDialog(student.id)}
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
              {t("studentManagement.deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("studentManagement.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("studentManagement.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t("studentManagement.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick View Sheet */}
      <Sheet open={quickViewOpen} onOpenChange={setQuickViewOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              {quickViewStudent && (
                <>
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={quickViewStudent.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                      {quickViewStudent.firstName?.[0]}
                      {quickViewStudent.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {quickViewStudent.firstName} {quickViewStudent.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground font-normal">
                      {quickViewStudent.email}
                    </p>
                  </div>
                </>
              )}
            </SheetTitle>
            <SheetDescription>Student Quick View</SheetDescription>
          </SheetHeader>

          {loadingQuickView ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            quickViewStudent && (
              <div className="mt-6 space-y-6">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      quickViewStudent.status === "ACTIVE"
                        ? "success"
                        : "destructive"
                    }
                  >
                    {quickViewStudent.status === "ACTIVE"
                      ? t("table.active")
                      : quickViewStudent.status === "PENDING"
                        ? t("table.pending")
                        : quickViewStudent.status === "SUSPENDED"
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
                        {quickViewStudent.phone || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium truncate">
                        {quickViewStudent.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Registered</p>
                      <p className="font-medium">
                        {quickViewStudent.createdAt
                          ? format(new Date(quickViewStudent.createdAt), "PP")
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Registration No.</p>
                      <p className="font-medium font-mono text-xs">
                        {quickViewStudent.studentProfile?.studentId || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Academic Information */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Academic Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Grade</p>
                      <p className="font-medium">
                        {grades.find(
                          (g) =>
                            g.id === quickViewStudent.studentProfile?.gradeId
                        )?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Medium</p>
                      <p className="font-medium">
                        {mediums.find(
                          (m) =>
                            m.id === quickViewStudent.studentProfile?.mediumId
                        )?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Batch</p>
                      <p className="font-medium">
                        {(() => {
                          const batch = quickViewStudent.studentProfile?.batch;
                          if (!batch) return "-";
                          if (typeof batch === "object")
                            return batch.name || "-";
                          return batch;
                        })()}
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
                      {quickViewStudent.emailVerified ? (
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
                      {quickViewStudent.phoneVerified ? (
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
                      {quickViewStudent.twoFactorEnabled ? (
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
    </div>
  );
};

export default StudentManagement;
