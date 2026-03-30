import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from './common/decorators/current-user.decorator';
import type { RequestContext } from './common/types/request-context';
import {
  createFriend,
  FriendServiceError,
  searchFriends,
} from './services/friendService';

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseAliases(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

@Controller()
export class FriendsController {
  @Get('friends')
  async getFriends(
    @Query('search') search: string | undefined,
    @Query('orgId') orgId: string | undefined,
    @CurrentUser() user: RequestContext,
  ) {
    const normalizedSearch = toNonEmptyString(search);
    const normalizedOrgId = toNonEmptyString(orgId) ?? user.orgId;

    if (!normalizedSearch) {
      throw new BadRequestException('search query parameter is required');
    }

    if (!normalizedOrgId) {
      throw new BadRequestException('orgId query parameter is required');
    }

    return searchFriends(normalizedSearch, normalizedOrgId);
  }

  @Post('friends')
  async postFriend(
    @Body() body: unknown,
    @CurrentUser() user: RequestContext,
  ) {
    if (typeof body !== 'object' || body === null) {
      throw new BadRequestException('Request body must be a JSON object');
    }

    const payload = body as Record<string, unknown>;
    const preferredName = toNonEmptyString(payload.preferred_name ?? payload.preferredName);
    const orgId = toNonEmptyString(payload.org_id ?? payload.orgId) ?? user.orgId;
    const aliases = parseAliases(payload.aliases);

    if (!preferredName) {
      throw new BadRequestException('preferred_name is required');
    }

    try {
      return await createFriend({
        preferredName,
        orgId,
        aliases,
      });
    } catch (error) {
      if (error instanceof FriendServiceError) {
        throw new HttpException(error.message, error.statusCode);
      }

      throw error;
    }
  }
}
