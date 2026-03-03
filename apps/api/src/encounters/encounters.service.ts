import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FriendsService } from '../friends/friends.service';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import type { RequestContext } from '../common/types/request-context';

@Injectable()
export class EncountersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly friendsService: FriendsService,
  ) {}

  async create(dto: CreateEncounterDto, context: RequestContext) {
    await this.friendsService.findById(dto.friendId, context.orgId);

    return this.prisma.encounter.create({
      data: {
        friend_id: dto.friendId,
        org_id: context.orgId,
        user_id: context.userId,
        location_text: dto.locationText,
        occurred_at: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
        notes: dto.notes,
      },
    });
  }

  async findByFriendId(friendId: string, orgId: string) {
    await this.friendsService.findById(friendId, orgId);

    return this.prisma.encounter.findMany({
      where: {
        friend_id: friendId,
        org_id: orgId,
      },
      orderBy: {
        occurred_at: 'desc',
      },
    });
  }
}