import { I18nManager, Pressable, StatusBar, StyleSheet, View } from 'react-native';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { spacing, useAppModeTheme } from '@/theme';

const HEADER_HEIGHT = 44;

export function CompactHeader({ navigation, options, back }: NativeStackHeaderProps) {
  const { t } = useTranslation('nav');
  const theme = useAppModeTheme();
  const tintColor = options.headerTintColor ?? theme.headerTint;
  const canGoBack = Boolean(back) && options.headerBackVisible !== false;
  const title =
    typeof options.headerTitle === 'string' ? options.headerTitle : (options.title ?? '');

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.headerBg,
          borderBottomColor: theme.headerBorder,
        },
      ]}
    >
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.headerBg} />
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
        <AppText
          variant="subtitle"
          numberOfLines={1}
          style={[styles.title, { color: theme.headerTitle }]}
        >
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
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  },
});
