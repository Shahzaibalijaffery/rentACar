import { colors } from './colors';
import { radii } from './radii';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

export const theme = {
  colors,
  spacing,
  typography,
  radii,
  shadows,
} as const;

export type Theme = typeof theme;

export { colors, radii, shadows, spacing, typography };
export { appModeThemes, getAppModeTheme, useAppModeTheme } from './app-mode-theme';
export type { AppModeTheme } from './app-mode-theme';
