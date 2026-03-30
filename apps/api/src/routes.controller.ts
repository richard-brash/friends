import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { CurrentUser } from './common/decorators/current-user.decorator';
import type { RequestContext } from './common/types/request-context';
import {
  getRouteById,
  getRoutesForOrganization,
} from './services/routeService';

@Controller()
export class RoutesController {
  @Get('routes')
  async listRoutes(
    @Query('organizationId') organizationId: string | undefined,
    @CurrentUser() user: RequestContext,
  ) {
    return getRoutesForOrganization(organizationId?.trim() || user.orgId);
  }

  @Get('routes/:id')
  async getRoute(@Param('id') routeId: string) {
    const normalizedRouteId = routeId.trim();
    if (!normalizedRouteId) {
      throw new BadRequestException('route id is required');
    }

    const route = await getRouteById(normalizedRouteId);
    if (!route) {
      throw new NotFoundException('Route not found');
    }

    return route;
  }
}
