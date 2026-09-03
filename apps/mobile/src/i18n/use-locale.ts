import { useTranslation } from 'react-i18next';
import { changeAppLocale } from '@/i18n';
import { LOCALE_META, resolveLocale, type Locale } from '@/i18n/locale.types';
import { showAppAlert } from '@/stores/app-alert-store';

export function useLocale() {
  const { t, i18n } = useTranslation();
  const locale = resolveLocale(i18n.language);

  const setLocale = async (next: Locale) => {
    const { needsRestart } = await changeAppLocale(next);
    if (needsRestart) {
      showAppAlert(t('restartTitle'), t('restartBody'), [{ text: t('ok') }]);
    }
  };

  return {
    locale,
    isRtl: LOCALE_META[locale].rtl,
    intlTag: LOCALE_META[locale].intlTag,
    setLocale,
  };
}
