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
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Eye,
  Edit,
  Trash2,
  GraduationCap,
  BookOpen,
  Building2,
  Globe,
  RefreshCw,
} from "lucide-react";
import { GradeSelect, BatchSelect } from "@/components/shared/selects";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import { handleApiError } from "@/lib/error-handling";
const logger = createLogger("RoleUserTable");
import { cn } from "@/lib/utils";
import { getDisplayName } from "@/lib/utils/display";
import { useEnums } from "@/lib/hooks/use-enums";
import { useTranslations } from "next-intl";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  teachingSubjects?: Subject[];
  studentProfile?: StudentProfile;
  teacherProfile?: TeacherProfile;
  institution?: string;
  medium?: string;
}

interface Subject {
  id: string;
  name: string;
  medium?: string;
}

interface StudentProfile {
  studentId?: string;
  grade?: string | { id: string; name: string };
  batch?: string | { id: string; name: string };
}

interface TeacherProfile {
  specialization?: string;
  experience?: number;
}

interface Filters {
  search: string;
  status: string;
  grade: string;
  subject: string;
  batch: string;
  medium: string;
  institution: string;
}

interface RoleUserTableProps {
  role:
    | "INTERNAL_STUDENT"
    | "EXTERNAL_STUDENT"
    | "INTERNAL_TEACHER"
    | "EXTERNAL_TEACHER";
  onEdit: (user: User) => void;
  onView: (user: User) => void;
  onDelete: (userId: string) => void;
  refreshTrigger?: number;
}

const INITIAL_FILTERS: Filters = {
  search: "",
  status: "ALL",
  grade: "ALL",
  subject: "ALL",
  batch: "ALL",
  medium: "ALL",
  institution: "ALL",
};

