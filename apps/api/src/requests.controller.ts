import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { RequestStatus } from '@prisma/client';
import { CurrentUser } from './common/decorators/current-user.decorator';
import type { RequestContext } from './common/types/request-context';
import {
  listRequestsByStatus,
  updateRequestStatus,
} from './services/requestService';

function parseRequestStatus(value: string): RequestStatus | null {
  const normalized = value.trim().toUpperCase();
  return Object.values(RequestStatus).includes(normalized as RequestStatus)
    ? (normalized as RequestStatus)
    : null;
}

@Controller()
export class RequestsController {
  @Get('requests')
  async listRequests(
    @Query('status') status?: string,
    @Query('routeId') routeId?: string,
  ) {
    const rawStatus = status?.trim();

    if (rawStatus) {
      const parsedStatus = parseRequestStatus(rawStatus);
      if (!parsedStatus) {
        throw new BadRequestException('invalid request status');
      }

      return listRequestsByStatus(parsedStatus, routeId);
    }

    return listRequestsByStatus(undefined, routeId);
  }

  @Patch('requests/:id/status')
  async patchRequestStatus(
    @Param('id') requestId: string,
    @Body() body: { status?: unknown },
    @CurrentUser() user: RequestContext,
  ) {
    const normalizedRequestId = requestId.trim();
    if (!normalizedRequestId) {
      throw new BadRequestException('request id is required');
    }

    const incomingStatus = typeof body?.status === 'string' ? body.status : '';
    const parsedStatus = parseRequestStatus(incomingStatus);

    if (!parsedStatus) {
      throw new BadRequestException('status is required and must be valid');
    }

    const updated = await updateRequestStatus(normalizedRequestId, parsedStatus, user.userId);
    if (!updated) {
      throw new NotFoundException('Request not found');
    }

    return updated;
  }
}
