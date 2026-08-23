import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/app-icon';
import { colors, spacing } from '@/theme';

type StarRatingProps = {
  value: number;
  onChange?: (stars: number) => void;
  size?: number;
};

export function StarRating({ value, onChange, size = 28 }: StarRatingProps) {
  const interactive = typeof onChange === 'function';

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((stars) => {
        const filled = stars <= value;
        const star = (
          <AppIcon name="star" size={size} color={filled ? colors.accent : colors.border} />
        );

        if (!interactive) {
          return (
            <View key={stars} accessibilityLabel={`${stars} star`}>
              {star}
            </View>
          );
        }

        return (
          <Pressable
            key={stars}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${stars} out of 5`}
            onPress={() => onChange(stars)}
            hitSlop={6}
          >
            {star}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
