import { I18nManager } from 'react-native';
import { isRtlLocale, type Locale } from '@/i18n/locale.types';

export function applyRtl(locale: Locale): boolean {
  const shouldBeRtl = isRtlLocale(locale);
  I18nManager.allowRTL(true);
  I18nManager.swapLeftAndRightInRTL(true);

  if (I18nManager.isRTL === shouldBeRtl) {
    return false;
  }

  I18nManager.forceRTL(shouldBeRtl);
  return true;
}
