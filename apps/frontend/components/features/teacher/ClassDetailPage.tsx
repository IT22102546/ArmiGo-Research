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
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  Video,
  FileText,
  Play,
  Upload,
  Download,
  Trash2,
  Edit,
  Eye,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { classesApi } from "@/lib/api/endpoints/classes";
import { videoApi } from "@/lib/api/endpoints/video";
import { courseMaterialsApi } from "@/lib/api/endpoints/course-materials";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
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

interface ClassDetailProps {
  classId: string;
}

export default function ClassDetailPage({ classId }: ClassDetailProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchClassDetails();
  }, [classId]);

  useEffect(() => {
    if (activeTab === "students") fetchStudents();
    if (activeTab === "sessions") fetchSessions();
    if (activeTab === "materials") fetchMaterials();
    if (activeTab === "recordings") fetchRecordings();
  }, [activeTab]);

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      const response = await classesApi.getById(classId);
      setClassData(response.data || response);
    } catch (error) {
      handleApiError(error, "Failed to load class details");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await classesApi.getEnrolledStudents(classId);
      setStudents(response.students || []);
    } catch (error) {
      handleApiError(error, "Failed to load students");
      setStudents([]);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await videoApi.getSessions({ classId });
      setSessions(Array.isArray(response) ? response : response.sessions || []);
    } catch (error) {
      handleApiError(error, "Failed to load sessions");
      setSessions([]);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await courseMaterialsApi.getByClass(classId);
      setMaterials(Array.isArray(response) ? response : []);
    } catch (error) {
      handleApiError(error, "Failed to load materials");
      setMaterials([]);
    }
  };

  const fetchRecordings = async () => {
    try {
      const response = await videoApi.getSessions({ classId, status: "ENDED" });
      const sessions = Array.isArray(response)
        ? response
        : response.sessions || [];
      const sessionsWithRecordings = sessions.filter(
        (s: any) => s.recordingUrl
      );
      setRecordings(sessionsWithRecordings);
    } catch (error) {
      handleApiError(error, "Failed to load recordings");
      setRecordings([]);
    }
  };

  const handleStartClass = async () => {
    try {
      await classesApi.startClass(classId);
      router.push(`/teacher/classes/${classId}/session`);
    } catch (error) {
      handleApiError(error, "Failed to start class");
    }
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      await videoApi.startSession(sessionId);
      handleApiSuccess("Session started successfully");
      fetchSessions();
    } catch (error) {
      handleApiError(error, "Failed to start session");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      ACTIVE: "default",
      DRAFT: "secondary",
      COMPLETED: "outline",
      CANCELLED: "destructive",
      SCHEDULED: "secondary",
      ENDED: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading class details...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Class not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/teacher/classes")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Classes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/teacher/classes")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{classData.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <span>{classData.grade?.name}</span>
              <span>•</span>
              <span>{classData.subject?.name}</span>
              <span>•</span>
              <span>{classData.medium?.name}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(classData.status)}
          {classData.status === "ACTIVE" && (
            <Button onClick={handleStartClass}>
              <Play className="mr-2 h-4 w-4" />
              Start Class
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push(`/teacher/classes/${classId}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Class Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Description
                  </p>
                  <p className="mt-1">
                    {classData.description || "No description"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Start Date
                  </p>
                  <p className="mt-1">{safeFormatDate(classData.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    End Date
                  </p>
                  <p className="mt-1">{safeFormatDate(classData.endDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Recurring
                  </p>
                  <p className="mt-1">{classData.isRecurring ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Max Students
                  </p>
                  <p className="mt-1">{classData.maxStudents || "Unlimited"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enrollment Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total Enrolled
                  </span>
                  <span className="text-2xl font-bold">
                    {classData.enrollments?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Available Slots
                  </span>
                  <span className="text-2xl font-bold">
                    {classData.maxStudents
                      ? classData.maxStudents -
                        (classData.enrollments?.length || 0)
                      : "∞"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Avg Attendance
                  </span>
                  <span className="text-2xl font-bold">-</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Enrolled Students ({students.length})
              </CardTitle>
              <CardDescription>
                View and manage student enrollments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No students enrolled yet
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Enrollment Date</TableHead>
                        <TableHead>Attendance</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.firstName} {student.lastName}
                          </TableCell>
                          <TableCell>
                            {student.email?.substring(0, 3)}***
                          </TableCell>
                          <TableCell>
                            {safeFormatDate(student.enrolledAt, "PP")}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              -
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(`/teacher/students/${student.id}`)
                              }
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
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

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Class Sessions ({sessions.length})
              </CardTitle>
              <CardDescription>
                Manage live sessions and meetings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No sessions scheduled</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() =>
                      router.push(`/teacher/classes/${classId}/session/create`)
                    }
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Create Session
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{session.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{safeFormatDate(session.scheduledAt)}</span>
                          <span>•</span>
                          <span>{session.participants || 0} participants</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(session.status)}
                        {session.status === "SCHEDULED" && (
                          <Button
                            size="sm"
                            onClick={() => handleStartSession(session.id)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        {session.status === "ACTIVE" && (
                          <Button
                            size="sm"
                            onClick={() => router.push(session.meetingUrl)}
                          >
                            <Video className="h-4 w-4 mr-1" />
                            Join
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Course Materials ({materials.length})
              </CardTitle>
              <CardDescription>
                Upload and manage learning resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No materials uploaded</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push("/teacher/materials")}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Material
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recordings Tab */}
        <TabsContent value="recordings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Recordings ({recordings.length})
              </CardTitle>
              <CardDescription>
                View and manage session recordings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recordings.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No recordings available
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recordings.map((recording) => (
                    <div
                      key={recording.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{recording.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {safeFormatDate(recording.startedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.open(recording.recordingUrl, "_blank")
                          }
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Watch
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              recording.recordingUrl
                            );
                            handleApiSuccess("Link copied to clipboard");
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
