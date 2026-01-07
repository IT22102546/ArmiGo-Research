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

interface TherapySession {
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

export default function MyTherapySessionsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<TherapySession[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [therapyTypeFilter, setTherapyTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchMySessions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sessions, searchTerm, statusFilter, departmentFilter, therapyTypeFilter]);

  const fetchMySessions = async () => {
    try {
      setLoading(true);
      const response = await classesApi.getMyClasses();
      const sessionsData = response.data || response.classes || response || [];
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
    } catch (error) {
      handleApiError(error, "Failed to load therapy sessions");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (session) =>
          session.name.toLowerCase().includes(term) ||
          session.subject?.name.toLowerCase().includes(term) ||
          session.grade?.name.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((session) => session.status === statusFilter);
    }

    // Department filter
    if (departmentFilter && departmentFilter !== "all") {
      filtered = filtered.filter(
        (session) => session.grade?.id === departmentFilter
      );
    }

    // Therapy Type filter
    if (therapyTypeFilter && therapyTypeFilter !== "all") {
      filtered = filtered.filter(
        (session) => session.subject?.id === therapyTypeFilter
      );
    }

    setFilteredSessions(filtered);
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      await classesApi.startClass(sessionId);
      router.push(`/teacher/classes/${sessionId}/session`);
    } catch (error) {
      handleApiError(error, "Failed to start therapy session");
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
    const values = sessions
      .map((session) => session[key])
      .filter((v) => v != null)
      .filter((v, i, arr) => arr.findIndex((x) => x?.id === v?.id) === i);
    return values;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Loading therapy sessions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Therapy Sessions</h1>
          <p className="text-muted-foreground mt-1">
            Manage your patient therapy sessions and view schedules
          </p>
        </div>
        <Button onClick={() => router.push("/teacher/classes/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule New Session
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
                placeholder="Search therapy sessions..."
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

            {/* Department Filter */}
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {getUniqueValues("grade")
                  .filter((grade) => grade?.id)
                  .map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Therapy Type Filter */}
            <Select
              value={therapyTypeFilter}
              onValueChange={setTherapyTypeFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Therapy Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Therapy Types</SelectItem>
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
              Showing {filteredSessions.length} of {sessions.length} therapy
              sessions
            </p>
            <Button variant="outline" size="sm" onClick={fetchMySessions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Therapy Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Therapy Sessions</CardTitle>
          <CardDescription>
            {filteredSessions.length === 0
              ? "No therapy sessions found"
              : `${filteredSessions.length} session(s) found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No therapy sessions found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/teacher/classes/create")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Schedule Your First Session
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Therapy Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Appointment</TableHead>
                    <TableHead>Patients</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{session.name}</p>
                          {session.medium && (
                            <p className="text-xs text-muted-foreground">
                              {session.medium.name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{session.grade?.name || "-"}</TableCell>
                      <TableCell>{session.subject?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(session.status)}>
                          {session.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {session.nextSession ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {safeFormatDate(session.nextSession, "PPp")}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {session.enrollments?.length || 0}
                            {session.maxStudents && ` / ${session.maxStudents}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {session.status === "ACTIVE" && (
                            <Button
                              size="sm"
                              onClick={() => handleStartSession(session.id)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Begin
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(`/teacher/classes/${session.id}`)
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
