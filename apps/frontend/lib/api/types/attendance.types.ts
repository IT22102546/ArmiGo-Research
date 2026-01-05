export interface AttendanceRecord {
  id: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    studentProfile?: {
      studentId: string;
      grade: string;
    };
  };
  date: string;
  classId?: string;
  class?: {
    id: string;
    name: string;
    subject: string;
    grade: string;
  };
  present: boolean;
  joinTime?: string;
  leaveTime?: string;
  duration?: number;
  notes?: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  id: string;
  userId: string;
  month: number;
  year: number;
  totalClasses: number;
  attended: number;
  percentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentForAttendance {
  id: string;
  studentId: string;
  name: string;
  grade: string;
  classId?: string;
  className?: string;
  status?: "Present" | "Absent" | "Late" | "Not Marked";
}

export interface MarkAttendanceData {
  userId: string;
  date: string;
  classId?: string;
  present: boolean;
  notes?: string;
  type?: string;
}

export interface BulkMarkAttendanceData {
  attendances: MarkAttendanceData[];
}

export interface QueryAttendanceParams {
  userId?: string;
  classId?: string;
  startDate?: string;
  endDate?: string;
  present?: boolean;
  type?: string;
  month?: number;
  year?: number;
}
