import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { createHash, randomBytes } from 'crypto';

interface SendInviteDto {
  destination: string; // email or phone
  channel: 'email' | 'sms';
}

@Injectable()
export class InvitesService {
  private readonly resendApiKey: string | null;
  private readonly inviteFromEmail: string | null;
  private readonly inviteLoginUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.resendApiKey = this.configService.get<string>('RESEND_API_KEY')?.trim() || null;
    this.inviteFromEmail = this.configService.get<string>('INVITE_FROM_EMAIL')?.trim() || null;
    this.inviteLoginUrl =
      this.configService.get<string>('INVITE_LOGIN_URL')?.trim()
      || this.configService.get<string>('SUPABASE_INVITE_REDIRECT_URL')?.trim()
      || 'http://localhost:5173/login';
  }

  async sendInvite(
    organizationId: string,
    invitedByUserId: string,
    dto: SendInviteDto,
  ) {
    // Normalize destination
    const normalizedDestination = this.normalizeDestination(dto.destination, dto.channel);

    // Check if user is admin/has permission to invite
    const invitingUser = await this.prisma.user.findUnique({
      where: { id: invitedByUserId },
      select: { organization_id: true, name: true },
    });

    if (!invitingUser || invitingUser.organization_id !== organizationId) {
      throw new ForbiddenException('You cannot invite users to this organization');
    }

    if (dto.channel === 'sms') {
      throw new BadRequestException('SMS invites are not configured yet. Use email for now.');
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    // Check if invite already exists
    const existingInvite = await this.prisma.invite.findFirst({
      where: {
        organization_id: organizationId,
        destination: normalizedDestination,
      },
    });

    if (existingInvite && existingInvite.status === 'ACCEPTED') {
      throw new BadRequestException('This user has already been invited and accepted');
    }

    // Generate invite token (for optional invite links/codes)
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);

    // Create or update invite
    const invite = await this.prisma.invite.upsert({
      where: {
        organization_id_destination: {
          organization_id: organizationId,
          destination: normalizedDestination,
        },
      },
      create: {
        organization_id: organizationId,
        channel: dto.channel,
        destination: normalizedDestination,
        token_hash: tokenHash,
        invited_by_user_id: invitedByUserId,
        status: 'PENDING',
        expires_at: this.getExpirationDate(),
      },
      update: {
        token_hash: tokenHash,
        invited_by_user_id: invitedByUserId,
        status: 'PENDING',
        expires_at: this.getExpirationDate(),
      },
    });

    await this.sendInviteEmail(normalizedDestination, organization.name, invitingUser.name || null);
    await this.prisma.invite.update({
      where: { id: invite.id },
      data: { status: 'SENT' },
    });

    return { invite, token };
  }

  async listInvites(organizationId: string) {
    const invites = await this.prisma.invite.findMany({
      where: {
        organization_id: organizationId,
      },
      select: {
        id: true,
        destination: true,
        channel: true,
        status: true,
        expires_at: true,
        created_at: true,
        updated_at: true,
        invitedByUser: {
          select: { name: true },
        },
      },
      orderBy: { updated_at: 'desc' },
    });

    return invites;
  }

  async resendInvite(organizationId: string, inviteId: string, resentByUserId: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { id: inviteId },
      select: {
        id: true,
        organization_id: true,
        status: true,
        destination: true,
        channel: true,
      },
    });

    if (!invite || invite.organization_id !== organizationId) {
      throw new ForbiddenException('Invite not found in this organization');
    }

    if (invite.status === 'ACCEPTED') {
      throw new BadRequestException('Cannot resend an invite that has already been accepted');
    }

    if (invite.channel === 'sms') {
      throw new BadRequestException('SMS invites are not configured yet. Use email for now.');
    }

    const resentByUser = await this.prisma.user.findUnique({
      where: { id: resentByUserId },
      select: { name: true },
    });

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);

    let updatedInvite = await this.prisma.invite.update({
      where: { id: invite.id },
      data: {
        token_hash: tokenHash,
        invited_by_user_id: resentByUserId,
        status: 'PENDING',
        expires_at: this.getExpirationDate(),
      },
      select: {
        id: true,
        destination: true,
        channel: true,
        status: true,
        expires_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    await this.sendInviteEmail(
      updatedInvite.destination,
      organization.name,
      resentByUser?.name || null,
    );
    updatedInvite = await this.prisma.invite.update({
      where: { id: updatedInvite.id },
      data: { status: 'SENT' },
      select: {
        id: true,
        destination: true,
        channel: true,
        status: true,
        expires_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    return { invite: updatedInvite, token };
  }

  async cancelInvite(organizationId: string, inviteId: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { id: inviteId },
      select: {
        id: true,
        organization_id: true,
        status: true,
      },
    });

    if (!invite || invite.organization_id !== organizationId) {
      throw new ForbiddenException('Invite not found in this organization');
    }

    if (!['PENDING', 'SENT'].includes(invite.status)) {
      throw new BadRequestException('Only pending or sent invites can be canceled');
    }

    return this.prisma.invite.update({
      where: { id: inviteId },
      data: { status: 'REVOKED' },
    });
  }

  async removeInvite(organizationId: string, inviteId: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { id: inviteId },
      select: {
        id: true,
        organization_id: true,
      },
    });

    if (!invite || invite.organization_id !== organizationId) {
      throw new ForbiddenException('Invite not found in this organization');
    }

    await this.prisma.invite.delete({
      where: { id: inviteId },
    });

    return { id: inviteId, removed: true };
  }

  private normalizeDestination(destination: string, channel: 'email' | 'sms'): string {
    const trimmed = destination.trim().toLowerCase();

    if (channel === 'email') {
      // Basic email validation
      if (!trimmed.includes('@')) {
        throw new BadRequestException('Invalid email address');
      }
      return trimmed;
    }

    if (channel === 'sms') {
      // Normalize phone to E.164 format (keep + and digits only)
      const cleaned = trimmed.replace(/[^\d+]/g, '');
      if (!cleaned.startsWith('+')) {
        // If no +, assume US number and prepend +1
        if (cleaned.length === 10) {
          return `+1${cleaned}`;
        }
        if (cleaned.length === 11 && cleaned.startsWith('1')) {
          return `+${cleaned}`;
        }
        throw new BadRequestException('Invalid phone number format. Use +1 format or 10-digit US number');
      }
      return cleaned;
    }

    throw new BadRequestException('Invalid channel');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async sendInviteEmail(
    email: string,
    organizationName: string,
    invitedByName: string | null,
  ): Promise<void> {
    if (!this.resendApiKey) {
      throw new BadRequestException(
        'RESEND_API_KEY is not configured in the API environment.',
      );
    }

    if (!this.inviteFromEmail) {
      throw new BadRequestException('INVITE_FROM_EMAIL is not configured in the API environment.');
    }

    const inviteUrl = this.buildInviteLoginUrl(email);
    const inviterLine = invitedByName
      ? `${invitedByName} invited you to join ${organizationName}.`
      : `You have been invited to join ${organizationName}.`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.resendApiKey}`,
      },
      body: JSON.stringify({
        from: this.inviteFromEmail,
        to: [email],
        subject: `You're invited to ${organizationName}`,
        text: [
          inviterLine,
          '',
          'Use this link to open the login page and request your sign-in code:',
          inviteUrl,
          '',
          'If you were not expecting this invitation, you can ignore this email.',
        ].join('\n'),
        html: [
          `<p>${this.escapeHtml(inviterLine)}</p>`,
          '<p>Use this link to open the login page and request your sign-in code:</p>',
          `<p><a href="${this.escapeHtml(inviteUrl)}">Open sign-in page</a></p>`,
          '<p>If you were not expecting this invitation, you can ignore this email.</p>',
        ].join(''),
      }),
    });

    const bodyText = await response.text();

    if (response.ok) {
      return;
    }

    throw new BadRequestException(
      `Resend invite email failed (${response.status}): ${bodyText || 'Unknown error'}`,
    );
  }

  private buildInviteLoginUrl(email: string): string {
    const url = new URL(this.inviteLoginUrl);
    url.searchParams.set('email', email);
    return url.toString();
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private getExpirationDate(): Date {
    // Invites expire in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return expiresAt;
  }
}
