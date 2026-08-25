import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { loadSavedLocale, saveLocale } from '@/i18n/locale-storage';
import {
  DEFAULT_LOCALE,
  detectDeviceLocale,
  resolveLocale,
  type Locale,
} from '@/i18n/locale.types';
import { NAMESPACES, resources } from '@/i18n/resources';
import { applyRtl } from '@/i18n/rtl';

void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: Object.keys(resources),
  ns: [...NAMESPACES],
  defaultNS: 'common',
  fallbackNS: 'common',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export async function bootstrapI18n(): Promise<Locale> {
  const saved = await loadSavedLocale();
  const locale = saved ?? detectDeviceLocale();
  applyRtl(locale);
  await i18n.changeLanguage(locale);
  return locale;
}

export async function changeAppLocale(next: Locale): Promise<{ needsRestart: boolean }> {
  const locale = resolveLocale(next);
  const needsRestart = applyRtl(locale);
  await saveLocale(locale);
  await i18n.changeLanguage(locale);
  return { needsRestart };
}

export function getCurrentLocale(): Locale {
  return resolveLocale(i18n.language);
}

export { i18n };
export default i18n;
