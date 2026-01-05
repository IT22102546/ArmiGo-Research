export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "INTERNAL_TEACHER"
  | "EXTERNAL_TEACHER"
  | "INTERNAL_STUDENT"
  | "EXTERNAL_STUDENT";

export type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED";

export interface User {
  id: string;
  phone: string;
  email?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status?: UserStatus;
  avatar?: string;
  isActive: boolean;
  dateOfBirth?: string;
  bio?: string;
  address?: string;
  city?: string;
  district?: string;
  districtId?: string;
  postalCode?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;

  // Teacher-specific fields (populated for teacher roles)
  registrationId?: string;
  school?: string;
  zone?: string;
  subject?: string;
  medium?: string;
  level?: string;

  studentProfile?: {
    gradeId?: string;
    grade?: { id: string; name: string };
    mediumId?: string;
    medium?: { id: string; name: string };
    batchId?: string;
    batch?: { id: string; name: string };
    guardianName?: string;
    guardianPhone?: string;
    schoolName?: string;
  };
  teacherProfile?: {
    specialization?: string;
    experience?: number;
    employeeId?: string;
    department?: string;
    qualifications?: string[];
    canCreateExams?: boolean;
    canMonitorExams?: boolean;
  };
}

export interface CreateUserData {
  phone: string;
  email?: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  isActive?: boolean;
  role?: UserRole;
  status?: UserStatus;
  dateOfBirth?: string;
  bio?: string;
  address?: string;
  city?: string;
  districtId?: string;
  postalCode?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  studentProfile?: {
    grade?: string;
    batch?: string;
    gradeId?: string;
    mediumId?: string;
    batchId?: string;
    guardianName?: string;
    guardianPhone?: string;
    schoolName?: string;
  };
  teacherProfile?: {
    specialization?: string;
    experience?: number;
    employeeId?: string;
    department?: string;
    qualifications?: string[];
    canCreateExams?: boolean;
    canMonitorExams?: boolean;
  };
}

// Add Teacher type for subject management
export interface TeacherProfile {
  id?: string;
  specialization?: string;
  experience?: number;
  employeeId?: string;
  department?: string;
  qualifications?: string[];
  canCreateExams?: boolean;
  canMonitorExams?: boolean;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "INTERNAL_TEACHER" | "EXTERNAL_TEACHER";
  teacherProfile?: TeacherProfile;
}
