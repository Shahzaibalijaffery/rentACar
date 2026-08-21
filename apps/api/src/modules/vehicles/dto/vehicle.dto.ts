import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { VehicleAvailability } from '@prisma/client';

export class CreateVehicleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  make!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  model!: string;

  @IsInt()
  @Min(1980)
  @Max(new Date().getFullYear() + 1)
  year!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  color!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  areaLabel?: string;
}

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  make?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  model?: string;

  @IsOptional()
  @IsInt()
  @Min(1980)
  @Max(new Date().getFullYear() + 1)
  year?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  color?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  areaLabel?: string | null;
}

export class UpdateVehicleAvailabilityDto {
  @IsEnum(VehicleAvailability)
  availability!: VehicleAvailability;
}
