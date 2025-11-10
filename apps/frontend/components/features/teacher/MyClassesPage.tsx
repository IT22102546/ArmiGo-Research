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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Search,
  Filter,
  Eye,
  Users,
  Calendar,
  Play,
  RefreshCw,
  Clock,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { classesApi } from "@/lib/api/endpoints/classes";
import { handleApiError } from "@/lib/error-handling";
import { format } from "date-fns";

const safeFormatDate = (value?: string | Date | null, fmt = "PP") => {
  if (!value) return "-";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (!d || isNaN(d.getTime())) return "-";
    return format(d, fmt);
  } catch {
    return "-";
  }
};

interface ClassItem {
  id: string;
  name: string;
  description?: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  startDate: string;
  endDate: string;
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
  nextSession?: string;
}

export default function MyClassesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  useEffect(() => {
    fetchMyClasses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [classes, searchTerm, statusFilter, gradeFilter, subjectFilter]);

  const fetchMyClasses = async () => {
    try {
      setLoading(true);
      const response = await classesApi.getMyClasses();
      const classesData = response.data || response.classes || response || [];
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (error) {
      handleApiError(error, "Failed to load classes");
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...classes];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (cls) =>
          cls.name.toLowerCase().includes(term) ||
          cls.subject?.name.toLowerCase().includes(term) ||
          cls.grade?.name.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((cls) => cls.status === statusFilter);
    }

    // Grade filter
    if (gradeFilter && gradeFilter !== "all") {
      filtered = filtered.filter((cls) => cls.grade?.id === gradeFilter);
    }

    // Subject filter
    if (subjectFilter && subjectFilter !== "all") {
      filtered = filtered.filter((cls) => cls.subject?.id === subjectFilter);
    }

    setFilteredClasses(filtered);
  };

  const handleStartClass = async (classId: string) => {
    try {
      await classesApi.startClass(classId);
      router.push(`/teacher/classes/${classId}/session`);
    } catch (error) {
      handleApiError(error, "Failed to start class");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "DRAFT":
        return "secondary";
      case "COMPLETED":
        return "outline";
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getUniqueValues = (key: "grade" | "subject") => {
    const values = classes
      .map((cls) => cls[key])
      .filter((v) => v != null)
      .filter((v, i, arr) => arr.findIndex((x) => x?.id === v?.id) === i);
    return values;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Classes</h1>
          <p className="text-muted-foreground mt-1">
            Manage your classes and view schedules
          </p>
        </div>
        <Button onClick={() => router.push("/teacher/classes/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Class
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Grade Filter */}
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {getUniqueValues("grade")
                  .filter((grade) => grade?.id)
                  .map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Subject Filter */}
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {getUniqueValues("subject")
                  .filter((subject) => subject?.id)
                  .map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredClasses.length} of {classes.length} classes
            </p>
            <Button variant="outline" size="sm" onClick={fetchMyClasses}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
          <CardDescription>
            {filteredClasses.length === 0
              ? "No classes found"
              : `${filteredClasses.length} class(es) found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClasses.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No classes found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/teacher/classes/create")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Class
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Session</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClasses.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cls.name}</p>
                          {cls.medium && (
                            <p className="text-xs text-muted-foreground">
                              {cls.medium.name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{cls.grade?.name || "-"}</TableCell>
                      <TableCell>{cls.subject?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(cls.status)}>
                          {cls.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {cls.nextSession ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {safeFormatDate(cls.nextSession, "PPp")}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {cls.enrollments?.length || 0}
                            {cls.maxStudents && ` / ${cls.maxStudents}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {cls.status === "ACTIVE" && (
                            <Button
                              size="sm"
                              onClick={() => handleStartClass(cls.id)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Start
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(`/teacher/classes/${cls.id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
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
    </div>
  );
}
