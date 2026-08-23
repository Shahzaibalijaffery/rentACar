import { StyleSheet, View } from 'react-native';
import type { RatingPublicView, RatingSummary } from '@rentacar/shared';
import { AppText } from '@/components/app-text';
import { ProfileAvatar } from '@/components/profile-avatar';
import { RatingSummaryText } from '@/features/ratings/components/rating-summary-text';
import { StarRating } from '@/features/ratings/components/star-rating';
import { colors, radii, spacing } from '@/theme';

type RatingReviewListProps = {
  title: string;
  summary: RatingSummary;
  reviews: RatingPublicView[];
};

export function RatingReviewList({ title, summary, reviews }: RatingReviewListProps) {
  if (reviews.length === 0) {
    return null;
  }
  return (
    <View style={styles.section}>
      <AppText variant="label">{title}</AppText>
      <RatingSummaryText summary={summary} />
      {reviews.map((review) => (
        <View key={review.id} style={styles.card}>
          <View style={styles.header}>
            <ProfileAvatar
              fullName={review.rater.fullName}
              profilePhotoUrl={review.rater.profilePhotoUrl}
              size={40}
            />
            <View style={styles.meta}>
              <AppText variant="body" style={styles.name}>
                {review.rater.fullName}
              </AppText>
              <StarRating value={review.stars} size={16} />
            </View>
          </View>
          {review.comment ? <AppText variant="body">{review.comment}</AppText> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  meta: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontWeight: '600',
  },
});
