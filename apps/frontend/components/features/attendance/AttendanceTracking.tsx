"use client";

import React, { useState, useEffect } from "react";
import { asApiError } from "@/lib/error-handling";
import { getDisplayName } from "@/lib/utils/display";
import { ApiClient } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Calendar as CalendarIcon,
  Users,
  UserCheck,
  UserX,
  Clock,
  Download,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  admissionNumber: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  notes?: string;
  markedAt: string;
  student: Student;
}

interface ClassSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  subject: string | { id: string; name: string; code?: string };
  className: string;
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  lateStudents: number;
  attendancePercentage: number;
  isActive: boolean;
}

interface AttendanceStats {
  totalSessions: number;
  averageAttendance: number;
  presentStudents: number;
  absentStudents: number;
  lateStudents: number;
  excusedStudents: number;
  classesWithLowAttendance: number;
}

const statusConfig = {
  PRESENT: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-100",
    label: "Present",
  },
  ABSENT: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-100",
    label: "Absent",
  },
  LATE: {
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
    label: "Late",
  },
  EXCUSED: {
    icon: AlertCircle,
    color: "text-blue-600",
    bg: "bg-blue-100",
    label: "Excused",
  },
};

export default function AttendanceTracking() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [classSessions, setClassSessions] = useState<ClassSession[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [bulkAttendanceDialog, setBulkAttendanceDialog] = useState(false);
  const [newSessionDialog, setNewSessionDialog] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);

  const [attendanceForm, setAttendanceForm] = useState<
    Record<
      string,
      {
        status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
        notes: string;
      }
    >
  >({});

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    dateRange: "today",
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedClass, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch students
      const studentsResponse = await fetch(
        `/api/attendance/students?classId=${selectedClass}`
      );
      const studentsData = await studentsResponse.json();

      // Fetch attendance records
      const attendanceParams = new URLSearchParams({
        date: format(selectedDate, "yyyy-MM-dd"),
        classId: selectedClass,
        ...filters,
      });
      const attendanceResponse = await fetch(
        `/api/attendance/records?${attendanceParams}`
      );
      const attendanceData = await attendanceResponse.json();

      // Fetch class sessions
      const sessionsResponse = await fetch(
        `/api/attendance/sessions?classId=${selectedClass}&date=${format(selectedDate, "yyyy-MM-dd")}`
      );
      const sessionsData = await sessionsResponse.json();

      // Fetch stats
      const statsResponse = await fetch(
        `/api/attendance/stats?classId=${selectedClass}&date=${format(selectedDate, "yyyy-MM-dd")}`
      );
      const statsData = await statsResponse.json();

      if (studentsResponse.ok) setStudents(studentsData.data || []);
      if (attendanceResponse.ok)
        setAttendanceRecords(attendanceData.data || []);
      if (sessionsResponse.ok) setClassSessions(sessionsData.data || []);
      if (statsResponse.ok) setStats(statsData.data);

      // Initialize attendance form
      const initialForm: Record<
        string,
        { status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"; notes: string }
      > = {};
      studentsData.data?.forEach((student: Student) => {
        const existingRecord = attendanceData.data?.find(
          (record: AttendanceRecord) => record.student.id === student.id
        );
        initialForm[student.id] = {
          status: existingRecord?.status || "PRESENT",
          notes: existingRecord?.notes || "",
        };
      });
      setAttendanceForm(initialForm);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch attendance data",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (
    studentId: string,
    status: string,
    notes?: string
  ) => {
    try {
      await ApiClient.post("/attendance/mark", {
        studentId,
        date: format(selectedDate, "yyyy-MM-dd"),
        status,
        notes,
        classId: selectedClass,
      });

      toast({
        title: "Success",
        description: "Attendance marked successfully",
        status: "success",
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: asApiError(error).message || "Failed to mark attendance",
        status: "error",
      });
    }
  };

  const handleBulkAttendance = async () => {
    try {
      setMarkingAttendance(true);

      const attendanceData = Object.entries(attendanceForm).map(
        ([studentId, data]) => ({
          studentId,
          date: format(selectedDate, "yyyy-MM-dd"),
          status: data.status,
          notes: data.notes,
          classId: selectedClass,
        })
      );

      await ApiClient.post("/attendance/bulk-mark", {
        attendanceRecords: attendanceData,
      });

      toast({
        title: "Success",
        description: "Bulk attendance marked successfully",
        status: "success",
      });
      setBulkAttendanceDialog(false);
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description:
          asApiError(error).message || "Failed to mark bulk attendance",
        status: "error",
      });
    } finally {
      setMarkingAttendance(false);
    }
  };

  const handleExportAttendance = async () => {
    try {
      const response = await fetch(
        `/api/attendance/export?classId=${selectedClass}&startDate=${format(selectedDate, "yyyy-MM-dd")}&endDate=${format(selectedDate, "yyyy-MM-dd")}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `attendance-${format(selectedDate, "yyyy-MM-dd")}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: "Attendance report exported successfully",
          status: "success",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export attendance",
        status: "error",
      });
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
  }) => (
    <Card>
      <CardContent className="flex items-center p-6">
        <div className={`p-2 rounded-lg ${color} mr-4`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Tracking</h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage student attendance
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportAttendance}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Dialog
            open={bulkAttendanceDialog}
            onOpenChange={setBulkAttendanceDialog}
          >
            <DialogTrigger asChild>
              <Button>
                <Users className="mr-2 h-4 w-4" />
                Mark Attendance
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Date</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="class-1">Grade 6A</SelectItem>
                  <SelectItem value="class-2">Grade 6B</SelectItem>
                  <SelectItem value="class-3">Grade 7A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status Filter</Label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="LATE">Late</SelectItem>
                  <SelectItem value="EXCUSED">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Search Students</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Average Attendance"
            value={`${stats.averageAttendance.toFixed(1)}%`}
            icon={BarChart3}
            color="bg-blue-600"
          />
          <StatCard
            title="Present Today"
            value={stats.presentStudents}
            icon={UserCheck}
            color="bg-green-600"
          />
          <StatCard
            title="Absent Today"
            value={stats.absentStudents}
            icon={UserX}
            color="bg-red-600"
          />
          <StatCard
            title="Total Sessions"
            value={stats.totalSessions}
            icon={CalendarIcon}
            color="bg-purple-600"
          />
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="students" className="w-full">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="sessions">Class Sessions</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Attendance</CardTitle>
              <CardDescription>
                {format(selectedDate, "MMMM d, yyyy")} attendance records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Marked At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const record = attendanceRecords.find(
                      (r) => r.student.id === student.id
                    );
                    const statusInfo = statusConfig[record?.status || "ABSENT"];
                    const StatusIcon = statusInfo.icon;

                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>{student.admissionNumber}</TableCell>
                        <TableCell>
                          <Badge
                            className={`${statusInfo.color} ${statusInfo.bg}`}
                          >
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{record?.notes || "-"}</TableCell>
                        <TableCell>
                          {record?.markedAt
                            ? format(new Date(record.markedAt), "HH:mm")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={record?.status || ""}
                            onValueChange={(value) =>
                              handleMarkAttendance(student.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Mark" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PRESENT">Present</SelectItem>
                              <SelectItem value="ABSENT">Absent</SelectItem>
                              <SelectItem value="LATE">Late</SelectItem>
                              <SelectItem value="EXCUSED">Excused</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Class Sessions</CardTitle>
              <CardDescription>
                Overview of class sessions and attendance rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        {format(new Date(session.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {session.className}
                      </TableCell>
                      <TableCell>{getDisplayName(session.subject)}</TableCell>
                      <TableCell>
                        {session.startTime} - {session.endTime}
                      </TableCell>
                      <TableCell>
                        {session.presentStudents}/{session.totalStudents}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            session.attendancePercentage >= 90
                              ? "text-green-600 font-medium"
                              : session.attendancePercentage >= 75
                                ? "text-yellow-600 font-medium"
                                : "text-red-600 font-medium"
                          }
                        >
                          {session.attendancePercentage.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={session.isActive ? "default" : "secondary"}
                        >
                          {session.isActive ? "Active" : "Completed"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>
                Select dates to view attendance records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Attendance for {format(selectedDate, "MMMM d, yyyy")}
                  </h3>
                  {stats && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-green-800">Present Students</span>
                        <span className="font-semibold text-green-900">
                          {stats.presentStudents}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <span className="text-red-800">Absent Students</span>
                        <span className="font-semibold text-red-900">
                          {stats.absentStudents}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <span className="text-yellow-800">Late Students</span>
                        <span className="font-semibold text-yellow-900">
                          {stats.lateStudents}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-blue-800">Excused Students</span>
                        <span className="font-semibold text-blue-900">
                          {stats.excusedStudents}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Attendance Dialog */}
      <Dialog
        open={bulkAttendanceDialog}
        onOpenChange={setBulkAttendanceDialog}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Mark Bulk Attendance</DialogTitle>
            <DialogDescription>
              Mark attendance for all students for{" "}
              {format(selectedDate, "MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={attendanceForm[student.id]?.status || "PRESENT"}
                        onValueChange={(
                          value: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"
                        ) =>
                          setAttendanceForm({
                            ...attendanceForm,
                            [student.id]: {
                              ...attendanceForm[student.id],
                              status: value,
                            },
                          })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRESENT">Present</SelectItem>
                          <SelectItem value="ABSENT">Absent</SelectItem>
                          <SelectItem value="LATE">Late</SelectItem>
                          <SelectItem value="EXCUSED">Excused</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Optional notes..."
                        value={attendanceForm[student.id]?.notes || ""}
                        onChange={(e) =>
                          setAttendanceForm({
                            ...attendanceForm,
                            [student.id]: {
                              ...attendanceForm[student.id],
                              notes: e.target.value,
                            },
                          })
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkAttendanceDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkAttendance} disabled={markingAttendance}>
              {markingAttendance ? "Marking..." : "Mark Attendance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
