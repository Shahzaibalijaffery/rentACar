import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { colors, spacing } from '@/theme';

const HEADER_HEIGHT = 44;

export function CompactHeader({ navigation, options, back }: NativeStackHeaderProps) {
  const { t } = useTranslation('nav');
  const tintColor = options.headerTintColor ?? colors.primary;
  const canGoBack = Boolean(back) && options.headerBackVisible !== false;
  const title =
    typeof options.headerTitle === 'string' ? options.headerTitle : (options.title ?? '');

  return (
    <View style={styles.bar}>
      <View style={styles.side}>
        {canGoBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('goBack')}
            hitSlop={8}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <AppIcon
              name={I18nManager.isRTL ? 'chevron-right' : 'chevron-left'}
              size={22}
              color={tintColor}
            />
          </Pressable>
        ) : options.headerLeft ? (
          options.headerLeft({ canGoBack, tintColor, label: back?.title, href: back?.href })
        ) : null}
      </View>
      {typeof options.headerTitle === 'function' ? (
        <View style={styles.title}>
          {options.headerTitle({ children: title, tintColor })}
        </View>
      ) : (
        <AppText variant="subtitle" numberOfLines={1} style={styles.title}>
          {title}
        </AppText>
      )}
      <View style={[styles.side, styles.sideRight]}>
        {options.headerRight
          ? options.headerRight({ canGoBack, tintColor })
          : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    overflow: 'visible',
  },
  side: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
    overflow: 'visible',
  },
  sideRight: {
    width: 48,
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
  },
});
