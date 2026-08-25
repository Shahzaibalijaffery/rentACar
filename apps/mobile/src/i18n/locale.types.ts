export const LOCALES = ['en', 'ur'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_META: Record<
  Locale,
  { nativeLabel: string; englishLabel: string; rtl: boolean; intlTag: string }
> = {
  en: {
    nativeLabel: 'English',
    englishLabel: 'English',
    rtl: false,
    intlTag: 'en-PK',
  },
  ur: {
    nativeLabel: 'اردو',
    englishLabel: 'Urdu',
    rtl: true,
    intlTag: 'ur-PK',
  },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function isRtlLocale(locale: Locale): boolean {
  return LOCALE_META[locale].rtl;
}

export function getIntlTag(locale: Locale): string {
  return LOCALE_META[locale].intlTag;
}

export function detectDeviceLocale(): Locale {
  const tag = Intl.DateTimeFormat().resolvedOptions().locale ?? DEFAULT_LOCALE;
  if (tag.toLowerCase().startsWith('ur')) {
    return 'ur';
  }
  return DEFAULT_LOCALE;
}
