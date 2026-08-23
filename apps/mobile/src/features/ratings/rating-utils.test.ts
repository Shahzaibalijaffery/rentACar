import { formatRatingLabel } from '@/features/ratings/rating-utils';

describe('rating utils', () => {
  it('describes an empty summary', () => {
    expect(formatRatingLabel({ averageStars: null, totalCount: 0 })).toBe('No ratings yet');
  });

  it('formats average stars and count', () => {
    expect(formatRatingLabel({ averageStars: 4.5, totalCount: 2 })).toBe('4.5 · 2 ratings');
    expect(formatRatingLabel({ averageStars: 5, totalCount: 1 })).toBe('5.0 · 1 rating');
  });
});
