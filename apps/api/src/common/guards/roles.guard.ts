import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestContext } from '../types/request-context';
import type { UserRole } from '../types/domain-types';

/**
 * Guard to enforce role-based access control
 * Per MVP-Architecture.md Section 8: Role Permissions
 *
 * Usage:
 *   @Roles(UserRole.admin, UserRole.manager)
 *   @UseGuards(RolesGuard)
 *
 * Requires JWT authentication to populate request.user
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: RequestContext = request.user;

    // User must be authenticated
    if (!user) {
      return false;
    }

    // Check if user's role is in the allowed roles
    return requiredRoles.includes(user.role);
  }
}
