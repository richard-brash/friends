import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { IsArray, IsIn, IsString } from 'class-validator';
import { UserAccessService } from './user-access.service';
import { CurrentUser } from './common/decorators/current-user.decorator';
import { Roles } from './common/decorators/roles.decorator';
import type { RequestContext } from './common/types/request-context';

const ROLE_VALUES = ['admin', 'manager', 'volunteer'] as const;

class GrantRoleDto {
  @IsString()
  @IsIn(ROLE_VALUES)
  role!: string;
}

class ReplaceRolesDto {
  @IsArray()
  @IsString({ each: true })
  @IsIn(ROLE_VALUES, { each: true })
  roles!: string[];
}

/**
 * User Access Management controller.
 *
 * GET  /user-access              → admin, manager (read-only for managers)
 * POST /user-access/:id/roles    → admin only (grant a role)
 * DEL  /user-access/:id/roles/:r → admin only (revoke a role)
 * PUT  /user-access/:id/roles    → admin only (replace full role set)
 */
@Controller('user-access')
@Roles('admin', 'manager')
export class UserAccessController {
  constructor(private readonly userAccessService: UserAccessService) {}

  @Get()
  async listUsers(@CurrentUser() user: RequestContext) {
    return this.userAccessService.listUsers(user.orgId);
  }

  @Post(':userId/roles')
  @Roles('admin')
  async grantRole(
    @Param('userId') userId: string,
    @Body() dto: GrantRoleDto,
    @CurrentUser() user: RequestContext,
  ) {
    return this.userAccessService.grantRole(user.orgId, userId, dto.role);
  }

  @Delete(':userId/roles/:roleName')
  @Roles('admin')
  async revokeRole(
    @Param('userId') userId: string,
    @Param('roleName') roleName: string,
    @CurrentUser() user: RequestContext,
  ) {
    return this.userAccessService.revokeRole(user.orgId, userId, roleName);
  }

  @Put(':userId/roles')
  @Roles('admin')
  async replaceRoles(
    @Param('userId') userId: string,
    @Body() dto: ReplaceRolesDto,
    @CurrentUser() user: RequestContext,
  ) {
    return this.userAccessService.replaceRoles(user.orgId, userId, dto.roles);
  }
}
