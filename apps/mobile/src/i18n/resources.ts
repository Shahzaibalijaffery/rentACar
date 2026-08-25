import commonEn from '@/i18n/locales/en/common.json';
import authEn from '@/i18n/locales/en/auth.json';
import homeEn from '@/i18n/locales/en/home.json';
import navEn from '@/i18n/locales/en/nav.json';
import profileEn from '@/i18n/locales/en/profile.json';
import rentalsEn from '@/i18n/locales/en/rentals.json';
import ratingsEn from '@/i18n/locales/en/ratings.json';
import discoveryEn from '@/i18n/locales/en/discovery.json';
import usersEn from '@/i18n/locales/en/users.json';
import vehiclesEn from '@/i18n/locales/en/vehicles.json';
import agreementsEn from '@/i18n/locales/en/agreements.json';
import handoversEn from '@/i18n/locales/en/handovers.json';
import notificationsEn from '@/i18n/locales/en/notifications.json';
import commonUr from '@/i18n/locales/ur/common.json';
import authUr from '@/i18n/locales/ur/auth.json';
import homeUr from '@/i18n/locales/ur/home.json';
import navUr from '@/i18n/locales/ur/nav.json';
import profileUr from '@/i18n/locales/ur/profile.json';
import rentalsUr from '@/i18n/locales/ur/rentals.json';
import ratingsUr from '@/i18n/locales/ur/ratings.json';
import discoveryUr from '@/i18n/locales/ur/discovery.json';
import usersUr from '@/i18n/locales/ur/users.json';
import vehiclesUr from '@/i18n/locales/ur/vehicles.json';
import agreementsUr from '@/i18n/locales/ur/agreements.json';
import handoversUr from '@/i18n/locales/ur/handovers.json';
import notificationsUr from '@/i18n/locales/ur/notifications.json';

/** Add a key to the matching en/*.json and ur/*.json files, then call t('ns:key'). */
export const NAMESPACES = [
  'common',
  'auth',
  'home',
  'nav',
  'profile',
  'rentals',
  'ratings',
  'discovery',
  'users',
  'vehicles',
  'agreements',
  'handovers',
  'notifications',
] as const;

export type TranslationNamespace = (typeof NAMESPACES)[number];

const en = {
  common: commonEn,
  auth: authEn,
  home: homeEn,
  nav: navEn,
  profile: profileEn,
  rentals: rentalsEn,
  ratings: ratingsEn,
  discovery: discoveryEn,
  users: usersEn,
  vehicles: vehiclesEn,
  agreements: agreementsEn,
  handovers: handoversEn,
  notifications: notificationsEn,
};

export type TranslationResources = typeof en;

export const resources = {
  en,
  ur: {
    common: commonUr,
    auth: authUr,
    home: homeUr,
    nav: navUr,
    profile: profileUr,
    rentals: rentalsUr,
    ratings: ratingsUr,
    discovery: discoveryUr,
    users: usersUr,
    vehicles: vehiclesUr,
    agreements: agreementsUr,
    handovers: handoversUr,
    notifications: notificationsUr,
  },
} as const;
