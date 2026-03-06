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
  async listRequests(@Query('status') status?: string) {
    const rawStatus = status?.trim();
    if (!rawStatus) {
      throw new BadRequestException('status query parameter is required');
    }

    const parsedStatus = parseRequestStatus(rawStatus);
    if (!parsedStatus) {
      throw new BadRequestException('invalid request status');
    }

    return listRequestsByStatus(parsedStatus);
  }

  @Patch('requests/:id/status')
  async patchRequestStatus(
    @Param('id') requestId: string,
    @Body() body: { status?: unknown },
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

    const updated = await updateRequestStatus(normalizedRequestId, parsedStatus);
    if (!updated) {
      throw new NotFoundException('Request not found');
    }

    return updated;
  }
}
