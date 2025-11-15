"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Separator } from "@/components/ui/separator";
import {
  Video,
  Grid3x3,
  User,
  AlertTriangle,
  Flag,
  MessageSquare,
  Eye,
  EyeOff,
  Users,
  Clock,
  Camera,
  Monitor,
  MousePointer,
  Maximize2,
  Copy,
  RefreshCw,
  Filter,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import { examsApi } from "@/lib/api/endpoints/exams";
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

type SeverityLevel = "INFO" | "WARNING" | "CRITICAL";
type ViewLayout = "grid" | "single";

interface ProctoringEvent {
  id: string;
  attemptId: string;
  eventType: string;
  severity: SeverityLevel;
  description?: string;
  snapshotUrl?: string;
  faceMatchScore?: number;
  tabSwitchCount?: number;
  timestamp: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface StudentAttempt {
  id: string;
  studentId: string;
  examId: string;
  status: string;
  startedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  faceVerificationScore?: number;
  proctoringLogs?: ProctoringEvent[];
  videoFeedUrl?: string;
  currentStatus: "OK" | "WARNING" | "CRITICAL";
  flagged: boolean;
  suspiciousActivityCount: number;
}

export function LiveProctoringPage() {
  const searchParams = useSearchParams();
  const examId = searchParams?.get("examId");

  // State
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [events, setEvents] = useState<ProctoringEvent[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<StudentAttempt | null>(
    null
  );
  const [viewLayout, setViewLayout] = useState<ViewLayout>("grid");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Dialog states
  const [studentDrawerOpen, setStudentDrawerOpen] = useState(false);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [messageText, setMessageText] = useState("");

  // Fetch data
  useEffect(() => {
    if (examId) {
      fetchProctoringData();
    }
  }, [examId]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh || !examId) return;

    const interval = setInterval(() => {
      fetchProctoringData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, examId]);

  const fetchProctoringData = async (silent = false) => {
    if (!examId) return;

    try {
      if (!silent) setLoading(true);

      const [attemptsData, eventsData] = await Promise.all([
        examsApi.getExamAttempts(examId),
        examsApi.getProctoringEvents(examId),
      ]);

      // Process attempts to add status indicators
      const processedAttempts = (attemptsData.attempts || []).map(
        (attempt: any) => {
          const attemptEvents = eventsData.filter(
            (e: any) => e.attemptId === attempt.id
          );
          const criticalCount = attemptEvents.filter(
            (e: any) => e.severity === "CRITICAL"
          ).length;
          const warningCount = attemptEvents.filter(
            (e: any) => e.severity === "WARNING"
          ).length;

          let currentStatus: "OK" | "WARNING" | "CRITICAL" = "OK";
          if (criticalCount > 0) currentStatus = "CRITICAL";
          else if (warningCount > 2) currentStatus = "WARNING";

          return {
            ...attempt,
            currentStatus,
            suspiciousActivityCount: criticalCount + warningCount,
            proctoringLogs: attemptEvents,
          };
        }
      );

      setAttempts(processedAttempts);
      setEvents(eventsData);
    } catch (error) {
      if (!silent) {
        handleApiError(error, "Failed to fetch proctoring data");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleFlagAttempt = async () => {
    if (!selectedAttempt || !flagReason.trim()) {
      handleApiError(null, "Please provide a reason for flagging");
      return;
    }

    try {
      await examsApi.flagAttempt(selectedAttempt.id, {
        reason: flagReason,
        flagged: true,
      });
      handleApiSuccess("Attempt flagged successfully");
      setFlagDialogOpen(false);
      setFlagReason("");
      fetchProctoringData();
    } catch (error) {
      handleApiError(error, "Failed to flag attempt");
    }
  };

  const handleSendMessage = async () => {
    if (!selectedAttempt || !messageText.trim()) {
      handleApiError(null, "Please enter a message");
      return;
    }

    try {
      await examsApi.sendStudentMessage(selectedAttempt.studentId, {
        message: messageText,
        examId: examId!,
      });
      handleApiSuccess("Message sent to student");
      setMessageDialogOpen(false);
      setMessageText("");
    } catch (error) {
      handleApiError(error, "Failed to send message");
    }
  };

  const openStudentDrawer = (attempt: StudentAttempt) => {
    setSelectedAttempt(attempt);
    setStudentDrawerOpen(true);
  };

  const getStatusBadge = (status: "OK" | "WARNING" | "CRITICAL") => {
    const config = {
      OK: {
        variant: "outline" as const,
        className: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      WARNING: {
        variant: "outline" as const,
        className: "bg-yellow-100 text-yellow-800",
        icon: AlertTriangle,
      },
      CRITICAL: {
        variant: "destructive" as const,
        className: "",
        icon: XCircle,
      },
    };

    const { variant, className, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getSeverityIcon = (severity: SeverityLevel) => {
    switch (severity) {
      case "CRITICAL":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      FACE_DETECTED: "Face Detected",
      FACE_NOT_DETECTED: "No Face Detected",
      MULTIPLE_FACES: "Multiple Faces",
      TAB_SWITCH: "Tab Switch",
      WINDOW_BLUR: "Window Lost Focus",
      COPY_PASTE: "Copy/Paste Detected",
      RIGHT_CLICK: "Right Click",
      FULL_SCREEN_EXIT: "Exited Fullscreen",
      SUSPICIOUS_ACTIVITY: "Suspicious Activity",
    };
    return labels[eventType] || eventType;
  };

  const filteredEvents = events.filter((event) => {
    if (severityFilter !== "all" && event.severity !== severityFilter)
      return false;
    if (searchTerm) {
      const student = attempts.find((a) => a.id === event.attemptId)?.student;
      const studentName = student
        ? `${student.firstName} ${student.lastName}`.toLowerCase()
        : "";
      return studentName.includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const filteredAttempts = attempts.filter((attempt) => {
    if (searchTerm) {
      const studentName =
        `${attempt.student?.firstName || ""} ${attempt.student?.lastName || ""}`.toLowerCase();
      return studentName.includes(searchTerm.toLowerCase());
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!examId) {
    return (
      <div className="text-center py-12">
        <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">No exam selected for proctoring</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Proctoring & Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Monitor student exam attempts in real-time
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={autoRefresh ? "default" : "outline"}>
            <RefreshCw
              className={`h-3 w-3 mr-1 ${autoRefresh ? "animate-spin" : ""}`}
            />
            Auto-refresh: {autoRefresh ? "ON" : "OFF"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "Pause" : "Resume"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchProctoringData()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Controls & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <Label>Search Student</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Severity Filter */}
            <div>
              <Label>Severity Level</Label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="CRITICAL">Critical Only</SelectItem>
                  <SelectItem value="WARNING">Warning Only</SelectItem>
                  <SelectItem value="INFO">Info Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Layout */}
            <div>
              <Label>View Layout</Label>
              <Select
                value={viewLayout}
                onValueChange={(val) => setViewLayout(val as ViewLayout)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid View</SelectItem>
                  <SelectItem value="single">Single Focus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stats */}
            <div>
              <Label>Active Students</Label>
              <div className="flex items-center gap-2 mt-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{attempts.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Video Grid */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Student Video Feeds
              </CardTitle>
              <CardDescription>
                {viewLayout === "grid"
                  ? "Grid view of all active students"
                  : "Focused view on selected student"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {viewLayout === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="relative border rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => openStudentDrawer(attempt)}
                    >
                      {/* Video Feed Placeholder */}
                      <div className="aspect-video bg-gray-900 flex items-center justify-center">
                        <Camera className="h-8 w-8 text-gray-600" />
                      </div>

                      {/* Student Info Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-white text-sm font-medium">
                            {attempt.student?.firstName || ""}{" "}
                            {attempt.student?.lastName || "Unknown"}
                          </div>
                          {getStatusBadge(attempt.currentStatus)}
                        </div>
                      </div>

                      {/* Flagged Indicator */}
                      {attempt.flagged && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="destructive">
                            <Flag className="h-3 w-3" />
                          </Badge>
                        </div>
                      )}

                      {/* Suspicious Activity Count */}
                      {attempt.suspiciousActivityCount > 0 && (
                        <div className="absolute top-2 left-2">
                          <Badge
                            variant="outline"
                            className="bg-red-100 text-red-800"
                          >
                            {attempt.suspiciousActivityCount} events
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : selectedAttempt ? (
                <div className="space-y-4">
                  {/* Single Student Focus */}
                  <div className="relative border rounded-lg overflow-hidden">
                    <div className="aspect-video bg-gray-900 flex items-center justify-center">
                      <Camera className="h-12 w-12 text-gray-600" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-white">
                          <div className="text-xl font-bold">
                            {selectedAttempt.student?.firstName || ""}{" "}
                            {selectedAttempt.student?.lastName || "Unknown"}
                          </div>
                          <div className="text-sm opacity-80">
                            {selectedAttempt.student?.email || ""}
                          </div>
                        </div>
                        {getStatusBadge(selectedAttempt.currentStatus)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setFlagDialogOpen(true)}
                      variant="outline"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Flag Attempt
                    </Button>
                    <Button
                      onClick={() => setMessageDialogOpen(true)}
                      variant="outline"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a student to view in single mode</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Events Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                AI Events
              </CardTitle>
              <CardDescription>
                Real-time proctoring events ({filteredEvents.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] pr-4 overflow-y-auto">
                <div className="space-y-3">
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No events detected</p>
                    </div>
                  ) : (
                    filteredEvents.map((event) => {
                      const attempt = attempts.find(
                        (a) => a.id === event.attemptId
                      );
                      return (
                        <div
                          key={event.id}
                          className="border rounded-lg p-3 hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => {
                            if (attempt) openStudentDrawer(attempt);
                          }}
                        >
                          <div className="flex items-start gap-2">
                            {getSeverityIcon(event.severity)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-sm truncate">
                                  {attempt
                                    ? `${attempt.student?.firstName || ""} ${attempt.student?.lastName || "Unknown"}`
                                    : "Unknown"}
                                </span>
                                <Badge
                                  variant={
                                    event.severity === "CRITICAL"
                                      ? "destructive"
                                      : event.severity === "WARNING"
                                        ? "outline"
                                        : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {event.severity}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {getEventTypeLabel(event.eventType)}
                              </div>
                              {event.description && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {event.description}
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                <Clock className="h-3 w-3" />
                                {safeFormatDate(event.timestamp, "p")}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Student Details Drawer */}
      <Sheet open={studentDrawerOpen} onOpenChange={setStudentDrawerOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>
              {selectedAttempt
                ? `${selectedAttempt.student?.firstName || ""} ${selectedAttempt.student?.lastName || "Unknown"}`
                : "Student Details"}
            </SheetTitle>
            <SheetDescription>
              Live feed and proctoring event history
            </SheetDescription>
          </SheetHeader>

          {selectedAttempt && (
            <div className="space-y-6 mt-6">
              {/* Live Video */}
              <div>
                <h3 className="font-semibold mb-2">Live Video Feed</h3>
                <div className="relative border rounded-lg overflow-hidden">
                  <div className="aspect-video bg-gray-900 flex items-center justify-center">
                    <Camera className="h-12 w-12 text-gray-600" />
                  </div>
                </div>
              </div>

              {/* Status & Score */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Current Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedAttempt.currentStatus)}
                  </div>
                </div>
                <div>
                  <Label>Face Verification Score</Label>
                  <div className="mt-1 text-2xl font-bold">
                    {selectedAttempt.faceVerificationScore
                      ? `${(selectedAttempt.faceVerificationScore * 100).toFixed(1)}%`
                      : "N/A"}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Past AI Events */}
              <div>
                <h3 className="font-semibold mb-3">Past AI Events</h3>
                <div className="h-[300px] overflow-y-auto">
                  <div className="space-y-2">
                    {selectedAttempt.proctoringLogs &&
                    selectedAttempt.proctoringLogs.length > 0 ? (
                      selectedAttempt.proctoringLogs.map((event) => (
                        <div
                          key={event.id}
                          className="border rounded p-3 text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getSeverityIcon(event.severity)}
                              <span className="font-medium">
                                {getEventTypeLabel(event.eventType)}
                              </span>
                            </div>
                            <Badge variant="outline">{event.severity}</Badge>
                          </div>
                          {event.description && (
                            <p className="text-muted-foreground mt-1">
                              {event.description}
                            </p>
                          )}
                          <div className="text-xs text-muted-foreground mt-2">
                            {safeFormatDate(event.timestamp)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No events recorded</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  className="w-full"
                  variant={selectedAttempt.flagged ? "outline" : "destructive"}
                  onClick={() => setFlagDialogOpen(true)}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  {selectedAttempt.flagged
                    ? "Already Flagged"
                    : "Flag as Suspicious"}
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setMessageDialogOpen(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message to Student
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Flag Dialog */}
      <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Attempt as Suspicious</DialogTitle>
            <DialogDescription>
              Mark this attempt as suspicious and provide a reason. This will be
              recorded for review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Reason for Flagging *</Label>
              <Textarea
                placeholder="Explain why this attempt is being flagged..."
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleFlagAttempt}
              disabled={!flagReason.trim()}
            >
              <Flag className="h-4 w-4 mr-2" />
              Flag Attempt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to Student</DialogTitle>
            <DialogDescription>
              Send a direct message to the student during the exam
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Message *</Label>
              <Textarea
                placeholder="Type your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMessageDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
