import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { VehicleAvailability } from '@prisma/client';
import {
  DISCOVERY_DEFAULT_PAGE,
  DISCOVERY_DEFAULT_PAGE_SIZE,
  DISCOVERY_DEFAULT_RADIUS_KM,
  DISCOVERY_MAX_PAGE_SIZE,
  DISCOVERY_MAX_RADIUS_KM,
  DISCOVERY_MIN_RADIUS_KM,
} from '../discovery.constants';

export class DiscoverVehiclesQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(DISCOVERY_MIN_RADIUS_KM)
  @Max(DISCOVERY_MAX_RADIUS_KM)
  radiusKm?: number = DISCOVERY_DEFAULT_RADIUS_KM;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = DISCOVERY_DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(DISCOVERY_MAX_PAGE_SIZE)
  pageSize?: number = DISCOVERY_DEFAULT_PAGE_SIZE;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  make?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  model?: string;

  @IsOptional()
  @IsEnum(VehicleAvailability)
  availability?: VehicleAvailability = VehicleAvailability.AVAILABLE;
}
