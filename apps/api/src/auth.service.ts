import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { RequestContext } from './common/types/request-context';
import type { UserRole } from './common/types/domain-types';

type SupabaseClaims = JWTPayload & {
  sub?: string;
  phone?: string;
  email?: string;
  user_metadata?: {
    name?: string;
    full_name?: string;
  };
};

type SupabaseSessionResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

@Injectable()
export class AuthService {
  private readonly supabaseUrl: string;
  private readonly issuer: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly supabaseServiceRoleKey: string | null;
  private readonly bootstrapAdminEmails: Set<string>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    this.issuer = `${this.supabaseUrl}/auth/v1`;
    this.jwks = createRemoteJWKSet(new URL(`${this.supabaseUrl}/auth/v1/.well-known/jwks.json`));
    this.supabaseServiceRoleKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')?.trim() || null;
    this.bootstrapAdminEmails = new Set(
      (this.configService.get<string>('AUTH_ADMIN_EMAILS') || '')
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry) => entry.length > 0),
    );
  }

  async requestEmailCode(rawEmail: string): Promise<void> {
    const email = this.normalizeEmail(rawEmail);
    await this.ensureEmailCanAuthenticate(email);
    await this.ensureSupabaseAuthUserExists(email);

    const response = await fetch(`${this.supabaseUrl}/auth/v1/otp`, {
      method: 'POST',
      headers: this.getSupabaseHeaders(),
      body: JSON.stringify({
        email,
        create_user: false,
      }),
    });

    await this.assertSupabaseResponse(response, 'request email code');
  }

  async verifyEmailCode(rawEmail: string, token: string) {
    const email = this.normalizeEmail(rawEmail);

    const response = await fetch(`${this.supabaseUrl}/auth/v1/verify`, {
      method: 'POST',
      headers: this.getSupabaseHeaders(),
      body: JSON.stringify({
        email,
        token,
        type: 'email',
      }),
    });

    const session = await this.parseSupabaseSessionResponse(response, 'verify email code');
    const requestContext = await this.authenticateAccessToken(session.access_token);
    const user = await this.getCurrentUser(requestContext.userId);

    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
      user,
    };
  }

  async refreshSession(refreshToken: string) {
    const response = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: this.getSupabaseHeaders(),
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    const session = await this.parseSupabaseSessionResponse(response, 'refresh session');
    await this.authenticateAccessToken(session.access_token);

    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
    };
  }

  async logout(accessToken: string | null): Promise<void> {
    if (!accessToken) {
      return;
    }

    try {
      await fetch(`${this.supabaseUrl}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          ...this.getSupabaseHeaders(),
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      // Ignore logout failures and clear local session cookies anyway.
    }
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        organization_id: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const role = await this.resolveUserRole(user.id);

    return {
      ...user,
      role,
    };
  }

  async authenticateAccessToken(token: string): Promise<RequestContext> {
    const { payload } = await jwtVerify(token, this.jwks, {
      issuer: this.issuer,
    });

    const claims = payload as SupabaseClaims;
    const authUserId = claims.sub?.trim();
    if (!authUserId) {
      throw new UnauthorizedException('Invalid access token');
    }

    const phoneNumber = this.normalizePhone(claims.phone);
    const email = typeof claims.email === 'string' ? claims.email.trim() || null : null;
    const name =
      claims.user_metadata?.full_name?.trim()
      || claims.user_metadata?.name?.trim()
      || phoneNumber
      || email
      || 'User';

    let user = await this.prisma.user.findUnique({
      where: { auth_user_id: authUserId },
      select: { id: true, organization_id: true },
    });

    if (!user && phoneNumber) {
      const matchedByPhone = await this.prisma.user.findUnique({
        where: { phone_number: phoneNumber },
        select: { id: true, organization_id: true },
      });

      if (matchedByPhone) {
        user = await this.prisma.user.update({
          where: { id: matchedByPhone.id },
          data: {
            auth_user_id: authUserId,
            ...(email ? { email } : {}),
          },
          select: { id: true, organization_id: true },
        });
      }
    }

    if (!user && email) {
      const matchedByEmail = await this.prisma.user.findFirst({
        where: { email },
        select: { id: true, organization_id: true },
      });

      if (matchedByEmail) {
        user = await this.prisma.user.update({
          where: { id: matchedByEmail.id },
          data: { auth_user_id: authUserId },
          select: { id: true, organization_id: true },
        });
      }
    }

    if (!user) {
      // New user: check if they have a pending invite
      const invite = email
        ? await this.prisma.invite.findFirst({
            where: {
              destination: email,
              status: { in: ['PENDING', 'SENT'] },
              OR: [
                { expires_at: null },
                { expires_at: { gt: new Date() } },
              ],
            },
            select: { organization_id: true, id: true },
          })
        : null;

      if (!invite) {
        // Bootstrap admin emails can self-provision without an invite
        if (email && this.bootstrapAdminEmails.has(email.toLowerCase())) {
          const defaultOrg = await this.prisma.organization.findFirst();
          if (!defaultOrg) {
            throw new UnauthorizedException('No organization found. Run the database seed first.');
          }

          user = await this.prisma.user.create({
            data: {
              organization_id: defaultOrg.id,
              auth_user_id: authUserId,
              phone_number: phoneNumber,
              email,
              name,
            },
            select: { id: true, organization_id: true },
          });

          await this.prisma.userMembership.create({
            data: {
              user_id: user.id,
              organization_id: user.organization_id,
              status: 'active',
            },
          });
          // Admin role will be assigned by the bootstrap check below
        } else {
          throw new UnauthorizedException(
            'You do not have permission to access this application. Please request an invite.',
          );
        }
      } else {
        // Create user in the organization of the invite
        user = await this.prisma.user.create({
          data: {
            organization_id: invite.organization_id,
            auth_user_id: authUserId,
            phone_number: phoneNumber,
            email,
            name,
          },
          select: { id: true, organization_id: true },
        });

        // Create membership record
        await this.prisma.userMembership.create({
          data: {
            user_id: user.id,
            organization_id: user.organization_id,
            status: 'active',
          },
        });

        await this.assignRoleToUser(user.id, 'volunteer');

        // Mark invite as accepted
        await this.prisma.invite.update({
          where: { id: invite.id },
          data: { accepted_by_user_id: user.id, status: 'ACCEPTED' },
        });
      }
    } else {
      // Existing user: ensure they have active membership
      const membership = await this.prisma.userMembership.findFirst({
        where: {
          user_id: user.id,
          organization_id: user.organization_id,
          status: 'active',
        },
      });

      if (!membership) {
        throw new UnauthorizedException('Your membership has been deactivated.');
      }
    }

    if (email && this.bootstrapAdminEmails.has(email.toLowerCase())) {
      await this.assignRoleToUser(user.id, 'admin');
    }

    const role = await this.resolveUserRole(user.id);

    return {
      userId: user.id,
      orgId: user.organization_id,
      role,
    };
  }

  private normalizeEmail(value: string): string {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed.includes('@')) {
      throw new UnauthorizedException('Enter a valid email address.');
    }

    return trimmed;
  }

  private normalizePhone(value: string | undefined): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private async ensureEmailCanAuthenticate(email: string): Promise<void> {
    // Bootstrap admin emails are always allowed to authenticate
    if (this.bootstrapAdminEmails.has(email.toLowerCase())) {
      return;
    }

    const activeUser = await this.prisma.user.findFirst({
      where: { email },
      select: { id: true, organization_id: true },
    });

    if (activeUser) {
      const membership = await this.prisma.userMembership.findFirst({
        where: {
          user_id: activeUser.id,
          organization_id: activeUser.organization_id,
          status: 'active',
        },
        select: { id: true },
      });

      if (membership) {
        return;
      }

      throw new UnauthorizedException('Your membership has been deactivated.');
    }

    const invite = await this.prisma.invite.findFirst({
      where: {
        destination: email,
        status: { in: ['PENDING', 'SENT'] },
      },
      select: {
        id: true,
        expires_at: true,
      },
    });

    if (!invite) {
      throw new UnauthorizedException(
        'You do not have permission to access this application. Please request an invite.',
      );
    }

    if (invite.expires_at && invite.expires_at.getTime() <= Date.now()) {
      await this.prisma.invite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      });

      throw new UnauthorizedException('This invite has expired. Ask an admin to resend it.');
    }
  }

  private getSupabaseHeaders(): Record<string, string> {
    if (!this.supabaseServiceRoleKey) {
      throw new UnauthorizedException('SUPABASE_SERVICE_ROLE_KEY is not configured.');
    }

    return {
      'Content-Type': 'application/json',
      apikey: this.supabaseServiceRoleKey,
      Authorization: `Bearer ${this.supabaseServiceRoleKey}`,
    };
  }

  private async ensureSupabaseAuthUserExists(email: string): Promise<void> {
    const response = await fetch(`${this.supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: this.getSupabaseHeaders(),
      body: JSON.stringify({
        email,
        email_confirm: true,
      }),
    });

    const bodyText = await response.text();
    if (response.ok) {
      return;
    }

    let parsedBody: { error_code?: string } | null = null;
    try {
      parsedBody = JSON.parse(bodyText) as { error_code?: string };
    } catch {
      parsedBody = null;
    }

    // User already exists in Supabase Auth, which is fine.
    if (response.status === 422 && parsedBody?.error_code === 'email_exists') {
      return;
    }

    throw new UnauthorizedException(
      `Supabase ensure auth user failed (${response.status}): ${bodyText || 'Unknown error'}`,
    );
  }

  private async assertSupabaseResponse(response: Response, operation: string): Promise<void> {
    if (response.ok) {
      return;
    }

    const bodyText = await response.text();
    throw new UnauthorizedException(
      `Supabase ${operation} failed (${response.status}): ${bodyText || 'Unknown error'}`,
    );
  }

  private async parseSupabaseSessionResponse(
    response: Response,
    operation: string,
  ): Promise<SupabaseSessionResponse> {
    const bodyText = await response.text();

    if (!response.ok) {
      throw new UnauthorizedException(
        `Supabase ${operation} failed (${response.status}): ${bodyText || 'Unknown error'}`,
      );
    }

    const parsedBody = JSON.parse(bodyText) as Partial<SupabaseSessionResponse>;

    if (
      typeof parsedBody.access_token !== 'string'
      || typeof parsedBody.refresh_token !== 'string'
      || typeof parsedBody.expires_in !== 'number'
    ) {
      throw new UnauthorizedException(`Supabase ${operation} returned an invalid session response.`);
    }

    return {
      access_token: parsedBody.access_token,
      refresh_token: parsedBody.refresh_token,
      expires_in: parsedBody.expires_in,
    };
  }

  private async assignRoleToUser(userId: string, roleName: UserRole): Promise<void> {
    const role = await this.prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
      select: { id: true },
    });

    await this.prisma.userRole.upsert({
      where: {
        user_id_role_id: {
          user_id: userId,
          role_id: role.id,
        },
      },
      update: {},
      create: {
        user_id: userId,
        role_id: role.id,
      },
    });
  }

  private async resolveUserRole(userId: string): Promise<UserRole> {
    const roles = await this.prisma.userRole.findMany({
      where: { user_id: userId },
      select: {
        role: {
          select: { name: true },
        },
      },
    });

    const normalized = roles
      .map((entry) => entry.role.name.toLowerCase())
      .filter((value): value is UserRole => value === 'admin' || value === 'manager' || value === 'volunteer');

    if (normalized.includes('admin')) {
      return 'admin';
    }

    if (normalized.includes('manager')) {
      return 'manager';
    }

    return 'volunteer';
  }
}
