import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { CreateFriendDto } from './dto/create-friend.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestContext } from '../common/types/request-context';

@Controller('friends')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Post()
  @Roles('admin', 'manager', 'volunteer')
  async create(
    @Body() dto: CreateFriendDto,
    @CurrentUser() context: RequestContext,
  ) {
    return this.friendsService.create(dto, context.orgId);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'volunteer')
  async findById(
    @Param('id') id: string,
    @CurrentUser() context: RequestContext,
  ) {
    return this.friendsService.findById(id, context.orgId);
  }

  @Get()
  @Roles('admin', 'manager', 'volunteer')
  async search(
    @Query('search') query: string,
    @CurrentUser() context: RequestContext,
  ) {
    if (!query) {
      return [];
    }
    return this.friendsService.search(query, context.orgId);
  }
}
