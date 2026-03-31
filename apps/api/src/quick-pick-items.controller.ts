import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CurrentUser } from "./common/decorators/current-user.decorator";
import { Roles } from "./common/decorators/roles.decorator";
import type { RequestContext } from "./common/types/request-context";
import { QuickPickItemService } from "./services/quickPickItemService";

@Controller("quick-pick-items")
@Roles("admin", "manager")
export class QuickPickItemsController {
  constructor(private readonly service: QuickPickItemService) {}

  @Get()
  async list(
    @Query("orgId") orgId: string | undefined,
    @CurrentUser() user: RequestContext,
  ) {
    return this.service.list(orgId?.trim() || user.orgId);
  }

  @Post()
  async create(
    @Body() body: { orgId: string; label: string; sortOrder?: number },
    @CurrentUser() user: RequestContext,
  ) {
    return this.service.create(body.orgId?.trim() || user.orgId, body.label, body.sortOrder);
  }

  @Post("seed-defaults")
  @HttpCode(HttpStatus.NO_CONTENT)
  async seedDefaults(
    @Body() body: { orgId: string },
    @CurrentUser() user: RequestContext,
  ) {
    await this.service.seedDefaults(body.orgId?.trim() || user.orgId);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() body: { orgId: string; label?: string; sort_order?: number },
    @CurrentUser() user: RequestContext,
  ) {
    const result = await this.service.update(id, body.orgId?.trim() || user.orgId, {
      label: body.label,
      sort_order: body.sort_order,
    });

    if (!result) {
      throw new NotFoundException("Item not found");
    }

    return result;
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param("id") id: string,
    @Query("orgId") orgId: string | undefined,
    @CurrentUser() user: RequestContext,
  ) {
    const deleted = await this.service.remove(id, orgId?.trim() || user.orgId);
    if (!deleted) {
      throw new NotFoundException("Item not found");
    }
  }
}
