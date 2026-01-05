"use client";

import { useState, useEffect } from "react";
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
import { Video, Play, Download, Copy, Search, RefreshCw } from "lucide-react";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
import { format } from "date-fns";
import { videoApi, classesApi } from "@/lib/api";

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

export default function RecordingsPage() {
  const [loading, setLoading] = useState(true);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("all");

  useEffect(() => {
    fetchClasses();
    fetchRecordings();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await classesApi.getMyClasses();
      setClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load classes", error);
    }
  };

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const sessions = await videoApi.getSessions({});
      const endedSessions = Array.isArray(sessions)
        ? sessions.filter((s: any) => s.status === "ENDED" && s.recordingUrl)
        : [];
      setRecordings(endedSessions);
    } catch (error) {
      handleApiError(error, "Failed to load recordings");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (recordingUrl: string) => {
    navigator.clipboard.writeText(recordingUrl);
    handleApiSuccess("Recording link copied to clipboard");
  };

  const handlePlay = (recordingUrl: string) => {
    window.open(recordingUrl, "_blank");
  };

  const filteredRecordings = recordings.filter((recording) => {
    const matchesSearch =
      recording.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;
    const matchesClass =
      classFilter === "all" || recording.classId === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Session Recordings</h1>
          <p className="text-muted-foreground mt-1">
            Access and share your class recordings
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Recordings
            </CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recordings.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                All Recordings ({filteredRecordings.length})
              </CardTitle>
              <CardDescription>
                Showing {filteredRecordings.length} of {recordings.length}{" "}
                recordings
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchRecordings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recordings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes
                  .filter((cls) => cls.id)
                  .map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredRecordings.length === 0 ? (
            <div className="text-center py-12">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No recordings found
              </h3>
              <p className="text-muted-foreground">
                Session recordings will appear here after classes end
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecordings.map((recording) => (
                  <TableRow key={recording.id}>
                    <TableCell className="font-medium">
                      {recording.title || "Untitled Session"}
                    </TableCell>
                    <TableCell>
                      {classes.find((c) => c.id === recording.classId)?.name ||
                        "-"}
                    </TableCell>
                    <TableCell>
                      {safeFormatDate(recording.scheduledAt, "PPp")}
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>{recording.participants?.length || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePlay(recording.recordingUrl)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyLink(recording.recordingUrl)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
