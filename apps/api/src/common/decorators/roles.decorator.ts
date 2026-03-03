import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to define required roles for a route
 * Usage: @Roles(UserRole.admin, UserRole.manager)
 *
 * Per MVP-Architecture.md Section 8: Role Permissions
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
