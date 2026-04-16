import {
  Body,
  Controller,
  Post,
  Get,
  Delete,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { IsIn, IsString } from 'class-validator';
import { InvitesService } from './invites.service';
import { CurrentUser } from './common/decorators/current-user.decorator';
import { Roles } from './common/decorators/roles.decorator';
import type { RequestContext } from './common/types/request-context';

class SendInviteDto {
  @IsString()
  destination!: string;

  @IsString()
  @IsIn(['email', 'sms'])
  channel!: 'email' | 'sms';
}

@Controller('invites')
@Roles('admin', 'manager')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post()
  async sendInvite(
    @Body() dto: SendInviteDto,
    @CurrentUser() user: RequestContext,
  ) {
    // Validate input
    if (!dto.destination || typeof dto.destination !== 'string') {
      throw new BadRequestException('destination is required');
    }

    if (!dto.channel || !['email', 'sms'].includes(dto.channel)) {
      throw new BadRequestException('channel must be "email" or "sms"');
    }

    const { invite } = await this.invitesService.sendInvite(
      user.orgId,
      user.userId,
      {
        destination: dto.destination,
        channel: dto.channel,
      },
    );

    return {
      message: `Invite sent to ${invite.destination}`,
      destination: invite.destination,
      channel: invite.channel,
      inviteId: invite.id,
    };
  }

  @Get()
  async listInvites(@CurrentUser() user: RequestContext) {
    return this.invitesService.listInvites(user.orgId);
  }

  @Post(':inviteId/resend')
  async resendInvite(
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: RequestContext,
  ) {
    const { invite } = await this.invitesService.resendInvite(
      user.orgId,
      inviteId,
      user.userId,
    );

    return {
      message: `Invite resent to ${invite.destination}`,
      invite,
    };
  }

  @Delete(':inviteId/cancel')
  async cancelInvite(
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: RequestContext,
  ) {
    return this.invitesService.cancelInvite(user.orgId, inviteId);
  }

  @Delete(':inviteId')
  async removeInvite(
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: RequestContext,
  ) {
    return this.invitesService.removeInvite(user.orgId, inviteId);
  }
}
