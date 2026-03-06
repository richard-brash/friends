import { Controller, Get, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async getMe() {
    const user = await this.prisma.user.findFirst({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
