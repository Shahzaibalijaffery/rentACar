import { Controller, Get } from '@nestjs/common';
import type { ApiResponse } from '@rentacar/shared';
import { Public } from '../../common/decorators/auth.decorators';
import { HealthService } from './health.service';

type HealthData = {
  status: 'ok';
  database: 'connected' | 'disconnected';
};

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  async getHealth(): Promise<ApiResponse<HealthData>> {
    const database = await this.healthService.checkDatabase();
    return {
      data: {
        status: 'ok',
        database,
      },
    };
  }
}
