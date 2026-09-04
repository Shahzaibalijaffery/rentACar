import type { AppMode } from '@rentacar/shared';
import { useAppModeStore } from '@/stores/app-mode-store';
import { colors } from '@/theme/colors';

export type AppModeTheme = {
  mode: AppMode;
  accent: string;
  accentMuted: string;
  canvas: string;
  headerBg: string;
  headerTint: string;
  headerTitle: string;
  headerBorder: string;
  statusBar: 'light-content' | 'dark-content';
  heroBg: string;
  heroText: string;
  heroMuted: string;
  heroBadgeBg: string;
  icon: 'compass' | 'car';
};

const RENTER_THEME: AppModeTheme = {
  mode: 'renter',
  accent: colors.primary,
  accentMuted: colors.primaryMuted,
  canvas: colors.background,
  headerBg: colors.surface,
  headerTint: colors.primary,
  headerTitle: colors.text,
  headerBorder: colors.border,
  statusBar: 'dark-content',
  heroBg: colors.primary,
  heroText: colors.textOnPrimary,
  heroMuted: colors.textOnPrimaryMuted,
  heroBadgeBg: 'rgba(255, 255, 255, 0.18)',
  icon: 'compass',
};

const OWNER_THEME: AppModeTheme = {
  mode: 'owner',
  accent: colors.owner,
  accentMuted: colors.ownerMuted,
  canvas: colors.ownerCanvas,
  headerBg: colors.owner,
  headerTint: colors.textOnPrimary,
  headerTitle: colors.textOnPrimary,
  headerBorder: colors.ownerDark,
  statusBar: 'light-content',
  heroBg: colors.owner,
  heroText: colors.textOnPrimary,
  heroMuted: colors.textOnPrimaryMuted,
  heroBadgeBg: 'rgba(201, 162, 39, 0.28)',
  icon: 'car',
};

export const appModeThemes: Record<AppMode, AppModeTheme> = {
  renter: RENTER_THEME,
  owner: OWNER_THEME,
};

export function getAppModeTheme(mode: AppMode): AppModeTheme {
  return appModeThemes[mode];
}

export function useAppModeTheme(): AppModeTheme {
  const mode = useAppModeStore((state) => state.activeMode);
  return appModeThemes[mode];
}
