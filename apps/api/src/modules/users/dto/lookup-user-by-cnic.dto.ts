import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LookupUserByCnicDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[\d-]+$/, { message: 'CNIC must contain digits and optional dashes' })
  cnic!: string;
}
