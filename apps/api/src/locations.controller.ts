import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { getLocationById } from './services/locationService';

@Controller()
export class LocationsController {
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
