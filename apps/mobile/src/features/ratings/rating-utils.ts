import type { RatingSummary } from '@rentacar/shared';
import { i18n } from '@/i18n';

export function formatRatingLabel(summary: RatingSummary): string {
  if (summary.totalCount === 0) {
    return i18n.t('ratings:none');
  }

  return i18n.t('ratings:count', {
    count: summary.totalCount,
    average: summary.averageStars?.toFixed(1) ?? '—',
  });
}
