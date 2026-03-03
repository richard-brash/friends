import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Base service class enforcing multi-tenant data isolation
 * Per MVP-Architecture.md Section 4: "Multi-Tenant Ready — Every record scoped by organization"
 *
 * All domain services should extend this class to ensure:
 * 1. All queries are automatically scoped by orgId
 * 2. Cross-organization access is prevented
 * 3. Data integrity is maintained
 */
@Injectable()
export abstract class BaseService {
  constructor(protected readonly prisma: PrismaService) {}

  /**
   * Validates that a resource belongs to the requesting organization
   *
   * @param resourceOrgId - The org_id of the resource being accessed
   * @param requestOrgId - The org_id from the authenticated user's context
   * @throws ForbiddenException if org_ids don't match
   */
  protected validateOrgAccess(
    resourceOrgId: string,
    requestOrgId: string,
  ): void {
    if (resourceOrgId !== requestOrgId) {
      throw new ForbiddenException(
        'Access denied: resource belongs to a different organization',
      );
    }
  }

  /**
   * Creates a base where clause with org_id scoping
   *
   * @param orgId - Organization ID from request context
   * @param additionalWhere - Additional where conditions to merge
   * @returns Combined where clause with org_id enforced
   */
  protected withOrgScope<T extends Record<string, any>>(
    orgId: string,
    additionalWhere?: T,
  ): T & { org_id: string } {
    return {
      ...additionalWhere,
      org_id: orgId,
    } as T & { org_id: string };
  }
}
