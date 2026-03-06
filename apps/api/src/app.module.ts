import { Module } from '@nestjs/common';
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
  ],
  providers: [AppService],
})
export class AppModule {}
