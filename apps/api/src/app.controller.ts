import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import type { VersionInfo } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('version')
  getVersion(): VersionInfo {
    return this.appService.getVersion();
  }
}
