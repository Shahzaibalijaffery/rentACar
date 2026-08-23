import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { RATING_COMMENT_MAX_LENGTH, RATING_MAX_STARS, RATING_MIN_STARS } from '../rating.constants';

export class CreateRatingDto {
  @Type(() => Number)
  @IsInt()
  @Min(RATING_MIN_STARS)
  @Max(RATING_MAX_STARS)
  stars!: number;

  @IsOptional()
  @IsString()
  @MaxLength(RATING_COMMENT_MAX_LENGTH)
  comment?: string;
}
