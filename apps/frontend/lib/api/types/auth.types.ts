export interface User {
  id: string;
  email?: string;
  phone: string;
  /** Some legacy responses use phoneNumber instead of phone */
  phoneNumber?: string;
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
  address?: string;
  city?: string;
  /** District can be a string ID or an object with id/name depending on API response */
  district?: string | { id: string; name: string };
  postalCode?: string;
  dateOfBirth?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Extended user type for teachers with additional profile fields.
 * Used in teacher-specific components like transfer requests.
 */
export interface TeacherUser extends User {
  role: "INTERNAL_TEACHER" | "EXTERNAL_TEACHER";
  registrationId?: string;
  school?: string;
  zone?: string;
  subject?: string;
  medium?: "Sinhala" | "Tamil" | "English";
  level?: "A/L" | "O/L";
}

export interface LoginData {
  identifier: string; // Can be phone or email
  password: string;
  allowedRoles?: User["role"][];
}

export interface RegisterData {
  phone: string;
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  role: User["role"];
}

export interface TeacherRegisterData extends RegisterData {
  role: "EXTERNAL_TEACHER";
  phone: string;

  // External teacher (mutual transfer) fields - all required for registration
  registrationId: string;
  currentSchool: string;
  currentZone: string;
  currentDistrict: string;
  desiredZones: string[];
  subject: string;
  medium: string;
  level: string;

  // Terms acceptance
  acceptTerms: boolean;
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
  accessToken: string;
  refreshToken: string;
}
