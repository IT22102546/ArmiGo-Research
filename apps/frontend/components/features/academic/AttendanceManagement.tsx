import React, { useState, useEffect } from "react";
import { getDisplayName, getDisplayId } from "@/lib/utils/display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import {
  ArrowLeft,
  Home,
  Search,
  Clock,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  XCircle,
  BarChart3,
  MoreVertical,
  Loader2,
  Users,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  parseISO,
  isSameDay,
} from "date-fns";
import { attendanceApi } from "@/lib/api/endpoints/attendance";
import { classesApi } from "@/lib/api/endpoints/classes";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { createLogger } from "@/lib/utils/logger";
import {
  handleApiError,
  handleApiSuccess,
  asApiError,
} from "@/lib/error-handling";
const logger = createLogger("AttendanceManagement");
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";

interface Student {
  id: string;
  userId: string;
  studentId: string;
  name: string;
  grade: string;
  gradeId?: string;
  status: "Present" | "Absent" | "Late" | "Not Marked";
  classId?: string;
  className?: string;
}

interface AttendanceData {
  [key: string]: "present" | "absent" | "late";
}

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  present: boolean;
  joinTime?: string;
  leaveTime?: string;
  duration?: number;
  notes?: string;
  type: string;
  class?: {
    id: string;
    name: string;
    subject: string | { id: string; name: string; code?: string };
  };
}

interface Class {
  id: string;
  name: string;
  subject: string | { id: string; name: string; code?: string };
  grade: string | { id: string; name: string; code?: string };
  teacherId: string;
  status: string;
}

const AttendanceManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"student" | "my">("student");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [myAttendanceMonth, setMyAttendanceMonth] = useState(new Date());

  // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState<string | null>(
    null
  );
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [myAttendanceData, setMyAttendanceData] = useState<AttendanceData>({});
  const [myAttendanceStats, setMyAttendanceStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    attendanceRatio: 0,
  });

  // Fetch teacher classes on mount
  useEffect(() => {
    if (user?.role?.includes("TEACHER")) {
      fetchTeacherClasses();
    }
  }, [user]);

  // Fetch students for attendance when filters change
  useEffect(() => {
    if (activeTab === "student" && user?.role?.includes("TEACHER")) {
      const timeoutId = setTimeout(() => {
        fetchStudentsForAttendance();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [
    activeTab,
    selectedGrade,
    selectedSubject,
    selectedClass,
    selectedDate,
    user,
  ]);

  // Fetch my attendance when tab or month changes
  useEffect(() => {
    if (activeTab === "my" && user?.role?.includes("STUDENT")) {
      fetchMyAttendance();
      fetchMyAttendanceSummary();
    }
  }, [activeTab, myAttendanceMonth, user]);

  const fetchTeacherClasses = async () => {
    try {
      const response = await classesApi.getMyClasses();
      const teacherClasses = Array.isArray(response)
        ? response
        : response?.data || [];
      setClasses(Array.isArray(teacherClasses) ? teacherClasses : []);
    } catch (error) {
      logger.error("Failed to load classes:", error);
      handleApiError(
        error,
        "AttendanceManagement.fetchTeacherClasses",
        "Failed to load classes"
      );
      setClasses([]);
    }
  };

  const fetchStudentsForAttendance = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      let studentsData: Student[] = [];

      // Filter classes by grade, subject, and specific class
      const filteredClasses = classes.filter(
        (cls) =>
          (selectedGrade === "all" ||
            getDisplayId(cls.grade) === selectedGrade) &&
          (selectedSubject === "all" ||
            getDisplayId(cls.subject) === selectedSubject) &&
          (selectedClass === "all" || cls.id === selectedClass)
      );

      // Get detailed class information with enrollments
      const classesWithDetails = await Promise.all(
        filteredClasses.map(async (cls) => {
          try {
            const classResponse = await classesApi.getById(cls.id);
            return classResponse?.data || classResponse;
          } catch (error) {
            return null;
          }
        })
      );

      // Transform enrollments to students
      studentsData = classesWithDetails
        .filter((cls): cls is any => cls !== null)
        .flatMap((cls: any) =>
          (cls.enrollments || []).map((enrollment: any) => ({
            id: enrollment.id,
            userId: enrollment.studentId,
            studentId:
              enrollment.student?.studentProfile?.studentId ||
              `STU${enrollment.studentId?.slice(-6) || "000000"}`,
            name: `${enrollment.student?.firstName || ""} ${enrollment.student?.lastName || ""}`.trim(),
            grade: getDisplayName(cls.grade),
            gradeId: getDisplayId(cls.grade),
            classId: cls.id,
            className: cls.name,
            status: "Not Marked" as const,
          }))
        );

      // Fetch existing attendance records for the selected date
      if (selectedDate) {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        try {
          const attendanceResponse = await attendanceApi.getAll({
            startDate: formattedDate,
            endDate: formattedDate,
            classId: selectedClass !== "all" ? selectedClass : undefined,
          });

          const attendanceRecords = Array.isArray(attendanceResponse)
            ? attendanceResponse
            : [];

          // Update student status based on existing attendance
          studentsData = studentsData.map((student) => {
            const record = attendanceRecords.find(
              (ar: any) =>
                ar.userId === student.userId &&
                isSameDay(parseISO(ar.date), selectedDate)
            );

            if (record) {
              let status: "Present" | "Absent" | "Late" = record.present
                ? "Present"
                : "Absent";

              // Check if late (arrived after class start time)
              if (record.present && record.joinTime) {
                const joinTime = new Date(record.joinTime);
                const classStartTime = new Date(record.date);
                classStartTime.setHours(9, 0, 0, 0); // Assuming 9 AM class start
                if (joinTime > classStartTime) {
                  status = "Late";
                }
              }
              return { ...student, status };
            }
            return student;
          });
        } catch (error) {
          logger.error(
            "Error while fetching attendance for selected date:",
            error
          );
          // Continue with "Not Marked" status
        }
      }

      setStudents(studentsData);
    } catch (error) {
      logger.error("Failed to load students:", error);
      handleApiError(
        error,
        "AttendanceManagement.fetchStudentsForAttendance",
        "Failed to load students"
      );
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAttendance = async () => {
    if (!user?.id) return;

    try {
      const month = myAttendanceMonth.getMonth() + 1;
      const year = myAttendanceMonth.getFullYear();

      const response = await attendanceApi.getStudentAttendance(user.id, {
        month,
        year,
      });
      const attendanceRecords = Array.isArray(response) ? response : [];

      // Transform to calendar format
      const calendarData: AttendanceData = {};
      attendanceRecords.forEach((record: AttendanceRecord) => {
        const dateKey = format(parseISO(record.date), "yyyy-MM-dd");
        let status: "present" | "absent" | "late" = record.present
          ? "present"
          : "absent";

        // Check if late
        if (record.present && record.joinTime) {
          const joinTime = new Date(record.joinTime);
          const classTime = new Date(record.date);
          classTime.setHours(9, 0, 0, 0);
          if (joinTime > classTime) {
            status = "late";
          }
        }
        calendarData[dateKey] = status;
      });

      setMyAttendanceData(calendarData);
    } catch (error) {
      logger.error("Failed to load my attendance data:", error);
      handleApiError(
        error,
        "AttendanceManagement.fetchMyAttendance",
        "Failed to load attendance data"
      );
    }
  };

  const fetchMyAttendanceSummary = async () => {
    if (!user?.id) return;

    try {
      const month = myAttendanceMonth.getMonth() + 1;
      const year = myAttendanceMonth.getFullYear();

      const response = await attendanceApi.getSummary(user.id, month, year);
      const summary = response?.data || response;

      setMyAttendanceStats({
        totalDays: summary?.totalClasses || 0,
        presentDays: summary?.attended || 0,
        absentDays: (summary?.totalClasses || 0) - (summary?.attended || 0),
        attendanceRatio: summary?.percentage || 0,
      });
    } catch (error) {
      logger.error("Failed to load my attendance summary:", error);
      handleApiError(
        error,
        "AttendanceManagement.fetchMyAttendanceSummary",
        "Failed to load attendance summary"
      );
      setMyAttendanceStats({
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        attendanceRatio: 0,
      });
    }
  };

  const fetchStudentHistory = async (student: Student) => {
    try {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();

      const response = await attendanceApi.getStudentAttendance(
        student.userId,
        { month, year }
      );
      const attendanceRecords = Array.isArray(response) ? response : [];

      const calendarData: AttendanceData = {};
      attendanceRecords.forEach((record: AttendanceRecord) => {
        const dateKey = format(parseISO(record.date), "yyyy-MM-dd");
        let status: "present" | "absent" | "late" = record.present
          ? "present"
          : "absent";

        if (record.present && record.joinTime) {
          const joinTime = new Date(record.joinTime);
          const classTime = new Date(record.date);
          classTime.setHours(9, 0, 0, 0);
          if (joinTime > classTime) {
            status = "late";
          }
        }
        calendarData[dateKey] = status;
      });

      setAttendanceData(calendarData);
    } catch (error) {
      logger.error("Failed to load attendance history:", error);
      handleApiError(
        error,
        "AttendanceManagement.fetchStudentHistory",
        "Failed to load attendance history"
      );
      setAttendanceData({});
    }
  };

  const handleMarkAttendance = async (
    studentId: string,
    status: "Present" | "Absent" | "Late"
  ) => {
    setMarkingAttendance(studentId);
    try {
      await attendanceApi.mark({
        userId: studentId,
        date: format(selectedDate, "yyyy-MM-dd"),
        classId: selectedClass !== "all" ? selectedClass : undefined,
        present: status === "Present" || status === "Late",
        notes: status === "Late" ? "Student arrived late" : undefined,
        type: "CLASS",
      });

      handleApiSuccess(`Attendance marked as ${status}`);

      // Refresh the student list
      await fetchStudentsForAttendance();
    } catch (error) {
      logger.error("Failed to mark attendance:", error);
      handleApiError(
        error,
        "AttendanceManagement.handleMarkAttendance",
        "Failed to mark attendance"
      );
    } finally {
      setMarkingAttendance(null);
    }
  };

  const handleBulkMarkAttendance = async (status: "Present" | "Absent") => {
    if (students.length === 0) {
      toast.error("No students to mark");
      return;
    }

    setMarkingAttendance("bulk");
    try {
      const attendances = students.map((student) => ({
        userId: student.userId,
        date: format(selectedDate, "yyyy-MM-dd"),
        classId: student.classId,
        present: status === "Present",
        type: "CLASS",
      }));

      await attendanceApi.bulkMark({ attendances });

      handleApiSuccess(`Bulk marked all students as ${status}`);
      await fetchStudentsForAttendance();
    } catch (error) {
      logger.error("Failed to bulk mark attendance:", error);
      handleApiError(
        error,
        "AttendanceManagement.handleBulkMarkAttendance",
        "Failed to mark attendance"
      );
    } finally {
      setMarkingAttendance(null);
    }
  };

  const handleHistoryClick = async (student: Student) => {
    setSelectedStudent(student);
    setIsHistoryOpen(true);
    await fetchStudentHistory(student);
  };

  const handleApplyFilter = () => {
    fetchStudentsForAttendance();
  };

  const handleResetFilter = () => {
    setSelectedGrade("all");
    setSelectedSubject("all");
    setSelectedClass("all");
    setSelectedDate(new Date());
    setSearchQuery("");
    setStatusFilter("all");
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Present":
        return "default";
      case "Absent":
        return "destructive";
      case "Late":
        return "secondary";
      default:
        return "outline";
    }
  };

  // Filter students based on search and status filter
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      student.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getAttendanceSummary = (data: AttendanceData) => {
    const values = Object.values(data);
    return {
      present: values.filter((v) => v === "present").length,
      absent: values.filter((v) => v === "absent").length,
      late: values.filter((v) => v === "late").length,
      total: values.length,
    };
  };

  const summary = getAttendanceSummary(attendanceData);
  const attendanceRate =
    summary.total > 0
      ? (((summary.present + summary.late) / summary.total) * 100).toFixed(1)
      : "0.0";

  // Get unique grades and subjects from teacher's classes for dropdowns
  const uniqueGrades = Array.from(
    new Set(classes.map((cls) => getDisplayId(cls.grade)))
  ).filter(Boolean);
  const uniqueSubjects = Array.from(
    new Set(classes.map((cls) => getDisplayId(cls.subject)))
  ).filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Home className="h-4 w-4" />
            <span className="text-foreground">Students</span>
            <span>/</span>
            <span className="text-foreground">Students Attendance</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Students & Attendance
          </h1>
          <p className="text-muted-foreground">
            Manage online and onsite student registration
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b mb-8">
          {user?.role?.includes("TEACHER") && (
            <button
              onClick={() => setActiveTab("student")}
              className={`pb-4 px-1 text-sm font-medium transition-colors relative ${
                activeTab === "student"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Student Attendance
              {activeTab === "student" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          )}
          {user?.role?.includes("STUDENT") && (
            <button
              onClick={() => setActiveTab("my")}
              className={`pb-4 px-1 text-sm font-medium transition-colors relative ${
                activeTab === "my"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              My Attendance
              {activeTab === "my" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          )}
        </div>

        {/* My Attendance View - For Students */}
        {activeTab === "my" && user?.role?.includes("STUDENT") && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Total Working Days
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {myAttendanceStats.totalDays}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <CalendarDays className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Present Days
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {myAttendanceStats.presentDays}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Absent Days
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {myAttendanceStats.absentDays}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Attendance Ratio
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {myAttendanceStats.attendanceRatio}%
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Calendar View */}
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setMyAttendanceMonth(
                        new Date(
                          myAttendanceMonth.setMonth(
                            myAttendanceMonth.getMonth() - 1
                          )
                        )
                      )
                    }
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <h3 className="text-lg font-semibold">
                    {format(myAttendanceMonth, "MMMM, yyyy")}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setMyAttendanceMonth(
                        new Date(
                          myAttendanceMonth.setMonth(
                            myAttendanceMonth.getMonth() + 1
                          )
                        )
                      )
                    }
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  {/* Calendar Header */}
                  <div className="grid grid-cols-7 bg-muted/30">
                    {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                      (day) => (
                        <div
                          key={day}
                          className="text-center py-3 text-sm font-semibold text-muted-foreground border-r last:border-r-0"
                        >
                          {day}
                        </div>
                      )
                    )}
                  </div>

                  {/* Calendar Body */}
                  <div className="grid grid-cols-7">
                    {(() => {
                      const monthStart = startOfMonth(myAttendanceMonth);
                      const monthEnd = endOfMonth(myAttendanceMonth);
                      const startDay = getDay(monthStart);
                      const days = eachDayOfInterval({
                        start: monthStart,
                        end: monthEnd,
                      });

                      const cells = [];
                      for (let i = 0; i < startDay; i++) {
                        cells.push(
                          <div
                            key={`empty-${i}`}
                            className="aspect-square border-r border-b"
                          />
                        );
                      }

                      days.forEach((day, index) => {
                        const dateKey = format(day, "yyyy-MM-dd");
                        const status = myAttendanceData[dateKey];

                        let bgColor = "bg-background";
                        if (status === "present") {
                          bgColor = "bg-green-100 dark:bg-green-900/20";
                        } else if (status === "absent") {
                          bgColor = "bg-red-100 dark:bg-red-900/20";
                        } else if (status === "late") {
                          bgColor = "bg-orange-100 dark:bg-orange-900/20";
                        }

                        cells.push(
                          <div
                            key={dateKey}
                            className={`aspect-square border-r border-b p-2 ${bgColor} ${
                              (index + startDay) % 7 === 6 ? "border-r-0" : ""
                            }`}
                          >
                            <span className="text-sm text-foreground">
                              {format(day, "d")}
                            </span>
                          </div>
                        );
                      });

                      return cells;
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Student Attendance View - For Teachers */}
        {activeTab === "student" && user?.role?.includes("TEACHER") && (
          <>
            {/* Search Filter Card */}

            <Card className="mb-6 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">
                    Search Filter
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkMarkAttendance("Present")}
                      disabled={
                        markingAttendance === "bulk" || students.length === 0
                      }
                    >
                      {markingAttendance === "bulk" ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Mark All Present
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkMarkAttendance("Absent")}
                      disabled={
                        markingAttendance === "bulk" || students.length === 0
                      }
                    >
                      {markingAttendance === "bulk" ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Mark All Absent
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Class
                    </label>
                    <Select
                      value={selectedClass}
                      onValueChange={setSelectedClass}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="All Classes" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes
                          .filter((cls) => cls.id)
                          .map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name} - {getDisplayName(cls.subject)} (
                              {getDisplayName(cls.grade)})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Grade
                    </label>
                    <Select
                      value={selectedGrade}
                      onValueChange={setSelectedGrade}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="All Grades" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="all">All Grades</SelectItem>
                        {uniqueGrades
                          .filter((gradeId) => gradeId)
                          .map((gradeId) => {
                            const gradeObj = classes.find(
                              (c) => getDisplayId(c.grade) === gradeId
                            );
                            return (
                              <SelectItem key={gradeId} value={gradeId}>
                                {getDisplayName(gradeObj?.grade)}
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Subject
                    </label>
                    <Select
                      value={selectedSubject}
                      onValueChange={setSelectedSubject}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="All Subjects" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="all">All Subjects</SelectItem>
                        {uniqueSubjects
                          .filter((subjectId) => subjectId)
                          .map((subjectId) => {
                            const subjectObj = classes.find(
                              (c) => getDisplayId(c.subject) === subjectId
                            );
                            return (
                              <SelectItem key={subjectId} value={subjectId}>
                                {getDisplayName(subjectObj?.subject)}
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Date
                    </label>
                    <div className="relative">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-background"
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {format(selectedDate, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => date && setSelectedDate(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={handleResetFilter}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="default"
                    size="default"
                    onClick={handleApplyFilter}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Users className="h-4 w-4 mr-2" />
                    )}
                    Load Students
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search and Actions Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search Student by name or ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card"
                />
              </div>
              <div className="flex items-center gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] bg-card">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="not marked">Not Marked</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="default">
                  Export As
                </Button>
              </div>
            </div>

            {/* Table */}
            <Card className="shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-muted/30">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                          Student ID
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                          Student Name
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                          Grade
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                          Class
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                          Status
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                          History
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center">
                            <div className="flex items-center justify-center">
                              <Loader2 className="h-6 w-6 animate-spin mr-2" />
                              Loading students...
                            </div>
                          </td>
                        </tr>
                      ) : filteredStudents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-8 text-center text-muted-foreground"
                          >
                            No students found matching your criteria
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student, index) => (
                          <tr
                            key={`${student.userId}-${index}`}
                            className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                          >
                            <td className="py-4 px-6 text-sm text-foreground">
                              {student.studentId}
                            </td>
                            <td className="py-4 px-6 text-sm text-foreground">
                              {student.name}
                            </td>
                            <td className="py-4 px-6 text-sm text-foreground">
                              {getDisplayName(student.grade)}
                            </td>
                            <td className="py-4 px-6 text-sm text-foreground">
                              {student.className}
                            </td>
                            <td className="py-4 px-6">
                              <Badge variant={getStatusVariant(student.status)}>
                                {student.status}
                              </Badge>
                            </td>
                            <td className="py-4 px-6">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary"
                                onClick={() => handleHistoryClick(student)}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                            </td>
                            <td className="py-4 px-6">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={
                                      markingAttendance === student.userId
                                    }
                                  >
                                    {markingAttendance === student.userId ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <MoreVertical className="h-4 w-4" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="bg-popover"
                                >
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleMarkAttendance(
                                        student.userId,
                                        "Present"
                                      )
                                    }
                                    className="flex items-center gap-2 text-green-600"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Mark Present
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleMarkAttendance(
                                        student.userId,
                                        "Absent"
                                      )
                                    }
                                    className="flex items-center gap-2 text-red-600"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Mark Absent
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleMarkAttendance(
                                        student.userId,
                                        "Late"
                                      )
                                    }
                                    className="flex items-center gap-2 text-orange-600"
                                  >
                                    <Clock className="h-4 w-4" />
                                    Mark Late
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Attendance History Sheet */}
        <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <SheetContent
            side="right"
            className="w-full sm:w-[540px] overflow-y-auto"
          >
            <SheetHeader className="mb-6">
              <SheetTitle className="text-xl">
                {selectedStudent?.name} - Attendance History
              </SheetTitle>
            </SheetHeader>

            {/* Calendar Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.setMonth(currentMonth.getMonth() - 1)
                      )
                    )
                  }
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h3 className="text-lg font-semibold">
                  {format(currentMonth, "MMMM yyyy")}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.setMonth(currentMonth.getMonth() + 1)
                      )
                    )
                  }
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="bg-card rounded-lg border p-4">
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-muted-foreground"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }, (_, i) => {
                    const firstDay = new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth(),
                      1
                    );
                    const startDay =
                      firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
                    const dayNumber = i - startDay + 1;
                    const date = new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth(),
                      dayNumber
                    );
                    const isCurrentMonth =
                      dayNumber > 0 &&
                      dayNumber <=
                        new Date(
                          currentMonth.getFullYear(),
                          currentMonth.getMonth() + 1,
                          0
                        ).getDate();
                    const dateKey = format(date, "yyyy-MM-dd");
                    const status = attendanceData[dateKey];

                    if (!isCurrentMonth) {
                      return <div key={i} className="aspect-square" />;
                    }

                    let bgColor = "bg-background hover:bg-muted";
                    let textColor = "text-foreground";

                    if (status === "present") {
                      bgColor = "bg-green-500 hover:bg-green-600";
                      textColor = "text-white";
                    } else if (status === "absent") {
                      bgColor = "bg-red-500 hover:bg-red-600";
                      textColor = "text-white";
                    } else if (status === "late") {
                      bgColor = "bg-orange-500 hover:bg-orange-600";
                      textColor = "text-white";
                    }

                    return (
                      <div
                        key={i}
                        className={`aspect-square flex items-center justify-center rounded-md text-sm font-medium transition-colors ${bgColor} ${textColor}`}
                      >
                        {dayNumber}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Attendance Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Present days :</span>
                  <span className="font-semibold text-green-600">
                    {summary.present.toString().padStart(2, "0")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Absent Days :</span>
                  <span className="font-semibold text-red-600">
                    {summary.absent.toString().padStart(2, "0")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Late Present :</span>
                  <span className="font-semibold text-orange-600">
                    {summary.late.toString().padStart(2, "0")}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-muted-foreground">
                    Attendance Rate :
                  </span>
                  <span className="font-semibold text-foreground">
                    {attendanceRate}%
                  </span>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default AttendanceManagement;
