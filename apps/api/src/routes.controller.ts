import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { CurrentUser } from './common/decorators/current-user.decorator';
import type { RequestContext } from './common/types/request-context';
import {
  getRouteById,
  getRoutesForOrganization,
} from './services/routeService';

@Controller()
export class RoutesController {
  @Get('routes')
  async listRoutes(@CurrentUser() user: RequestContext) {
    return getRoutesForOrganization(user.orgId);
  }

  @Get('routes/:id')
  async getRoute(
    @Param('id') routeId: string,
    @CurrentUser() user: RequestContext,
  ) {
    const normalizedRouteId = routeId.trim();
    if (!normalizedRouteId) {
      throw new NotFoundException('Route not found');
    }

    const route = await getRouteById(normalizedRouteId, user.orgId);
    if (!route) {
      throw new NotFoundException('Route not found');
    }

    return route;
  }
}
