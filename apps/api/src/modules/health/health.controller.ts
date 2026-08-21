import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { ApiResponse } from '@rentacar/shared';
import { Public } from '../../common/decorators/auth.decorators';
import { HealthService } from './health.service';
import type { HealthSummary, StorageProbeResult } from './health.types';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  async getHealth(): Promise<ApiResponse<HealthSummary>> {
    const database = await this.healthService.checkDatabase();

    return {
      data: {
        status: 'ok',
        database,
        storage: {
          driver: this.healthService.getStorageDriver(),
        },
      },
    };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Get('storage')
  @HttpCode(HttpStatus.OK)
  async probeStorage(): Promise<ApiResponse<StorageProbeResult>> {
    const result = await this.healthService.probeStorage();

    return { data: result };
  }
}
