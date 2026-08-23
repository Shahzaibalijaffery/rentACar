import { Injectable } from '@nestjs/common';
import { getPlanLimits, resolveUserPlan, type UserPlanLimits } from '@rentacar/shared';
import { PrismaService } from '../database/prisma.service';
import { DomainError } from '../errors/domain.error';

@Injectable()
export class UserPlanLookup {
  constructor(private readonly prisma: PrismaService) {}

  async getLimitsForUser(userId: string): Promise<UserPlanLimits> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) {
      throw new DomainError('User not found', 'USER_NOT_FOUND', 404);
    }

    return getPlanLimits(resolveUserPlan(user.plan));
  }
}
