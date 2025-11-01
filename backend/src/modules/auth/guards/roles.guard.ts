import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../common';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // SUPER_ADMIN has access to everything
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // ADMIN inherits all SUPER_ADMIN permissions
    // Check if SUPER_ADMIN is in required roles and user is ADMIN
    if (user.role === UserRole.ADMIN && requiredRoles.includes(UserRole.SUPER_ADMIN)) {
      return true;
    }

    // Check if user's role is in the required roles
    return requiredRoles.some((role) => user.role?.includes(role));
  }
}