import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

export const VALID_ROLES = ['admin', 'manager', 'volunteer'] as const;
export type ValidRole = (typeof VALID_ROLES)[number];

export interface OrgUserCapabilities {
  canManageUsers: boolean;
  canManageRequests: boolean;
  canDeliverItems: boolean;
}

export interface OrgUserResponse {
  id: string;
  name: string;
  email: string | null;
  phone_number: string | null;
  organization_id: string;
  membership: { status: string } | null;
  roles: string[];
  capabilities: OrgUserCapabilities;
}

function deriveCapabilities(roles: string[]): OrgUserCapabilities {
  const isAdmin = roles.includes('admin');
  const isManager = roles.includes('manager');
  return {
    canManageUsers: isAdmin,
    canManageRequests: isAdmin || isManager,
    canDeliverItems: true,
  };
}

@Injectable()
export class UserAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(orgId: string): Promise<OrgUserResponse[]> {
    const users = await this.prisma.user.findMany({
      where: { organization_id: orgId },
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        organization_id: true,
        memberships: {
          where: { organization_id: orgId },
          select: { status: true },
          take: 1,
        },
        userRoles: {
          select: { role: { select: { name: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return users.map((user) => {
      const roles = user.userRoles.map((ur) => ur.role.name);
      const membership = user.memberships[0] ?? null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        organization_id: user.organization_id,
        membership: membership ? { status: membership.status } : null,
        roles,
        capabilities: deriveCapabilities(roles),
      };
    });
  }

  async grantRole(orgId: string, targetUserId: string, roleName: string): Promise<OrgUserResponse> {
    this.validateRole(roleName);
    await this.ensureUserBelongsToOrg(targetUserId, orgId);

    const role = await this.prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
      select: { id: true },
    });

    await this.prisma.userRole.upsert({
      where: { user_id_role_id: { user_id: targetUserId, role_id: role.id } },
      update: {},
      create: { user_id: targetUserId, role_id: role.id },
    });

    return this.getUserWithRoles(targetUserId, orgId);
  }

  async revokeRole(
    orgId: string,
    targetUserId: string,
    roleName: string,
  ): Promise<OrgUserResponse> {
    this.validateRole(roleName);
    await this.ensureUserBelongsToOrg(targetUserId, orgId);

    if (roleName === 'admin') {
      await this.ensureNotLastAdmin(orgId, targetUserId);
    }

    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
      select: { id: true },
    });

    if (role) {
      await this.prisma.userRole.deleteMany({
        where: { user_id: targetUserId, role_id: role.id },
      });
    }

    return this.getUserWithRoles(targetUserId, orgId);
  }

  async replaceRoles(
    orgId: string,
    targetUserId: string,
    roleNames: string[],
  ): Promise<OrgUserResponse> {
    for (const r of roleNames) {
      this.validateRole(r);
    }

    await this.ensureUserBelongsToOrg(targetUserId, orgId);

    // Last-admin protection: if removing admin, ensure another admin remains
    const currentRoles = await this.getUserRoleNames(targetUserId);
    if (currentRoles.includes('admin') && !roleNames.includes('admin')) {
      await this.ensureNotLastAdmin(orgId, targetUserId);
    }

    const roleRows = await Promise.all(
      roleNames.map((name) =>
        this.prisma.role.upsert({
          where: { name },
          update: {},
          create: { name },
          select: { id: true, name: true },
        }),
      ),
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { user_id: targetUserId } });
      for (const row of roleRows) {
        await tx.userRole.create({
          data: { user_id: targetUserId, role_id: row.id },
        });
      }
    });

    return this.getUserWithRoles(targetUserId, orgId);
  }

  private validateRole(roleName: string): void {
    if (!VALID_ROLES.includes(roleName as ValidRole)) {
      throw new BadRequestException(
        `Invalid role "${roleName}". Must be one of: ${VALID_ROLES.join(', ')}`,
      );
    }
  }

  private async ensureUserBelongsToOrg(userId: string, orgId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organization_id: true },
    });

    if (!user || user.organization_id !== orgId) {
      throw new ForbiddenException('User does not belong to your organization');
    }
  }

  private async ensureNotLastAdmin(orgId: string, targetUserId: string): Promise<void> {
    const adminCount = await this.prisma.userRole.count({
      where: {
        user: { organization_id: orgId },
        role: { name: 'admin' },
      },
    });

    if (adminCount <= 1) {
      throw new BadRequestException(
        'Cannot remove admin role: this is the last admin in the organization',
      );
    }
  }

  private async getUserRoleNames(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { user_id: userId },
      select: { role: { select: { name: true } } },
    });
    return userRoles.map((ur) => ur.role.name);
  }

  private async getUserWithRoles(userId: string, orgId: string): Promise<OrgUserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        organization_id: true,
        memberships: {
          where: { organization_id: orgId },
          select: { status: true },
          take: 1,
        },
        userRoles: {
          select: { role: { select: { name: true } } },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone_number: user.phone_number,
      organization_id: user.organization_id,
      membership: user.memberships[0] ? { status: user.memberships[0].status } : null,
      roles,
      capabilities: deriveCapabilities(roles),
    };
  }
}
