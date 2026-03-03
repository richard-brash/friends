import { Module } from '@nestjs/common';
import { EncountersController } from './encounters.controller';
import { EncountersService } from './encounters.service';
import { FriendsModule } from '../friends/friends.module';

@Module({
  imports: [FriendsModule],
  controllers: [EncountersController],
  providers: [EncountersService],
})
export class EncountersModule {}