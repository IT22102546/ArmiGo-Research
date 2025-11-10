"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ApiClient } from "@/lib/api/api-client";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
const logger = createLogger("AttendancePage");
import { format } from "date-fns";
import { getDisplayName } from "@/lib/utils/display";

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  present: boolean;
  type: string;
  classId?: string;
  notes?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  class?: {
    name: string;
    subject: string;
  };
}

interface AttendanceStats {
  totalClasses: number;
  attended: number;
  percentage: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
}

interface Class {
  id: string;
  name: string;
  subject: string | { id: string; name: string; code?: string };
  grade: string | { id: string; name: string; code?: string };
}

const AttendancePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Map<string, boolean>>(new Map());
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"mark" | "view">("mark");

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && viewMode === "mark") {
      fetchClassStudents();
    }
  }, [selectedClass, viewMode]);

  useEffect(() => {
    if (viewMode === "view") {
      fetchAttendanceRecords();
    }
  }, [viewMode, selectedDate, selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await ApiClient.get<Class[]>("/classes");
      setClasses(Array.isArray(response) ? response : []);
    } catch (error) {
      logger.error("Error fetching classes:", error);
      handleApiError(
        error,
        "AttendancePage.fetchClasses",
        "Failed to load classes"
      );
      setClasses([]);
    }
  };

  const fetchClassStudents = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.get<any[]>(
        `/enrollments?classId=${selectedClass}&status=ACTIVE`
      );

      const studentData = response.map((enrollment: any) => ({
        id: enrollment.student.id,
        firstName: enrollment.student.firstName,
        lastName: enrollment.student.lastName,
        email: enrollment.student.email,
      }));

      setStudents(studentData);

      // Check existing attendance for this date
      const existingAttendance = await ApiClient.get<AttendanceRecord[]>(
        `/attendance?classId=${selectedClass}&date=${selectedDate}`
      );

      const attendanceMap = new Map<string, boolean>();
      existingAttendance.forEach((record) => {
        attendanceMap.set(record.userId, record.present);
      });
      setAttendance(attendanceMap);
    } catch (error) {
      logger.error("Error fetching students:", error);
      handleApiError(
        error,
        "AttendancePage.fetchClassStudents",
        "Failed to load students"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (selectedClass) params.append("classId", selectedClass);

      const response = await ApiClient.get<AttendanceRecord[]>(
        `/attendance?${params.toString()}`
      );
      setAttendanceRecords(response);

      // Fetch stats
      const statsResponse = await ApiClient.get<AttendanceStats>(
        `/attendance/stats?${params.toString()}`
      );
      setStats(statsResponse);
    } catch (error) {
      logger.error("Error fetching attendance records:", error);
      handleApiError(
        error,
        "AttendancePage.fetchAttendanceRecords",
        "Failed to load attendance records"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (studentId: string) => {
    const newAttendance = new Map(attendance);
    const currentStatus = newAttendance.get(studentId);
    newAttendance.set(studentId, !currentStatus);
    setAttendance(newAttendance);
  };

  const handleMarkAttendance = async () => {
    if (!selectedClass || students.length === 0) {
      toast.error("Please select a class with students");
      return;
    }

    try {
      setLoading(true);

      const presentStudents = students
        .filter((student) => attendance.get(student.id) === true)
        .map((student) => student.id);

      const absentStudents = students
        .filter((student) => attendance.get(student.id) === false)
        .map((student) => student.id);

      await ApiClient.post("/attendance/bulk-mark", {
        classId: selectedClass,
        date: selectedDate,
        presentStudentIds: presentStudents,
        absentStudentIds: absentStudents,
      });

      toast.success("Attendance marked successfully");
      fetchClassStudents(); // Refresh to show updated data
    } catch (error) {
      logger.error("Error marking attendance:", error);
      handleApiError(
        error,
        "AttendancePage.handleMarkAttendance",
        "Failed to mark attendance"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllPresent = () => {
    const newAttendance = new Map<string, boolean>();
    students.forEach((student) => {
      newAttendance.set(student.id, true);
    });
    setAttendance(newAttendance);
  };

  const handleMarkAllAbsent = () => {
    const newAttendance = new Map<string, boolean>();
    students.forEach((student) => {
      newAttendance.set(student.id, false);
    });
    setAttendance(newAttendance);
  };

  const filteredRecords = attendanceRecords.filter((record) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.user.firstName.toLowerCase().includes(searchLower) ||
      record.user.lastName.toLowerCase().includes(searchLower) ||
      record.user.email.toLowerCase().includes(searchLower) ||
      record.class?.name.toLowerCase().includes(searchLower) ||
      getDisplayName(record.class?.subject).toLowerCase().includes(searchLower)
    );
  });

  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.firstName.toLowerCase().includes(searchLower) ||
      student.lastName.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Student Attendance
        </h2>
        <p className="text-muted-foreground">
          Mark and view student attendance records
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === "mark" ? "default" : "outline"}
          onClick={() => setViewMode("mark")}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Mark Attendance
        </Button>
        <Button
          variant={viewMode === "view" ? "default" : "outline"}
          onClick={() => setViewMode("view")}
        >
          <FileText className="w-4 h-4 mr-2" />
          View Records
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes
                    .filter((cls) => cls.id)
                    .map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {getDisplayName(cls.subject)} - Grade{" "}
                        {getDisplayName(cls.grade)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mark Attendance View */}
      {viewMode === "mark" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Mark Attendance</CardTitle>
              {students.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllPresent}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark All Present
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAbsent}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Mark All Absent
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !selectedClass ? (
              <div className="text-center py-12 text-muted-foreground">
                Please select a class to mark attendance
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm
                  ? "No students match your search"
                  : "No students enrolled in this class"}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => {
                      const isPresent = attendance.get(student.id) === true;
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.firstName} {student.lastName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {student.email}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant={isPresent ? "default" : "destructive"}
                              size="sm"
                              onClick={() => toggleAttendance(student.id)}
                            >
                              {isPresent ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Present
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Absent
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleMarkAttendance} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Save Attendance
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Records */}
      {viewMode === "view" && (
        <>
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Classes
                    </p>
                    <p className="text-3xl font-bold">{stats.totalClasses}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Present</p>
                    <p className="text-3xl font-bold">{stats.present}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Absent</p>
                    <p className="text-3xl font-bold">{stats.absent}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Attendance Rate
                    </p>
                    <p className="text-3xl font-bold">
                      {stats.percentage.toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchTerm
                    ? "No records match your search"
                    : "No attendance records found"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.user.firstName} {record.user.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.user.email}
                        </TableCell>
                        <TableCell>
                          {getDisplayName(record.class?.subject) || "N/A"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(record.date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={record.present ? "default" : "destructive"}
                          >
                            {record.present ? "Present" : "Absent"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AttendancePage;
