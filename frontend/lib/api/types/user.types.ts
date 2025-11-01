export interface User {
  id: string;
  email: string;
  name: string;
  role:
    | "SUPER_ADMIN"
    | "ADMIN"
    | "INTERNAL_TEACHER"
    | "EXTERNAL_TEACHER"
    | "INTERNAL_STUDENT"
    | "EXTERNAL_STUDENT";
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: User["role"];
  phone?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
}
