import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserAccessService } from './user-access.service';
import { PrismaService } from './prisma/prisma.service';

const ORG_ID = 'org-1';
const USER_ID = 'user-1';
const OTHER_ORG_ID = 'org-2';

function buildPrismaUser(overrides: Partial<{ organization_id: string }> = {}) {
  return {
    id: USER_ID,
    name: 'Alice',
    email: 'alice@example.com',
    phone_number: null,
    organization_id: ORG_ID,
    memberships: [{ status: 'active' }],
    userRoles: [],
    ...overrides,
  };
}

describe('UserAccessService', () => {
  let service: UserAccessService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      role: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      userRole: {
        count: jest.fn(),
        deleteMany: jest.fn(),
        upsert: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAccessService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UserAccessService>(UserAccessService);
    prisma = module.get(PrismaService);
  });

  // ─── listUsers ────────────────────────────────────────────────────────────

  describe('listUsers', () => {
    it('returns users with roles and derived capabilities', async () => {
      const raw = [
        {
          id: USER_ID,
          name: 'Alice',
          email: 'alice@example.com',
          phone_number: null,
          organization_id: ORG_ID,
          memberships: [{ status: 'active' }],
          userRoles: [{ role: { name: 'admin' } }],
        },
      ];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(raw);

      const result = await service.listUsers(ORG_ID);

      expect(result).toHaveLength(1);
      expect(result[0].roles).toEqual(['admin']);
      expect(result[0].capabilities.canManageUsers).toBe(true);
      expect(result[0].capabilities.canManageRequests).toBe(true);
      expect(result[0].capabilities.canDeliverItems).toBe(true);
    });

    it('returns empty array when org has no users', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
      const result = await service.listUsers(ORG_ID);
      expect(result).toEqual([]);
    });

    it('derives volunteer capabilities correctly', async () => {
      const raw = [
        {
          id: USER_ID,
          name: 'Bob',
          email: 'bob@example.com',
          phone_number: null,
          organization_id: ORG_ID,
          memberships: [],
          userRoles: [{ role: { name: 'volunteer' } }],
        },
      ];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(raw);

      const result = await service.listUsers(ORG_ID);
      expect(result[0].capabilities).toEqual({
        canManageUsers: false,
        canManageRequests: false,
        canDeliverItems: true,
      });
    });
  });

  // ─── grantRole ────────────────────────────────────────────────────────────

  describe('grantRole', () => {
    const roleRow = { id: 'role-uuid-1', name: 'manager' };
    const userWithRole = {
      ...buildPrismaUser(),
      userRoles: [{ role: { name: 'manager' } }],
    };

    beforeEach(() => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ organization_id: ORG_ID }) // ensureUserBelongsToOrg
        .mockResolvedValueOnce(userWithRole);                // getUserWithRoles
      (prisma.role.upsert as jest.Mock).mockResolvedValue(roleRow);
      (prisma.userRole.upsert as jest.Mock).mockResolvedValue({});
    });

    it('grants valid role and returns updated user', async () => {
      const result = await service.grantRole(ORG_ID, USER_ID, 'manager');
      expect(result.roles).toContain('manager');
    });

    it('rejects invalid role name', async () => {
      await expect(service.grantRole(ORG_ID, USER_ID, 'superuser')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects cross-org user', async () => {
      (prisma.user.findUnique as jest.Mock).mockReset();
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        organization_id: OTHER_ORG_ID,
      });

      await expect(service.grantRole(ORG_ID, USER_ID, 'volunteer')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockReset();
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.grantRole(ORG_ID, 'nonexistent', 'volunteer')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── revokeRole ───────────────────────────────────────────────────────────

  describe('revokeRole', () => {
    const roleRow = { id: 'role-uuid-1' };
    const userAfterRevoke = {
      ...buildPrismaUser(),
      userRoles: [],
    };

    it('revokes role successfully when not last admin', async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ organization_id: ORG_ID }) // ensureUserBelongsToOrg
        .mockResolvedValueOnce(userAfterRevoke);             // getUserWithRoles
      (prisma.userRole.count as jest.Mock).mockResolvedValue(2); // 2 admins in org
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(roleRow);
      (prisma.userRole.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.revokeRole(ORG_ID, USER_ID, 'admin');
      expect(result.roles).toEqual([]);
    });

    it('blocks removing admin role when user is last admin', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ organization_id: ORG_ID });
      (prisma.userRole.count as jest.Mock).mockResolvedValue(1); // only 1 admin

      await expect(service.revokeRole(ORG_ID, USER_ID, 'admin')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects invalid role name', async () => {
      await expect(service.revokeRole(ORG_ID, USER_ID, 'god')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('succeeds gracefully when role row does not exist in DB', async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ organization_id: ORG_ID })
        .mockResolvedValueOnce(userAfterRevoke);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(null); // role not in DB

      const result = await service.revokeRole(ORG_ID, USER_ID, 'manager');
      expect(result.roles).toEqual([]);
      expect(prisma.userRole.deleteMany).not.toHaveBeenCalled();
    });
  });

  // ─── replaceRoles ─────────────────────────────────────────────────────────

  describe('replaceRoles', () => {
    it('replaces roles in a transaction', async () => {
      const userAfterReplace = {
        ...buildPrismaUser(),
        userRoles: [{ role: { name: 'volunteer' } }],
      };
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ organization_id: ORG_ID })
        .mockResolvedValueOnce(userAfterReplace);
      (prisma.userRole.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.role.upsert as jest.Mock).mockResolvedValue({ id: 'role-uuid-v', name: 'volunteer' });
      (prisma.$transaction as jest.Mock).mockResolvedValue(undefined);

      const result = await service.replaceRoles(ORG_ID, USER_ID, ['volunteer']);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result.roles).toContain('volunteer');
    });

    it('rejects any invalid role in the new set', async () => {
      await expect(
        service.replaceRoles(ORG_ID, USER_ID, ['volunteer', 'overlord']),
      ).rejects.toThrow(BadRequestException);
    });

    it('blocks removing admin when last admin remains', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ organization_id: ORG_ID });
      (prisma.userRole.findMany as jest.Mock).mockResolvedValue([{ role: { name: 'admin' } }]);
      (prisma.userRole.count as jest.Mock).mockResolvedValue(1);

      await expect(service.replaceRoles(ORG_ID, USER_ID, ['volunteer'])).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
