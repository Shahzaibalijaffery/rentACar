export const RATING_MIN_STARS = 1;
export const RATING_MAX_STARS = 5;
export const RATING_COMMENT_MAX_LENGTH = 300;

export type RatingTarget = 'VEHICLE' | 'RENTER';

export type RatingSummary = {
  averageStars: number | null;
  totalCount: number;
};

export const EMPTY_RATING_SUMMARY: RatingSummary = {
  averageStars: null,
  totalCount: 0,
};

export function toRatingSummary(
  averageStars: number | null | undefined,
  totalCount: number | null | undefined,
): RatingSummary {
  const count = totalCount ?? 0;
  if (count <= 0 || averageStars == null || Number.isNaN(averageStars)) {
    return EMPTY_RATING_SUMMARY;
  }

  return {
    averageStars: Math.round(averageStars * 10) / 10,
    totalCount: count,
  };
}

export type CreateRatingRequest = {
  stars: number;
  comment?: string;
};

export type RatingPublicView = {
  id: string;
  stars: number;
  comment: string | null;
  createdAt: string;
  rater: {
    id: string;
    fullName: string;
    profilePhotoUrl: string | null;
  };
};

export type PublicRatingListView = {
  summary: RatingSummary;
  reviews: RatingPublicView[];
};

export type RentalRatingsView = {
  rentalId: string;
  myRating: RatingPublicView | null;
  counterpartyRating: RatingPublicView | null;
  canSubmit: boolean;
};
