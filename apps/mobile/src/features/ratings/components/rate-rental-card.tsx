import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { RATING_COMMENT_MAX_LENGTH, type RentalRatingsView } from '@rentacar/shared';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { AppText } from '@/components/app-text';
import { useSubmitRentalRatingMutation } from '@/api/hooks/use-ratings';
import { StarRating } from '@/features/ratings/components/star-rating';
import { colors, radii, spacing } from '@/theme';

type RateRentalCardProps = {
  rentalId: string;
  perspective: 'owner' | 'renter';
  ratings: RentalRatingsView;
};

export function RateRentalCard({ rentalId, perspective, ratings }: RateRentalCardProps) {
  const [stars, setStars] = useState(ratings.myRating?.stars ?? 0);
  const [comment, setComment] = useState('');
  const submitMutation = useSubmitRentalRatingMutation(rentalId);

  const isOwner = perspective === 'owner';
  const title = isOwner ? 'How was the renter?' : 'How was this car?';
  const hint = isOwner
    ? 'Tap the stars. This rating shows on the renter’s profile.'
    : 'Tap the stars. This rating shows on the car.';

  const handleSubmit = () => {
    if (stars < 1) {
      Alert.alert('Choose stars', 'Tap 1 to 5 stars, then send.');
      return;
    }

    submitMutation.mutate(
      { stars, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          setComment('');
          Alert.alert('Saved', 'Thanks. Your rating was sent.');
        },
        onError: (error) => Alert.alert('Could not send rating', error.message),
      },
    );
  };

  if (ratings.myRating) {
    return (
      <View style={styles.card}>
        <AppText variant="title">{title}</AppText>
        <AppText variant="caption">You already sent a rating.</AppText>
        <StarRating value={ratings.myRating.stars} size={22} />
        {ratings.myRating.comment ? (
          <AppText variant="body">{ratings.myRating.comment}</AppText>
        ) : null}
      </View>
    );
  }

  if (!ratings.canSubmit) {
    return null;
  }

  return (
    <View style={styles.card}>
      <AppText variant="title">{title}</AppText>
      <AppText variant="body">{hint}</AppText>
      <StarRating value={stars} onChange={setStars} />
      <AppInput
        placeholder="Write a short comment (optional)"
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={RATING_COMMENT_MAX_LENGTH}
        style={styles.comment}
      />
      <AppButton
        title="Send rating"
        icon="star"
        loading={submitMutation.isPending}
        onPress={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  comment: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
});
