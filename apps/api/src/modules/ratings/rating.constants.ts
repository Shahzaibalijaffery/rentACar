import { RentalStatus } from '@prisma/client';
import { RATING_COMMENT_MAX_LENGTH, RATING_MAX_STARS, RATING_MIN_STARS } from '@rentacar/shared';

export { RATING_COMMENT_MAX_LENGTH, RATING_MAX_STARS, RATING_MIN_STARS };

export const RATING_LIST_LIMIT = 50;

export const RATEABLE_RENTAL_STATUSES: RentalStatus[] = [
  RentalStatus.COMPLETED,
  RentalStatus.RATED,
];
