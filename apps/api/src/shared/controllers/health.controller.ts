// apps/api/src/shared/controllers/health.controller.ts

import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'massage-api',
      timestamp: new Date().toISOString(),
    };
  }
}