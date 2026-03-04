import { Module } from '@nestjs/common';
import { NeedsController } from './needs.controller';
import { NeedsService } from './needs.service';
import { FriendsModule } from '../friends/friends.module';

@Module({
  imports: [FriendsModule],
  controllers: [NeedsController],
  providers: [NeedsService],
})
export class NeedsModule {}