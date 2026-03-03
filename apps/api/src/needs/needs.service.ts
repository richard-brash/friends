import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FriendsService } from '../friends/friends.service';
import { CreateNeedDto } from './dto/create-need.dto';
import type { RequestContext } from '../common/types/request-context';
import type { NeedStatus } from '../common/types/domain-types';
import {
  isTerminalStatus,
  validateNeedTransition,
} from '../common/validators/need-lifecycle.validator';

@Injectable()
export class NeedsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly friendsService: FriendsService,
  ) {}

  async create(dto: CreateNeedDto, context: RequestContext) {
    await this.friendsService.findById(dto.friendId, context.orgId);

    return this.prisma.need.create({
      data: {
        org_id: context.orgId,
        friend_id: dto.friendId,
        category: dto.category,
        description: dto.description,
        priority: dto.priority,
        status: 'open',
      },
    });
  }

  async findAll(orgId: string, status?: NeedStatus) {
    return this.prisma.need.findMany({
      where: {
        org_id: orgId,
        ...(status ? { status } : {}),
      },
    });
  }

  async findByFriendId(friendId: string, orgId: string) {
    await this.friendsService.findById(friendId, orgId);

    return this.prisma.need.findMany({
      where: {
        org_id: orgId,
        friend_id: friendId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async updateStatus(id: string, newStatus: NeedStatus, context: RequestContext) {
    const need = await this.prisma.need.findUnique({
      where: { id },
    });

    if (!need || need.org_id !== context.orgId) {
      throw new NotFoundException(`Need with ID ${id} not found`);
    }

    if (isTerminalStatus(need.status)) {
      throw new BadRequestException(
        `Cannot transition from terminal status: ${need.status}`,
      );
    }

    validateNeedTransition(need.status, newStatus);

    if (need.status === newStatus) {
      return need;
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedNeed = await tx.need.update({
        where: { id: need.id },
        data: { status: newStatus },
      });

      await tx.fulfillmentEvent.create({
        data: {
          org_id: context.orgId,
          need_id: need.id,
          event_type: 'status_changed',
          notes: `${need.status} -> ${newStatus}`,
        },
      });

      return updatedNeed;
    });
  }
}