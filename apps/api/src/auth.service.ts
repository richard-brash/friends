import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { RequestContext } from './common/types/request-context';

type SupabaseClaims = JWTPayload & {
  sub?: string;
  phone?: string;
  email?: string;
  user_metadata?: {
    name?: string;
    full_name?: string;
  };
};

@Injectable()
export class AuthService {
  private readonly supabaseUrl: string;
  private readonly issuer: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    this.issuer = `${this.supabaseUrl}/auth/v1`;
    this.jwks = createRemoteJWKSet(new URL(`${this.supabaseUrl}/auth/v1/.well-known/jwks.json`));
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
      const organization = await this.getDefaultOrganization();
      user = await this.prisma.user.create({
        data: {
          organization_id: organization.id,
          auth_user_id: authUserId,
          phone_number: phoneNumber,
          email,
          name,
        },
        select: { id: true, organization_id: true },
      });
    }

    return {
      userId: user.id,
      orgId: user.organization_id,
      role: 'volunteer',
    };
  }

  private async getDefaultOrganization() {
    const configuredName = this.configService.get<string>('DEFAULT_ORGANIZATION_NAME')?.trim() || 'Friend Helper Outreach';

    const existing = await this.prisma.organization.findFirst({
      orderBy: { created_at: 'asc' },
      select: { id: true, name: true },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.organization.create({
      data: { name: configuredName },
      select: { id: true, name: true },
    });
  }

  private normalizePhone(value: string | undefined): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
