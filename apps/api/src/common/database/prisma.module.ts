import { Global, Module } from '@nestjs/common';
import { UserPlanLookup } from '../plans/user-plan.lookup';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, UserPlanLookup],
  exports: [PrismaService, UserPlanLookup],
})
export class PrismaModule {}
