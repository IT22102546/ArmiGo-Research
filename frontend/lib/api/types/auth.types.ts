export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role:
    | "SUPER_ADMIN"
    | "ADMIN"
    | "INTERNAL_TEACHER"
    | "EXTERNAL_TEACHER"
    | "INTERNAL_STUDENT"
    | "EXTERNAL_STUDENT";
  avatar?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginData {
  email: string;
  password: string;
  allowedRoles?: User["role"][];
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: User["role"];
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User;
  accessToken?: string;
  refreshToken?: string;
}
