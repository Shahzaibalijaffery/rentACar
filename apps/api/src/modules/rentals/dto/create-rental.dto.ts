import { IsISO8601, IsMongoId, IsOptional } from 'class-validator';

export class CreateRentalDto {
  @IsMongoId()
  vehicleId!: string;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;
}
