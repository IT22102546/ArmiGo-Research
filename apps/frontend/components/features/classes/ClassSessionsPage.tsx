"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  ArrowLeft,
  Video,
  Users,
  Clock,
  Calendar,
  PlayCircle,
  StopCircle,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  ExternalLink,
  Plus,
} from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";
import { classesApi } from "@/lib/api/endpoints/classes";
import { classSessionsApi } from "@/lib/api/endpoints/class-sessions";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
import { format } from "date-fns";

// Helper to safely format dates
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

interface ClassSession {
  id: string;
  classId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  meetingLink?: string;
  videoSession?: {
    id: string;
    status: string;
    participants?: any[];
  };
  attendances?: Attendance[];
}

interface Attendance {
  id: string;
  userId: string;
  status: string;
  joinTime?: string;
  leaveTime?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ClassDetail {
  id: string;
  name: string;
  description?: string;
  teacher?: {
    firstName: string;
    lastName: string;
  };
  grade?: {
    name: string;
  };
  subject?: {
    name: string;
  };
}

interface SessionParticipant {
  userId: string;
  userName: string;
  email: string;
  joinTime?: string;
  leaveTime?: string;
  status: string;
  duration?: number;
}

export function ClassSessionsPage({ classId }: { classId: string }) {
  const router = useRouter();
  const t = useTranslations("classes");
  const tc = useTranslations("common");
  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(
    null
  );
  const [sessionDetailOpen, setSessionDetailOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] =
    useState<Attendance | null>(null);
  const [newAttendanceStatus, setNewAttendanceStatus] = useState<string>("");
  const [createSessionDialogOpen, setCreateSessionDialogOpen] = useState(false);
  const [sessionFormData, setSessionFormData] = useState({
    title: "",
    description: "",
    scheduledStartTime: "",
    durationMinutes: 60,
    recordSession: false,
  });

  useEffect(() => {
    fetchClassDetail();
    fetchSessions();
  }, [classId]);

  const fetchClassDetail = async () => {
    try {
      const response = await classesApi.getById(classId);
      setClassDetail(response);
    } catch (error) {
      handleApiError(error, "Failed to fetch class details");
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await classesApi.getSessions(classId);
      setSessions(Array.isArray(response) ? response : response.sessions || []);
    } catch (error) {
      handleApiError(error, "Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleViewSessionDetail = async (session: ClassSession) => {
    try {
      const details = await classesApi.getSessionDetails(classId, session.id);
      setSelectedSession(details);
      setSessionDetailOpen(true);
    } catch (error) {
      handleApiError(error, "Failed to fetch session details");
    }
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      await classesApi.endSession(classId, sessionId);
      fetchSessions();
      setSessionDetailOpen(false);
    } catch (error) {
      handleApiError(error, "Failed to end session");
    }
  };

  const handleJoinLiveSession = (meetingLink?: string) => {
    if (meetingLink) {
      window.open(meetingLink, "_blank");
    }
  };

  const openAttendanceDialog = (attendance: Attendance) => {
    setSelectedAttendance(attendance);
    setNewAttendanceStatus(attendance.status);
    setAttendanceDialogOpen(true);
  };

  const handleCreateSession = async () => {
    try {
      // Convert scheduledStartTime to date and startTime
      const scheduledDate = new Date(sessionFormData.scheduledStartTime);
      const dateString = scheduledDate.toISOString().split("T")[0];
      const startTimeString = scheduledDate
        .toTimeString()
        .split(" ")[0]
        .substring(0, 5);

      // Calculate end time based on duration
      const endDate = new Date(
        scheduledDate.getTime() + sessionFormData.durationMinutes * 60000
      );
      const endTimeString = endDate
        .toTimeString()
        .split(" ")[0]
        .substring(0, 5);

      await classSessionsApi.create({
        classId,
        date: dateString,
        startTime: startTimeString,
        endTime: endTimeString,
      });
      handleApiSuccess(t("sessionCreatedSuccess"));
      setCreateSessionDialogOpen(false);
      setSessionFormData({
        title: "",
        description: "",
        scheduledStartTime: "",
        durationMinutes: 60,
        recordSession: false,
      });
      fetchSessions();
    } catch (error) {
      handleApiError(error, "Failed to create session");
    }
  };

  const handleUpdateAttendance = async () => {
    if (!selectedAttendance || !selectedSession) return;
    try {
      await classesApi.updateAttendance(classId, selectedSession.id, {
        userId: selectedAttendance.userId,
        status: newAttendanceStatus,
      });
      fetchSessions();
      handleViewSessionDetail(selectedSession); // Refresh session details
      setAttendanceDialogOpen(false);
    } catch (error) {
      handleApiError(error, "Failed to update attendance");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Calendar className="mr-1 h-3 w-3" />
            {t("sessionStatusScheduled")}
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <PlayCircle className="mr-1 h-3 w-3" />
            {t("sessionStatusInProgress")}
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700">
            <CheckCircle className="mr-1 h-3 w-3" />
            {t("sessionStatusCompleted")}
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            <XCircle className="mr-1 h-3 w-3" />
            {t("sessionStatusCancelled")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAttendanceStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <Badge className="bg-green-500">{t("attendancePresent")}</Badge>;
      case "ABSENT":
        return <Badge className="bg-red-500">{t("attendanceAbsent")}</Badge>;
      case "LATE":
        return <Badge className="bg-yellow-500">{t("attendanceLate")}</Badge>;
      case "EXCUSED":
        return <Badge className="bg-blue-500">{t("attendanceExcused")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateDuration = (joinTime?: string, leaveTime?: string) => {
    if (!joinTime) return "-";
    const start = new Date(joinTime);
    const end = leaveTime ? new Date(leaveTime) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);
    return `${minutes} min`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/class-management")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToClasses")}
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {t("classSessions")}
            </h2>
            {classDetail && (
              <p className="text-muted-foreground">
                {classDetail.name} - {classDetail.grade?.name} -{" "}
                {classDetail.subject?.name}
              </p>
            )}
          </div>
        </div>
        <Button onClick={() => setCreateSessionDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("createSession")}
        </Button>
      </div>

      {/* Class Info Card */}
      {classDetail && (
        <Card>
          <CardHeader>
            <CardTitle>{t("classInformation")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("className")}
                </p>
                <p className="font-medium">{classDetail.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("teacher")}</p>
                <p className="font-medium">
                  {classDetail.teacher
                    ? `${classDetail.teacher.firstName} ${classDetail.teacher.lastName}`
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("grade")}</p>
                <p className="font-medium">{classDetail.grade?.name || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("subject")}</p>
                <p className="font-medium">
                  {classDetail.subject?.name || "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="mr-2 h-5 w-5" />
            {t("sessions")}
          </CardTitle>
          <CardDescription>{t("viewAndManageSessions")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("noSessionsFound")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("startTime")}</TableHead>
                  <TableHead>{t("endTime")}</TableHead>
                  <TableHead>{tc("status")}</TableHead>
                  <TableHead>{t("participants")}</TableHead>
                  <TableHead className="text-right">{tc("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{safeFormatDate(session.date, "PP")}</TableCell>
                    <TableCell>
                      {session.startTime
                        ? safeFormatDate(session.startTime, "p")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {session.endTime
                        ? safeFormatDate(session.endTime, "p")
                        : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="mr-1 h-4 w-4 text-muted-foreground" />
                        {session.attendances?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {session.status === "IN_PROGRESS" &&
                          session.meetingLink && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() =>
                                handleJoinLiveSession(session.meetingLink)
                              }
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              {t("joinLive")}
                            </Button>
                          )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSessionDetail(session)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {session.status === "IN_PROGRESS" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleEndSession(session.id)}
                          >
                            <StopCircle className="h-4 w-4 mr-1" />
                            {t("end")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Session Detail Dialog */}
      <Dialog open={sessionDetailOpen} onOpenChange={setSessionDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("sessionDetails")}</DialogTitle>
            <DialogDescription>
              {t("viewParticipantsAndAttendance")}
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-6">
              {/* Session Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t("sessionInformation")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("date")}
                      </p>
                      <p className="font-medium">
                        {safeFormatDate(selectedSession.date, "PP")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("startTime")}
                      </p>
                      <p className="font-medium">
                        {selectedSession.startTime
                          ? safeFormatDate(selectedSession.startTime, "p")
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("endTime")}
                      </p>
                      <p className="font-medium">
                        {selectedSession.endTime
                          ? safeFormatDate(selectedSession.endTime, "p")
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {tc("status")}
                      </p>
                      <div className="mt-1">
                        {getStatusBadge(selectedSession.status)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t("attendanceSummary")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">
                        {selectedSession.attendances?.filter(
                          (a) => a.status === "PRESENT"
                        ).length || 0}
                      </p>
                      <p className="text-sm text-green-600">
                        {t("attendancePresent")}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-700">
                        {selectedSession.attendances?.filter(
                          (a) => a.status === "ABSENT"
                        ).length || 0}
                      </p>
                      <p className="text-sm text-red-600">
                        {t("attendanceAbsent")}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-700">
                        {selectedSession.attendances?.filter(
                          (a) => a.status === "LATE"
                        ).length || 0}
                      </p>
                      <p className="text-sm text-yellow-600">
                        {t("attendanceLate")}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-700">
                        {selectedSession.attendances?.filter(
                          (a) => a.status === "EXCUSED"
                        ).length || 0}
                      </p>
                      <p className="text-sm text-blue-600">
                        {t("attendanceExcused")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Participants List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    {t("participants")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedSession.attendances &&
                  selectedSession.attendances.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{tc("name")}</TableHead>
                          <TableHead>{tc("email")}</TableHead>
                          <TableHead>{t("joinTime")}</TableHead>
                          <TableHead>{t("leaveTime")}</TableHead>
                          <TableHead>{t("duration")}</TableHead>
                          <TableHead>{tc("status")}</TableHead>
                          <TableHead className="text-right">
                            {tc("actions")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSession.attendances.map((attendance) => (
                          <TableRow key={attendance.id}>
                            <TableCell>
                              {attendance.user
                                ? `${attendance.user.firstName} ${attendance.user.lastName}`
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {attendance.user?.email || "-"}
                            </TableCell>
                            <TableCell>
                              {attendance.joinTime
                                ? safeFormatDate(attendance.joinTime, "p")
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {attendance.leaveTime
                                ? safeFormatDate(attendance.leaveTime, "p")
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {calculateDuration(
                                attendance.joinTime,
                                attendance.leaveTime
                              )}
                            </TableCell>
                            <TableCell>
                              {getAttendanceStatusBadge(attendance.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openAttendanceDialog(attendance)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {t("noParticipantsYet")}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recording Link */}
              {selectedSession.videoSession && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t("recording")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {t("recordingAvailableAfterSession")}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSessionDetailOpen(false)}
            >
              {tc("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Attendance Dialog */}
      <Dialog
        open={attendanceDialogOpen}
        onOpenChange={setAttendanceDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("updateAttendance")}</DialogTitle>
            <DialogDescription>
              {t("updateAttendanceDescription", {
                name: selectedAttendance?.user
                  ? `${selectedAttendance.user.firstName} ${selectedAttendance.user.lastName}`
                  : t("thisUser"),
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">{t("attendanceStatus")}</Label>
              <Select
                value={newAttendanceStatus}
                onValueChange={setNewAttendanceStatus}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRESENT">
                    {t("attendancePresent")}
                  </SelectItem>
                  <SelectItem value="ABSENT">
                    {t("attendanceAbsent")}
                  </SelectItem>
                  <SelectItem value="LATE">{t("attendanceLate")}</SelectItem>
                  <SelectItem value="EXCUSED">
                    {t("attendanceExcused")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAttendanceDialogOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button onClick={handleUpdateAttendance}>{tc("update")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Session Dialog */}
      <Dialog
        open={createSessionDialogOpen}
        onOpenChange={setCreateSessionDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("createNewSession")}</DialogTitle>
            <DialogDescription>
              {t("scheduleNewVideoSession")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">{t("sessionTitle")} *</Label>
              <Input
                id="title"
                placeholder={t("sessionTitlePlaceholder")}
                value={sessionFormData.title}
                onChange={(e) =>
                  setSessionFormData({
                    ...sessionFormData,
                    title: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{tc("description")}</Label>
              <Textarea
                id="description"
                placeholder={t("sessionDescriptionPlaceholder")}
                value={sessionFormData.description}
                onChange={(e) =>
                  setSessionFormData({
                    ...sessionFormData,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="scheduledStartTime">
                  {t("scheduledStartTime")} *
                </Label>
                <Input
                  id="scheduledStartTime"
                  type="datetime-local"
                  value={sessionFormData.scheduledStartTime}
                  onChange={(e) =>
                    setSessionFormData({
                      ...sessionFormData,
                      scheduledStartTime: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="durationMinutes">
                  {t("durationMinutes")} *
                </Label>
                <Input
                  id="durationMinutes"
                  type="number"
                  min="15"
                  step="15"
                  value={sessionFormData.durationMinutes}
                  onChange={(e) =>
                    setSessionFormData({
                      ...sessionFormData,
                      durationMinutes: parseInt(e.target.value) || 60,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="recordSession"
                type="checkbox"
                className="h-4 w-4"
                aria-label={t("recordSession")}
                checked={sessionFormData.recordSession}
                onChange={(e) =>
                  setSessionFormData({
                    ...sessionFormData,
                    recordSession: e.target.checked,
                  })
                }
              />
              <Label htmlFor="recordSession">{t("recordThisSession")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateSessionDialogOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button
              onClick={handleCreateSession}
              disabled={
                !sessionFormData.title || !sessionFormData.scheduledStartTime
              }
            >
              {t("createSession")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
