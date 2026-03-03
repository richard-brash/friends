import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { EncountersService } from './encounters.service';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestContext } from '../common/types/request-context';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class EncountersController {
  constructor(private readonly encountersService: EncountersService) {}

  @Post('encounters')
  @Roles('admin', 'manager', 'volunteer')
  async create(
    @Body() dto: CreateEncounterDto,
    @CurrentUser() context: RequestContext,
  ) {
    return this.encountersService.create(dto, context);
  }

  @Get('friends/:id/encounters')
  @Roles('admin', 'manager', 'volunteer')
  async findByFriend(
    @Param('id') friendId: string,
    @CurrentUser() context: RequestContext,
  ) {
    return this.encountersService.findByFriendId(friendId, context.orgId);
  }
}