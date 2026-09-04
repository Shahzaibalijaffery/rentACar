import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { radii, spacing, useAppModeTheme } from '@/theme';

export function ModeWorkspaceBanner() {
  const { t } = useTranslation('home');
  const theme = useAppModeTheme();
  const isOwner = theme.mode === 'owner';

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: theme.accentMuted, borderColor: theme.accent },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: theme.heroBg }]}>
        <AppIcon name={theme.icon} size={16} color={theme.heroText} />
      </View>
      <View style={styles.copy}>
        <AppText variant="label" style={{ color: theme.accent }}>
          {isOwner ? t('ownerWorkspace') : t('renterWorkspace')}
        </AppText>
        <AppText variant="caption" style={{ color: theme.accent }}>
          {isOwner ? t('ownerRentalsBanner') : t('renterRentalsBanner')}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});
