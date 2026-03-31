import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validate } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { HealthController } from './health/health.controller';
import { RoutesController } from './routes.controller';
import { LocationsController } from './locations.controller';
import { EncountersController } from './encounters.controller';
import { RequestsController } from './requests.controller';
import { DeliveryAttemptsController } from './delivery-attempts.controller';
import { MeController } from './me.controller';
import { DashboardController } from './dashboard.controller';
import { FriendsController } from './friends.controller';
import { QuickPickItemsController } from './quick-pick-items.controller';
import { AuthController } from './auth.controller';
import { InvitesController } from './invites.controller';
import { QuickPickItemService } from './services/quickPickItemService';
import { AuthService } from './auth.service';
import { InvitesService } from './invites.service';
import { UserAccessController } from './user-access.controller';
import { UserAccessService } from './user-access.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

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
  ],
  controllers: [
    AppController,
    HealthController,
    RoutesController,
    LocationsController,
    EncountersController,
    RequestsController,
    DeliveryAttemptsController,
    MeController,
    DashboardController,
    FriendsController,
    QuickPickItemsController,
    AuthController,
    InvitesController,
    UserAccessController,
  ],
  providers: [
    AppService,
    QuickPickItemService,
    AuthService,
    InvitesService,
    UserAccessService,
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
