import { StyleSheet, View } from 'react-native';
import { getUserPlanLabel, resolveUserPlan, type UserPlan } from '@rentacar/shared';
import { AppText } from '@/components/app-text';
import { colors, radii, spacing } from '@/theme';

type PlanBadgeProps = {
  plan?: UserPlan | null;
  onPrimary?: boolean;
};

const planColors: Record<UserPlan, { bg: string; text: string }> = {
  FREE: { bg: colors.surfaceMuted, text: colors.text },
  LITE: { bg: colors.primaryMuted, text: colors.primary },
  PRO: { bg: colors.primaryMuted, text: colors.primaryDark },
  BUSINESS: { bg: colors.warningMuted, text: colors.warning },
};

export function PlanBadge({ plan, onPrimary = false }: PlanBadgeProps) {
  const resolved = resolveUserPlan(plan);
  const palette = onPrimary
    ? { bg: 'rgba(255, 255, 255, 0.22)', text: colors.textOnPrimary }
    : planColors[resolved];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <AppText variant="label" style={[styles.label, { color: palette.text }]}>
        {getUserPlanLabel(resolved)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
