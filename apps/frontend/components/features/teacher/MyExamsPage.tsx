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
  Edit,
  Clock,
  Users,
  FileText,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { examsApi } from "@/lib/api/endpoints/exams";
import { handleApiError } from "@/lib/error-handling";
import { format } from "date-fns";

const safeFormatDate = (value?: string | Date | null, fmt = "PPp") => {
  if (!value) return "-";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (!d || isNaN(d.getTime())) return "-";
    return format(d, fmt);
  } catch {
    return "-";
  }
};

interface Exam {
  id: string;
  title: string;
  type: string;
  status: string;
  approvalStatus?: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalMarks: number;
  grade?: { id: string; name: string };
  subject?: { id: string; name: string };
  medium?: { id: string; name: string };
  _count?: {
    attempts: number;
    questions: number;
  };
}

export default function MyExamsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [exams, setExams] = useState<Exam[]>([]);
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [approvalFilter, setApprovalFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchMyExams();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [exams, searchTerm, statusFilter, approvalFilter, typeFilter]);

  const fetchMyExams = async () => {
    try {
      setLoading(true);
      const response = await examsApi.getTeacherExams();
      const examsData = response.data || response || [];
      setExams(Array.isArray(examsData) ? examsData : []);
    } catch (error) {
      handleApiError(error, "Failed to load exams");
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...exams];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (exam) =>
          exam.title.toLowerCase().includes(term) ||
          exam.subject?.name.toLowerCase().includes(term) ||
          exam.grade?.name.toLowerCase().includes(term)
      );
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((exam) => exam.status === statusFilter);
    }

    if (approvalFilter && approvalFilter !== "all") {
      filtered = filtered.filter(
        (exam) => exam.approvalStatus === approvalFilter
      );
    }

    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter((exam) => exam.type === typeFilter);
    }

    setFilteredExams(filtered);
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      ACTIVE: "default",
      DRAFT: "secondary",
      COMPLETED: "outline",
      SCHEDULED: "secondary",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getApprovalBadge = (status?: string) => {
    if (!status) return null;
    const config: any = {
      PENDING_APPROVAL: {
        icon: Clock,
        variant: "outline",
        color: "text-yellow-600",
      },
      APPROVED: {
        icon: CheckCircle,
        variant: "default",
        color: "text-green-600",
      },
      REJECTED: {
        icon: XCircle,
        variant: "destructive",
        color: "text-red-600",
      },
    };
    const { icon: Icon, variant, color } = config[status] || {};
    return (
      <Badge variant={variant} className="gap-1">
        {Icon && <Icon className={`h-3 w-3 ${color}`} />}
        {status}
      </Badge>
    );
  };

  const canEdit = (exam: Exam) => {
    return (
      exam.status === "DRAFT" ||
      (exam.status === "SCHEDULED" &&
        exam.approvalStatus === "PENDING_APPROVAL")
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Exams</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your exams
          </p>
        </div>
        <Button onClick={() => router.push("/teacher/exams/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Exam
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exams.filter((e) => e.status === "ACTIVE").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approval
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                exams.filter((e) => e.approvalStatus === "PENDING_APPROVAL")
                  .length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exams.filter((e) => e.status === "COMPLETED").length}
            </div>
          </CardContent>
        </Card>
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={approvalFilter} onValueChange={setApprovalFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Approvals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Approvals</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="TERM">Term Exam</SelectItem>
                <SelectItem value="MONTHLY">Monthly Test</SelectItem>
                <SelectItem value="WEEKLY">Weekly Test</SelectItem>
                <SelectItem value="PRACTICE">Practice</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredExams.length} of {exams.length} exams
            </p>
            <Button variant="outline" size="sm" onClick={fetchMyExams}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Exams</CardTitle>
          <CardDescription>
            {filteredExams.length === 0
              ? "No exams found"
              : `${filteredExams.length} exam(s) found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExams.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No exams found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/teacher/exams/create")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Exam
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approval</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{exam.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {exam.type}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{exam.subject?.name || "-"}</p>
                          <p className="text-xs text-muted-foreground">
                            {exam.grade?.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {safeFormatDate(exam.startTime, "PPp")}
                      </TableCell>
                      <TableCell>{exam.duration} min</TableCell>
                      <TableCell>{getStatusBadge(exam.status)}</TableCell>
                      <TableCell>
                        {getApprovalBadge(exam.approvalStatus)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{exam._count?.attempts || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {exam.status === "ACTIVE" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                router.push(`/teacher/exams/${exam.id}/monitor`)
                              }
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Monitor
                            </Button>
                          )}
                          {exam.status === "COMPLETED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(
                                  `/teacher/exams/${exam.id}/marking/students`
                                )
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark
                            </Button>
                          )}
                          {canEdit(exam) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(`/teacher/exams/${exam.id}/edit`)
                              }
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(`/teacher/exams/${exam.id}`)
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
