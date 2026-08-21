import { IsIn, IsOptional } from 'class-validator';
import type { RentalLifecycleFilter } from '@rentacar/shared';

export class ListRentalsQueryDto {
  @IsOptional()
  @IsIn(['all', 'active', 'completed'])
  lifecycle?: RentalLifecycleFilter = 'all';
}
