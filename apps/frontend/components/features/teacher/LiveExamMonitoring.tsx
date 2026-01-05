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
import {
  ArrowLeft,
  AlertTriangle,
  Eye,
  Camera,
  RefreshCw,
  MessageSquare,
  Flag,
} from "lucide-react";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
import { format } from "date-fns";
import { examsApi, proctoringApi } from "@/lib/api/endpoints";

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

interface LiveMonitoringProps {
  examId: string;
}

export default function LiveExamMonitoring({ examId }: LiveMonitoringProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<any>(null);
  const [activeAttempts, setActiveAttempts] = useState<any[]>([]);
  const [proctoringLogs, setProctoringLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchExamData();
    fetchActiveAttempts();
    fetchProctoringLogs();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchActiveAttempts();
      fetchProctoringLogs();
    }, 30000);

    return () => clearInterval(interval);
  }, [examId]);

  const fetchExamData = async () => {
    try {
      setLoading(true);
      const response = await examsApi.getById(examId);
      setExamData(response);
    } catch (error) {
      handleApiError(error, "Failed to load exam data");
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveAttempts = async () => {
    try {
      const response = await proctoringApi.getActiveAttempts(examId);
      setActiveAttempts(response || []);
    } catch (error) {
      console.error("Failed to load active attempts", error);
    }
  };

  const fetchProctoringLogs = async () => {
    try {
      const response = await proctoringApi.getExamLogs(examId);
      setProctoringLogs(response || []);
    } catch (error) {
      console.error("Failed to load proctoring logs", error);
    }
  };

  const handleFlagAttempt = async (attemptId: string) => {
    try {
      await proctoringApi.flagAttempt(attemptId, {
        reason: "Flagged by proctor for review",
        flagged: true,
      });
      handleApiSuccess("Attempt flagged for review");
      fetchActiveAttempts();
    } catch (error) {
      handleApiError(error, "Failed to flag attempt");
    }
  };

  const handleSendMessage = async (attemptId: string) => {
    try {
      // Find the attempt to get the student ID
      const attempt = activeAttempts.find((a) => a.id === attemptId);
      if (attempt) {
        await proctoringApi.sendStudentMessage(attempt.studentId, {
          message: "Please focus on your exam.",
          examId: examId,
        });
        handleApiSuccess("Message sent to student");
      }
    } catch (error) {
      handleApiError(error, "Failed to send message");
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: any = {
      HIGH: "text-red-600",
      MEDIUM: "text-yellow-600",
      LOW: "text-blue-600",
    };
    return colors[severity] || "text-gray-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Loading monitoring data...
          </p>
        </div>
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
            onClick={() => router.push("/teacher/exams")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Live Exam Monitoring</h1>
            <p className="text-muted-foreground mt-1">{examData?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="gap-1">
            <Eye className="h-3 w-3" />
            LIVE
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchActiveAttempts();
              fetchProctoringLogs();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAttempts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeAttempts.reduce((sum, a) => sum + (a.flagCount || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {proctoringLogs.filter((l) => l.severity === "HIGH").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Attempts */}
      <Card>
        <CardHeader>
          <CardTitle>Active Students ({activeAttempts.length})</CardTitle>
          <CardDescription>
            Monitor student activity in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeAttempts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No active attempts
              </p>
            ) : (
              activeAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {attempt.student?.firstName || ""}{" "}
                      {attempt.student?.lastName || "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Started: {safeFormatDate(attempt.startedAt, "p")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {attempt.flagCount > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <Flag className="h-3 w-3" />
                        {attempt.flagCount}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendMessage(attempt.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFlagAttempt(attempt.id)}
                    >
                      <Flag className="h-4 w-4 mr-1" />
                      Flag
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Proctoring Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Proctoring Events ({proctoringLogs.length})</CardTitle>
          <CardDescription>
            Recent suspicious activities and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {proctoringLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No events logged
              </p>
            ) : (
              proctoringLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className={`h-5 w-5 mt-0.5 ${getSeverityColor(log.severity)}`}
                    />
                    <div>
                      <p className="font-medium">{log.eventType}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.student?.firstName || ""}{" "}
                        {log.student?.lastName || "Unknown"}
                      </p>
                      <p className="text-sm mt-1">{log.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{log.severity}</Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {safeFormatDate(log.createdAt, "p")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
