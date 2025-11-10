import { UserRole } from "@prisma/client";

/** Role helpers: hierarchy checks and utilities. */

export class RoleHelper {
  /**
   * Check if a role is a teacher (internal or external)
   */
  static isTeacher(role: UserRole): boolean {
    return (
      role === UserRole.INTERNAL_TEACHER || role === UserRole.EXTERNAL_TEACHER
    );
  }

  /**
   * Check if a role is a student (internal or external)
   */
  static isStudent(role: UserRole): boolean {
    return (
      role === UserRole.INTERNAL_STUDENT || role === UserRole.EXTERNAL_STUDENT
    );
  }

  /**
   * Check if a role is an admin (super admin or admin)
   */
  static isAdmin(role: UserRole): boolean {
    return role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN;
  }

  /**
   * Check if a role is super admin
   */
  static isSuperAdmin(role: UserRole): boolean {
    return role === UserRole.SUPER_ADMIN;
  }

  /**
   * Check if a role is internal (internal teacher or internal student)
   */
  static isInternal(role: UserRole): boolean {
    return (
      role === UserRole.INTERNAL_TEACHER || role === UserRole.INTERNAL_STUDENT
    );
  }

  /**
   * Check if a role is external (external teacher or external student)
   */
  static isExternal(role: UserRole): boolean {
    return (
      role === UserRole.EXTERNAL_TEACHER || role === UserRole.EXTERNAL_STUDENT
    );
  }

  /**
   * Get all teacher roles
   */
  static getAllTeacherRoles(): UserRole[] {
    return [UserRole.INTERNAL_TEACHER, UserRole.EXTERNAL_TEACHER];
  }

  /**
   * Get all student roles
   */
  static getAllStudentRoles(): UserRole[] {
    return [UserRole.INTERNAL_STUDENT, UserRole.EXTERNAL_STUDENT];
  }

  /**
   * Get all admin roles
   */
  static getAllAdminRoles(): UserRole[] {
    return [UserRole.SUPER_ADMIN, UserRole.ADMIN];
  }

  /**
   * Check if user can access resource based on role hierarchy
   * SUPER_ADMIN can access everything
   * ADMIN can access most things
   * Teachers can access teaching resources
   * Students can access learning resources
   */
  static canAccessResource(
    userRole: UserRole,
    requiredRoles: UserRole[]
  ): boolean {
    // Super admin has access to everything
    if (userRole === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Check if user's role is in the required roles
    if (requiredRoles.includes(userRole)) {
      return true;
    }

    // Admin can access resources that require admin or lower
    if (
      userRole === UserRole.ADMIN &&
      requiredRoles.some(
        (role) =>
          role === UserRole.ADMIN ||
          this.isTeacher(role) ||
          this.isStudent(role)
      )
    ) {
      return true;
    }

    return false;
  }

  /**
   * Sanitize user data based on role and viewer
   * Removes sensitive information based on permissions
   */
  static sanitizeUserData(
    userData: any,
    viewerRole: UserRole,
    isOwnProfile: boolean
  ): any {
    const sanitized = { ...userData };

    // ALWAYS remove password hash - no one should see this, not even super admin
    // Password hashes should never be transmitted over the network
    delete sanitized.password;
    delete sanitized.passwordHash;

    // Super admin can see all other fields
    if (viewerRole === UserRole.SUPER_ADMIN) {
      return sanitized;
    }

    // If not own profile and not admin, remove sensitive data
    if (!isOwnProfile && !this.isAdmin(viewerRole)) {
      delete sanitized.email;
      delete sanitized.phone;
      delete sanitized.address;
      delete sanitized.dateOfBirth;
      delete sanitized.idNumber;
      delete sanitized.bankAccount;
    }

    return sanitized;
  }
}

/**
 * Decorator to check if user has teacher role
 */
export const IsTeacher = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (this: any, ...args: any[]) {
      const role = this.user?.role;
      if (!RoleHelper.isTeacher(role)) {
        throw new Error("User must be a teacher to perform this action");
      }
      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
};

/**
 * Decorator to check if user has student role
 */
export const IsStudent = () => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function (this: any, ...args: any[]) {
      const role = this.user?.role;
      if (!RoleHelper.isStudent(role)) {
        throw new Error("User must be a student to perform this action");
      }
      return originalMethod.apply(this, args);
    };
    return descriptor;
  };
};
