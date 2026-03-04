import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validate } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { FriendsModule } from './friends/friends.module';
import { EncountersModule } from './encounters/encounters.module';
import { NeedsModule } from './needs/needs.module';
import { HealthController } from './health/health.controller';
import { UsersController } from './users/users.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
      cache: true,
    }),
    PrismaModule,
    OrganizationsModule,
    UsersModule,
    AuthModule,
    FriendsModule,
    EncountersModule,
    NeedsModule,
  ],
  controllers: [AppController, HealthController, UsersController],
  providers: [AppService],
})
export class AppModule {}
