import { Controller, Get, NotFoundException } from '@nestjs/common';
import { CurrentUser } from './common/decorators/current-user.decorator';
import type { RequestContext } from './common/types/request-context';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async getMe(@CurrentUser() userContext: RequestContext) {
    const user = await this.prisma.user.findUnique({
      where: { id: userContext.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        organization_id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      role: userContext.role,
    };
  }
}
