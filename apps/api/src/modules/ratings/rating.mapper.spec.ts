import { RatingTarget } from '@prisma/client';
import {
  assertRatingIsPublicSafe,
  normalizeRatingComment,
  toPublicRatingListView,
  toRatingPublicView,
} from './rating.mapper';
import type { RatingRecord } from './ratings.repository';

const rating = {
  id: 'rating-1',
  rentalId: 'rental-1',
  vehicleId: 'vehicle-1',
  raterId: 'renter-1',
  rateeId: 'owner-1',
  target: RatingTarget.VEHICLE,
  stars: 5,
  comment: 'Clean car and smooth handover',
  createdAt: new Date('2026-01-16T10:00:00.000Z'),
  updatedAt: new Date('2026-01-16T10:00:00.000Z'),
  rater: {
    id: 'renter-1',
    fullName: 'Test Renter',
    profilePhotoUrl: null,
  },
} as RatingRecord;

describe('rating mapper', () => {
  it('maps a public review without rental or identity fields', () => {
    const view = toRatingPublicView(rating);

    expect(view).toEqual({
      id: 'rating-1',
      stars: 5,
      comment: 'Clean car and smooth handover',
      createdAt: '2026-01-16T10:00:00.000Z',
      rater: {
        id: 'renter-1',
        fullName: 'Test Renter',
        profilePhotoUrl: null,
      },
    });
    expect(() => assertRatingIsPublicSafe(view)).not.toThrow();
    expect(JSON.stringify(view)).not.toMatch(/cnic|email|phone|rentalId/i);
  });

  it('summarizes a public review list', () => {
    const list = toPublicRatingListView([
      rating,
      { ...rating, id: 'rating-2', stars: 4, comment: null },
    ]);

    expect(list.summary).toEqual({ averageStars: 4.5, totalCount: 2 });
    expect(list.reviews).toHaveLength(2);
  });

  it('normalizes blank compliments to null', () => {
    expect(normalizeRatingComment(undefined)).toBeNull();
    expect(normalizeRatingComment('   ')).toBeNull();
    expect(normalizeRatingComment('  Great car  ')).toBe('Great car');
  });
});
