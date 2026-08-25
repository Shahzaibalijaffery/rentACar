import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/app-text';
import { useLocale } from '@/i18n/use-locale';
import { LOCALES, LOCALE_META } from '@/i18n/locale.types';
import { colors, radii, spacing } from '@/theme';

type LanguageSwitcherProps = {
  compact?: boolean;
};

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();

  return (
    <View style={styles.container}>
      {compact ? null : (
        <>
          <AppText variant="label">{t('language')}</AppText>
          <AppText variant="caption" style={styles.hint}>
            {t('languageHint')}
          </AppText>
        </>
      )}
      <View style={styles.track}>
        {LOCALES.map((option) => {
          const selected = option === locale;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                void setLocale(option);
              }}
              style={[styles.segment, selected ? styles.segmentSelected : null]}
            >
              <AppText
                variant="subtitle"
                style={[styles.segmentText, selected ? styles.segmentTextSelected : null]}
              >
                {LOCALE_META[option].nativeLabel}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  hint: {
    color: colors.textSecondary,
  },
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.full,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  segmentSelected: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    color: colors.textSecondary,
  },
  segmentTextSelected: {
    color: colors.textOnPrimary,
  },
});
