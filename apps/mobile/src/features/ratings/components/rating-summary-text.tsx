import { StyleSheet, View } from 'react-native';
import type { RatingSummary } from '@rentacar/shared';
import { AppIcon } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { formatRatingLabel } from '@/features/ratings/rating-utils';
import { colors, spacing } from '@/theme';

type RatingSummaryTextProps = {
  summary: RatingSummary;
};

export function RatingSummaryText({ summary }: RatingSummaryTextProps) {
  return (
    <View style={styles.row}>
      <AppIcon
        name="star"
        size={14}
        color={summary.totalCount > 0 ? colors.accent : colors.textSecondary}
      />
      <AppText variant="caption" style={styles.label}>
        {formatRatingLabel(summary)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
  },
});
