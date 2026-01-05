"use client";

import React, { useState, useEffect } from "react";
import { createLogger } from "@/lib/utils/logger";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
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
  Loader2,
  UserCheck,
  UserX,
  Download,
} from "lucide-react";
import { ApiClient } from "@/lib/api/api-client";
import {
  classSessionsApi,
  attendanceApi,
} from "@/lib/api/endpoints/class-sessions";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
import { GradeSelect, SubjectSelect } from "@/components/shared/selects";
import { format } from "date-fns";

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

const logger = createLogger("ClassSessionMonitoring");

interface ClassSession {
  id: string;
  classId: string;
  class?: {
    id: string;
    name: string;
    grade?: { name: string };
    subject?: { name: string };
    teacher?: { firstName: string; lastName: string };
  };
  timetableId?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  meetingLink?: string;
  videoSession?: {
    id: string;
    status: string;
    roomId: string;
    recordingUrl?: string;
    participants?: SessionParticipant[];
  };
  attendances?: Attendance[];
}

interface Attendance {
  id: string;
  userId: string;
  classSessionId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  joinTime?: string;
  leaveTime?: string;
  duration?: number;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface SessionParticipant {
  userId: string;
  userName: string;
  email: string;
  joinTime?: string;
  leaveTime?: string;
  duration?: number;
}

export function ClassSessionMonitoring() {
  // Filter states
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Data states
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [endSessionDialogOpen, setEndSessionDialogOpen] = useState(false);

  // Selected data
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(
    null
  );
  const [selectedAttendance, setSelectedAttendance] =
    useState<Attendance | null>(null);
  const [newAttendanceStatus, setNewAttendanceStatus] = useState<string>("");

  useEffect(() => {
    fetchSessions();
  }, [selectedGrade, selectedSubject, selectedStatus, dateFrom, dateTo]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params: any = {};

      // Build filter params - only add non-empty values
      if (selectedGrade && selectedGrade !== "clear")
        params.gradeId = selectedGrade;
      if (selectedSubject && selectedSubject !== "clear")
        params.subjectId = selectedSubject;
      if (selectedStatus && selectedStatus !== "all")
        params.status = selectedStatus;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      logger.debug("Fetching sessions with filters:", params);

      const response = await classSessionsApi.getAll(params as any);

      logger.debug("Received response:", response);
      setSessions((Array.isArray(response) ? response : []) as ClassSession[]);
    } catch (error) {
      logger.error("Error fetching sessions:", error);
      handleApiError(error, "Failed to fetch class sessions");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDetails = async (sessionId: string) => {
    try {
      const response = await classSessionsApi.getById(sessionId);
      setSelectedSession(response as ClassSession);
      setDetailDialogOpen(true);
    } catch (error) {
      handleApiError(error, "Failed to fetch session details");
    }
  };

  const handleEndSession = async () => {
    if (!selectedSession) return;

    try {
      await classSessionsApi.endSession(selectedSession.id);
      handleApiSuccess("Session ended successfully");
      setEndSessionDialogOpen(false);
      setDetailDialogOpen(false);
      fetchSessions();
    } catch (error) {
      handleApiError(error, "Failed to end session");
    }
  };

  const handleJoinLiveSession = (meetingLink?: string) => {
    if (meetingLink) {
      window.open(meetingLink, "_blank");
    } else {
      toast.error("No meeting link available");
    }
  };

  const handleUpdateAttendance = async () => {
    if (!selectedAttendance || !newAttendanceStatus) return;

    try {
      await attendanceApi.update(selectedAttendance.id, {
        status: newAttendanceStatus as any,
      });
      handleApiSuccess("Attendance updated successfully");
      setAttendanceDialogOpen(false);
      if (selectedSession) {
        fetchSessionDetails(selectedSession.id);
      }
      fetchSessions();
    } catch (error) {
      handleApiError(error, "Failed to update attendance");
    }
  };

  const openAttendanceDialog = (attendance: Attendance) => {
    setSelectedAttendance(attendance);
    setNewAttendanceStatus(attendance.status);
    setAttendanceDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: React.ReactNode }> = {
      SCHEDULED: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
      IN_PROGRESS: {
        variant: "default",
        icon: <PlayCircle className="h-3 w-3" />,
      },
      COMPLETED: {
        variant: "outline",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      CANCELLED: {
        variant: "destructive",
        icon: <XCircle className="h-3 w-3" />,
      },
    };

    const config = variants[status] || variants.SCHEDULED;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  const getAttendanceStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: React.ReactNode }> = {
      PRESENT: { variant: "default", icon: <UserCheck className="h-3 w-3" /> },
      ABSENT: { variant: "destructive", icon: <UserX className="h-3 w-3" /> },
      LATE: { variant: "secondary", icon: <Clock className="h-3 w-3" /> },
      EXCUSED: {
        variant: "outline",
        icon: <CheckCircle className="h-3 w-3" />,
      },
    };

    const config = variants[status] || variants.PRESENT;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    );
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
        <div>
          <h1 className="text-3xl font-bold">Class Sessions & Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Monitor live sessions, track attendance, and manage class recordings
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter sessions by grade, subject, status, and date range
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Grade</Label>
              <GradeSelect
                value={selectedGrade}
                onValueChange={setSelectedGrade}
                allowClear
              />
            </div>
            <div>
              <Label>Subject</Label>
              <SubjectSelect
                value={selectedSubject}
                onValueChange={setSelectedSubject}
                allowClear
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Class Sessions
          </CardTitle>
          <CardDescription>View and manage all class sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No sessions found matching your filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Recording</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => {
                    const presentCount =
                      session.attendances?.filter((a) => a.status === "PRESENT")
                        .length || 0;
                    const totalCount = session.attendances?.length || 0;

                    return (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {session.class?.name || "-"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {session.class?.grade?.name} -{" "}
                              {session.class?.subject?.name}
                            </div>
                            {session.class?.teacher && (
                              <div className="text-xs text-muted-foreground">
                                {session.class.teacher.firstName}{" "}
                                {session.class.teacher.lastName}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {safeFormatDate(session.date, "PP")}
                        </TableCell>
                        <TableCell>
                          {session.startTime && session.endTime ? (
                            <div className="text-sm">
                              {safeFormatDate(session.startTime, "p")} -{" "}
                              {safeFormatDate(session.endTime, "p")}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(session.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {session.videoSession?.participants?.length || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {presentCount} / {totalCount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {session.videoSession?.recordingUrl ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                window.open(
                                  session.videoSession?.recordingUrl,
                                  "_blank"
                                )
                              }
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              N/A
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {session.status === "IN_PROGRESS" &&
                              session.videoSession?.status === "ACTIVE" && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() =>
                                    handleJoinLiveSession(session.meetingLink)
                                  }
                                >
                                  <PlayCircle className="h-4 w-4 mr-1" />
                                  Join Live
                                </Button>
                              )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fetchSessionDetails(session.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
            <DialogDescription>
              View participants, attendance, and session information
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-6">
              {/* Session Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Session Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Class</Label>
                      <p className="font-medium">
                        {selectedSession.class?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Date</Label>
                      <p className="font-medium">
                        {safeFormatDate(selectedSession.date, "PPP")}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Time</Label>
                      <p className="font-medium">
                        {selectedSession.startTime && selectedSession.endTime
                          ? `${safeFormatDate(selectedSession.startTime, "p")} - ${safeFormatDate(selectedSession.endTime, "p")}`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <div className="mt-1">
                        {getStatusBadge(selectedSession.status)}
                      </div>
                    </div>
                    {selectedSession.meetingLink && (
                      <div className="col-span-2">
                        <Label className="text-muted-foreground">
                          Meeting Link
                        </Label>
                        <a
                          href={selectedSession.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {selectedSession.meetingLink}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {selectedSession.videoSession?.recordingUrl && (
                      <div className="col-span-2">
                        <Label className="text-muted-foreground">
                          Recording
                        </Label>
                        <a
                          href={selectedSession.videoSession.recordingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          Download Recording
                          <Download className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Participants List */}
              {selectedSession.videoSession?.participants &&
                selectedSession.videoSession.participants.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Participants (
                        {selectedSession.videoSession.participants.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Join Time</TableHead>
                            <TableHead>Leave Time</TableHead>
                            <TableHead>Duration</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedSession.videoSession.participants.map(
                            (participant, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {participant.userName}
                                </TableCell>
                                <TableCell>{participant.email}</TableCell>
                                <TableCell>
                                  {safeFormatDate(participant.joinTime, "p")}
                                </TableCell>
                                <TableCell>
                                  {participant.leaveTime
                                    ? safeFormatDate(participant.leaveTime, "p")
                                    : "Still in session"}
                                </TableCell>
                                <TableCell>
                                  {calculateDuration(
                                    participant.joinTime,
                                    participant.leaveTime
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

              {/* Attendance List */}
              {selectedSession.attendances &&
                selectedSession.attendances.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <UserCheck className="h-5 w-5" />
                        Attendance Summary ({selectedSession.attendances.length}
                        )
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Join Time</TableHead>
                            <TableHead>Leave Time</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedSession.attendances.map((attendance) => (
                            <TableRow key={attendance.id}>
                              <TableCell className="font-medium">
                                {attendance.user
                                  ? `${attendance.user.firstName} ${attendance.user.lastName}`
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                {attendance.user?.email || "-"}
                              </TableCell>
                              <TableCell>
                                {getAttendanceStatusBadge(attendance.status)}
                              </TableCell>
                              <TableCell>
                                {safeFormatDate(attendance.joinTime, "p")}
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
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    openAttendanceDialog(attendance)
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedSession?.status === "IN_PROGRESS" && (
              <Button
                variant="destructive"
                onClick={() => setEndSessionDialogOpen(true)}
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Force End Session
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setDetailDialogOpen(false)}
            >
              Close
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
            <DialogTitle>Update Attendance</DialogTitle>
            <DialogDescription>
              Mark corrections on attendance for exceptional cases
            </DialogDescription>
          </DialogHeader>
          {selectedAttendance && (
            <div className="space-y-4">
              <div>
                <Label>Student</Label>
                <p className="font-medium">
                  {selectedAttendance.user
                    ? `${selectedAttendance.user.firstName} ${selectedAttendance.user.lastName}`
                    : "-"}
                </p>
              </div>
              <div>
                <Label>Current Status</Label>
                <div className="mt-1">
                  {getAttendanceStatusBadge(selectedAttendance.status)}
                </div>
              </div>
              <div>
                <Label>New Status</Label>
                <Select
                  value={newAttendanceStatus}
                  onValueChange={setNewAttendanceStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENT">Present</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                    <SelectItem value="LATE">Late</SelectItem>
                    <SelectItem value="EXCUSED">Excused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAttendanceDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateAttendance}>Update Attendance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Session Confirmation Dialog */}
      <AlertDialog
        open={endSessionDialogOpen}
        onOpenChange={setEndSessionDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force End Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately end the ongoing session and mark all
              attendances. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndSession}
              className="bg-destructive hover:bg-destructive/90"
            >
              End Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
