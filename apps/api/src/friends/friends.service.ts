import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFriendDto } from './dto/create-friend.dto';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFriendDto, orgId: string) {
    return this.prisma.friend.create({
      data: {
        org_id: orgId,
        preferred_name: dto.preferred_name,
        aliases: dto.aliases || [],
        identifying_notes: dto.identifying_notes,
        consent_scope: dto.consent_scope,
      },
    });
  }

  async findById(id: string, orgId: string) {
    const friend = await this.prisma.friend.findUnique({
      where: { id },
    });

    if (!friend) {
      throw new NotFoundException(`Friend with ID ${id} not found`);
    }

    if (friend.org_id !== orgId) {
      throw new NotFoundException(`Friend with ID ${id} not found`);
    }

    return friend;
  }

  async search(query: string, orgId: string) {
    const lowerQuery = query.toLowerCase();

    // Search in preferred_name and aliases
    const friends = await this.prisma.friend.findMany({
      where: {
        org_id: orgId,
        OR: [
          {
            preferred_name: {
              contains: lowerQuery,
              mode: 'insensitive',
            },
          },
          {
            aliases: {
              array_contains: [query],
            },
          },
        ],
      },
    });

    return friends;
  }
}
