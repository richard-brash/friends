import { Controller, Get } from '@nestjs/common';
import { getDashboardStats } from './services/dashboardService';

@Controller()
export class DashboardController {
  @Get('dashboard')
  async getDashboard() {
    return getDashboardStats();
  }
}
