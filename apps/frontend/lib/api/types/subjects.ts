// apps/frontend/lib/api/types/subjects.ts - UPDATED
export interface SubjectGradeAssignment {
  id?: string;
  gradeId: string;
  medium: string;
  isActive?: boolean;
  grade?: {
    id: string;
    name: string;
    code?: string;
    level?: number;
  };
  teacherSubjects?: TeacherSubject[];
}

export interface TeacherSubject {
  id: string;
  teacherProfileId: string;
  subjectId: string;
  gradeId: string;
  medium: string;
  isPrimary: boolean;
  teacherProfile: {
    id: string;
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

// export interface Subject {
//   id: string;
//   name: string;
//   code?: string;
//   description?: string;
//   medium?: string;
//   teacher?: {
//     id: string;
//     firstName: string;
//     lastName: string;
//     email: string;
//     teacherProfile?: any;
//   };
//   teacherId?: string;
//   isActive: boolean;
//   imageUrl?: string;
//   createdAt?: string;
//   updatedAt?: string;
//   gradeAssignments?: SubjectGradeAssignment[];
// }

export interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  category?: string;
  teacherId?: string;
  teacher?: Teacher;
  imageUrl?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  gradeAssignments?: SubjectGradeAssignment[];
}

export interface CreateSubjectDto {
  name: string;
  code?: string;
  description?: string;
  category?: string;
  teacherId?: string;
  imageUrl?: string;
  isActive?: boolean;
  gradeAssignments: {
    gradeId: string;
    medium: string;
    isActive?: boolean;
  }[];
}

export interface UpdateSubjectDto {
  name?: string;
  code?: string;
  description?: string;
  category?: string;
  teacherId?: string;
  imageUrl?: string;
  isActive?: boolean;
  gradeAssignments?: SubjectGradeAssignment[];
}

export interface AssignTeacherDto {
  teacherProfileId: string;
  subjectId: string;
  gradeId: string;
  medium: string;
  isPrimary?: boolean;
}

export interface Grade {
  id: string;
  name: string;
  code?: string;
  level?: number;
  isActive: boolean;
}

export interface StatusBadgeProps {
  status: boolean;
}

export interface SubjectTableRowProps {
  subject: Subject;
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
  onView: (subject: Subject) => void;
  onManageGrades: (subject: Subject) => void;
}

export interface SubjectTableProps {
  subjects: Subject[];
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
  onView: (subject: Subject) => void;
  onManageGrades: (subject: Subject) => void;
}

export interface AddEditSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (subjectData: CreateSubjectDto | UpdateSubjectDto) => void;
  editSubject: Subject | null;
  isSubmitting: boolean;
  grades: Grade[];
  gradesLoading?: boolean;
  teachers: Teacher[];
  teachersLoading?: boolean;
}

export interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "INTERNAL_TEACHER" | "EXTERNAL_TEACHER";
  teacherProfile?: {
    id: string;
    employeeId?: string;
    department?: string;
    specialization?: string;
    isExternal?: boolean;
    sourceInstitution?: string;
  };
}

// UserRole is imported from user.types.ts - this interface was incorrectly defined
// Use: import { UserRole } from './user.types';
export type UserRoleType =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "INTERNAL_TEACHER"
  | "EXTERNAL_TEACHER"
  | "INTERNAL_STUDENT"
  | "EXTERNAL_STUDENT";
