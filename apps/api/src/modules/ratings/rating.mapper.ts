import { toRatingSummary, type PublicRatingListView, type RatingPublicView } from '@rentacar/shared';
import type { RatingRecord } from './ratings.repository';

export function toRatingPublicView(rating: RatingRecord): RatingPublicView {
  return {
    id: rating.id,
    stars: rating.stars,
    comment: rating.comment,
    createdAt: rating.createdAt.toISOString(),
    rater: {
      id: rating.rater.id,
      fullName: rating.rater.fullName,
      profilePhotoUrl: rating.rater.profilePhotoUrl,
    },
  };
}

export function toPublicRatingListView(ratings: RatingRecord[]): PublicRatingListView {
  const totalCount = ratings.length;
  const averageStars =
    totalCount === 0 ? null : ratings.reduce((sum, rating) => sum + rating.stars, 0) / totalCount;

  return {
    summary: toRatingSummary(averageStars, totalCount),
    reviews: ratings.map(toRatingPublicView),
  };
}

export function assertRatingIsPublicSafe(view: RatingPublicView): void {
  const serialized = JSON.stringify(view);
  const forbidden = ['cnic', 'email', 'phone', 'passwordHash', 'rentalId'];

  for (const key of forbidden) {
    if (serialized.includes(`"${key}"`)) {
      throw new Error(`Rating view contains forbidden field: ${key}`);
    }
  }
}

export function normalizeRatingComment(comment: string | undefined): string | null {
  const trimmed = comment?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}
