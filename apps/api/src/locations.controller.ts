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
import { getLocationById, listLocations } from './services/locationService';

@Controller()
export class LocationsController {
  @Get('locations')
  async getLocations(
    @Query('orgId') orgId: string | undefined,
    @CurrentUser() user: RequestContext,
  ) {
    const normalizedOrgId = orgId?.trim();
    return listLocations(normalizedOrgId && normalizedOrgId.length > 0 ? normalizedOrgId : user.orgId);
  }

  @Get('locations/:id')
  async getLocation(@Param('id') locationId: string) {
    const normalizedLocationId = locationId.trim();
    if (!normalizedLocationId) {
      throw new BadRequestException('location id is required');
    }

    const location = await getLocationById(normalizedLocationId);
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return location;
  }
}
