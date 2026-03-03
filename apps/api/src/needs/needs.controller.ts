import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NeedsService } from './needs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestContext } from '../common/types/request-context';
import { CreateNeedDto } from './dto/create-need.dto';
import { UpdateNeedStatusDto } from './dto/update-need-status.dto';
import { FindNeedsQueryDto } from './dto/find-needs-query.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class NeedsController {
  constructor(private readonly needsService: NeedsService) {}

  @Post('needs')
  @Roles('admin', 'manager', 'volunteer')
  async create(
    @Body() dto: CreateNeedDto,
    @CurrentUser() context: RequestContext,
  ) {
    return this.needsService.create(dto, context);
  }

  @Get('needs')
  @Roles('admin', 'manager', 'volunteer')
  async findAll(
    @Query() query: FindNeedsQueryDto,
    @CurrentUser() context: RequestContext,
  ) {
    return this.needsService.findAll(context.orgId, query.status);
  }

  @Get('friends/:id/needs')
  @Roles('admin', 'manager', 'volunteer')
  async findByFriend(
    @Param('id') friendId: string,
    @CurrentUser() context: RequestContext,
  ) {
    return this.needsService.findByFriendId(friendId, context.orgId);
  }

  @Patch('needs/:id/status')
  @Roles('admin', 'manager', 'volunteer')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateNeedStatusDto,
    @CurrentUser() context: RequestContext,
  ) {
    return this.needsService.updateStatus(id, dto.status, context);
  }
}