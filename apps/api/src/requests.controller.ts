import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RequestStatus } from '@prisma/client';
import { CurrentUser } from './common/decorators/current-user.decorator';
import { Roles } from './common/decorators/roles.decorator';
import { RolesGuard } from './common/guards/roles.guard';
import type { RequestContext } from './common/types/request-context';
import {
  addRequestItem,
  applyNeedAction,
  listRequestsByStatus,
  pickItem,
  updateRequestItem,
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

  @Post('requests/:requestId/items')
  async addItem(
    @Param('requestId') requestId: string,
    @Body() body: { description?: unknown; quantityRequested?: unknown },
    @CurrentUser() _user: RequestContext,
  ) {
    const description = typeof body?.description === 'string' ? body.description.trim() : '';
    const qty = typeof body?.quantityRequested === 'number' ? body.quantityRequested : 0;

    if (!description) throw new BadRequestException('description is required');
    if (!Number.isInteger(qty) || qty < 1) throw new BadRequestException('quantityRequested must be a positive integer');

    let result: { id: string } | null;
    try {
      result = await addRequestItem(requestId.trim(), description, qty);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'REQUEST_NOT_EDITABLE') {
        throw new BadRequestException('request cannot be edited in its current status');
      }
      throw e;
    }

    if (!result) throw new NotFoundException('Request not found');
    return result;
  }

  @Patch('requests/:requestId/items/:itemId')
  async updateItem(
    @Param('requestId') requestId: string,
    @Param('itemId') itemId: string,
    @Body() body: { description?: unknown; quantityRequested?: unknown },
    @CurrentUser() _user: RequestContext,
  ) {
    const description = typeof body?.description === 'string' ? body.description.trim() : '';
    const qty = typeof body?.quantityRequested === 'number' ? body.quantityRequested : 0;

    if (!description) throw new BadRequestException('description is required');
    if (!Number.isInteger(qty) || qty < 1) throw new BadRequestException('quantityRequested must be a positive integer');

    let result: { id: string } | null;
    try {
      result = await updateRequestItem(requestId.trim(), itemId.trim(), description, qty);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'ITEM_NOT_EDITABLE') {
        throw new BadRequestException('item cannot be edited in its current status');
      }
      throw e;
    }

    if (!result) throw new NotFoundException('Item not found');
    return result;
  }

  @Post('requests/:requestId/items/:itemId/actions')
  @UseGuards(RolesGuard)
  async applyItemAction(
    @Param('requestId') requestId: string,
    @Param('itemId') itemId: string,
    @Body() body: { action?: unknown; notes?: unknown },
    @CurrentUser() user: RequestContext,
  ) {
    const action = typeof body?.action === 'string' ? body.action.trim() : '';
    const notes = typeof body?.notes === 'string' ? body.notes.trim() : '';

    const MANAGER_ONLY_ACTIONS = ['mark-unavailable', 'mark-available'];
    const ALLOWED_ACTIONS = ['mark-unavailable', 'mark-available', 'close-unable', 'mark-picked'];

    if (!ALLOWED_ACTIONS.includes(action)) {
      throw new BadRequestException('action must be one of: mark-unavailable, mark-available, close-unable, mark-picked');
    }

    if (MANAGER_ONLY_ACTIONS.includes(action) && user.role !== 'admin' && user.role !== 'manager') {
      throw new ForbiddenException('only managers and admins can perform this action');
    }

    // mark-picked is a warehouse action (manager+)
    if (action === 'mark-picked') {
      if (user.role !== 'admin' && user.role !== 'manager') {
        throw new ForbiddenException('only managers and admins can pick items');
      }
      let result: { id: string; status: unknown } | null;
      try {
        result = await pickItem(requestId.trim(), itemId.trim(), user.userId);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === 'ITEM_NOT_PICKABLE') {
          throw new BadRequestException('item cannot be picked in its current status');
        }
        throw e;
      }
      if (!result) throw new NotFoundException('Item not found');
      return result;
    }

    let result: { id: string; status: unknown } | null;
    try {
      result = await applyNeedAction(requestId.trim(), itemId.trim(), action, notes);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'UNKNOWN_ACTION') {
        throw new BadRequestException('unknown action');
      }
      throw e;
    }

    if (!result) throw new NotFoundException('Item not found');
    return result;
  }
}