const RoleUserTable: React.FC<RoleUserTableProps> = ({
  role,
  onEdit,
  onView,
  onDelete,
  refreshTrigger = 0,
}) => {
  const t = useTranslations("users");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const { grades, mediums, loading: enumsLoading } = useEnums();

  const isStudent = role.includes("STUDENT");
  const isTeacher = role.includes("TEACHER");

  useEffect(() => {
    fetchUsers();
  }, [role, filters, page, refreshTrigger]);

  useEffect(() => {
    if (isTeacher) {
      fetchSubjects();
    }
  }, [isTeacher]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        role: role,
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== "ALL" && { status: filters.status }),
        ...(filters.grade !== "ALL" && { grade: filters.grade }),
        ...(filters.subject !== "ALL" && { subject: filters.subject }),
        ...(filters.batch !== "ALL" && { batch: filters.batch }),
        ...(filters.medium !== "ALL" && { medium: filters.medium }),
        ...(filters.institution !== "ALL" && {
          institution: filters.institution,
        }),
      });

      const response = await ApiClient.get<any>(`/users?${params.toString()}`);

      const userData = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      const totalCount =
        response?.pagination?.total || response?.total || userData.length;

      setUsers(userData);
      setTotal(totalCount);
    } catch (error) {
      logger.error(`Error fetching ${role} users:`, error);
      handleApiError(error, `RoleUserTable.fetchUsers`, "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await ApiClient.get<Subject[]>("/subjects");
      setSubjects(Array.isArray(response) ? response : []);
    } catch (error) {
      logger.error("Error fetching subjects:", error);
      handleApiError(
        error,
        "RoleUserTable.fetchSubjects",
        "Failed to load subjects"
      );
    }
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const totalPages = Math.ceil(total / limit);

  const getRoleLabel = () => {
    switch (role) {
      case "INTERNAL_STUDENT":
        return t("roles.internalStudents");
      case "EXTERNAL_STUDENT":
        return t("roles.externalStudents");
      case "INTERNAL_TEACHER":
        return t("roles.internalTeachers");
      case "EXTERNAL_TEACHER":
        return t("roles.externalTeachers");
      default:
        return t("table.users");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            {getRoleLabel()} ({total})
          </CardTitle>
          <Button size="sm" variant="outline" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("table.refresh")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters Section */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <Label htmlFor={`search-${role}`}>
                <Search className="h-4 w-4 inline mr-2" />
                {t("table.search")}
              </Label>
              <Input
                id={`search-${role}`}
                placeholder={t("table.searchPlaceholder")}
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>

            {/* Status */}
            <div>
              <Label>{t("table.status")}</Label>
              <Select
                value={filters.status}
                onValueChange={(v) => setFilters({ ...filters, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("table.allStatus")}</SelectItem>
                  <SelectItem value="ACTIVE">{t("table.active")}</SelectItem>
                  <SelectItem value="INACTIVE">
                    {t("table.inactive")}
                  </SelectItem>
                  <SelectItem value="PENDING">{t("table.pending")}</SelectItem>
                  <SelectItem value="SUSPENDED">
                    {t("table.suspended")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Grade - Only for students */}
            {isStudent && (
              <div>
                <Label>
                  <GraduationCap className="h-4 w-4 inline mr-2" />
                  {t("table.grade")}
                </Label>
                <GradeSelect
                  value={filters.grade}
                  onValueChange={(v) =>
                    setFilters({ ...filters, grade: v, batch: "ALL" })
                  }
                />
              </div>
            )}

            {/* Subject - Only for teachers */}
            {isTeacher && (
              <div>
                <Label>
                  <BookOpen className="h-4 w-4 inline mr-2" />
                  {t("table.subject")}
                </Label>
                <Select
                  value={filters.subject}
                  onValueChange={(v) => setFilters({ ...filters, subject: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">
                      {t("table.allSubjects")}
                    </SelectItem>
                    {subjects
                      .filter((s) => s.name)
                      .map((s) => (
                        <SelectItem key={s.id} value={s.name}>
                          {s.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Batch - Only for students */}
            {isStudent && (
              <div>
                <Label>{t("table.batch")}</Label>
                <BatchSelect
                  gradeId={filters.grade === "ALL" ? undefined : filters.grade}
                  value={filters.batch === "ALL" ? undefined : filters.batch}
                  onValueChange={(v) =>
                    setFilters({ ...filters, batch: v || "ALL" })
                  }
                  disabled={!filters.grade || filters.grade === "ALL"}
                />
              </div>
            )}

            {/* Medium */}
            <div>
              <Label>
                <Globe className="h-4 w-4 inline mr-2" />
                {t("table.medium")}
              </Label>
              <Select
                value={filters.medium}
                onValueChange={(v) => setFilters({ ...filters, medium: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("table.allMediums")}</SelectItem>
                  {mediums
                    .filter((m) => m.name)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.name}>
                        {m.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Institution */}
            <div>
              <Label>
                <Building2 className="h-4 w-4 inline mr-2" />
                {t("table.institution")}
              </Label>
              <Input
                placeholder={t("table.institutionPlaceholder")}
                value={filters.institution === "ALL" ? "" : filters.institution}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    institution: e.target.value || "ALL",
                  })
                }
              />
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                {t("table.resetFilters")}
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.name")}</TableHead>
                  <TableHead>{t("table.email")}</TableHead>
                  <TableHead>{t("table.phone")}</TableHead>
                  {isStudent && <TableHead>Registration No.</TableHead>}
                  <TableHead>{t("table.status")}</TableHead>
                  {isStudent && <TableHead>{t("table.gradeBatch")}</TableHead>}
                  {isTeacher && <TableHead>{t("table.subjects")}</TableHead>}
                  <TableHead>{t("table.medium")}</TableHead>
                  <TableHead>{t("table.institution")}</TableHead>
                  <TableHead className="text-right">
                    {t("table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isStudent ? 10 : isTeacher ? 9 : 8}
                      className="text-center text-muted-foreground h-32"
                    >
                      {t("table.noUsersFound")}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || t("table.na")}</TableCell>
                      {isStudent && (
                        <TableCell>
                          {user.studentProfile?.studentId ? (
                            <Badge variant="outline" className="font-mono text-xs bg-primary/5 border-primary/20 text-primary">
                              {user.studentProfile.studentId}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Not assigned</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge
                          variant={
                            user.status === "ACTIVE" ? "default" : "secondary"
                          }
                          className={cn(
                            user.status === "ACTIVE" && "bg-green-500",
                            user.status === "INACTIVE" && "bg-muted",
                            user.status === "SUSPENDED" && "bg-red-500"
                          )}
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      {isStudent && (
                        <TableCell>
                          {user.studentProfile?.grade && (
                            <span>
                              {t("table.gradePrefix")}{" "}
                              {getDisplayName(user.studentProfile.grade)}
                              {user.studentProfile.batch &&
                                ` - ${
                                  typeof user.studentProfile.batch ===
                                    "object" && user.studentProfile.batch
                                    ? user.studentProfile.batch.name
                                    : user.studentProfile.batch
                                }`}
                            </span>
                          )}
                        </TableCell>
                      )}
                      {isTeacher && (
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.teachingSubjects
                              ?.slice(0, 2)
                              .map((subject) => (
                                <Badge
                                  key={subject.id}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {subject.name}
                                </Badge>
                              ))}
                            {(user.teachingSubjects?.length || 0) > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{(user.teachingSubjects?.length || 0) - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        {getDisplayName(user.medium) || t("table.na")}
                      </TableCell>
                      <TableCell>{user.institution || t("table.na")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onView(user)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(user)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onDelete(user.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {users.length > 0 && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  {t("table.showing", {
                    from: (page - 1) * limit + 1,
                    to: Math.min(page * limit, total),
                    total,
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(1)}
                    disabled={page === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {t("table.pageOf", { page, totalPages })}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={page === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleUserTable;
