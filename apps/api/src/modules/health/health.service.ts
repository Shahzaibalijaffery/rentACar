import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkDatabase(): Promise<'connected' | 'disconnected'> {
    try {
      await this.prisma.$runCommandRaw({ ping: 1 });
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }
}
