import type { RatingSummary } from '@rentacar/shared';

export function formatRatingLabel(summary: RatingSummary): string {
  if (summary.totalCount === 0) {
    return 'No ratings yet';
  }

  const average = summary.averageStars?.toFixed(1) ?? '—';
  const suffix = summary.totalCount === 1 ? 'rating' : 'ratings';
  return `${average} · ${summary.totalCount} ${suffix}`;
}
