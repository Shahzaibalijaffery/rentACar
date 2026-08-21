import { colors } from './colors';
import { radii } from './radii';
import { spacing } from './spacing';
import { typography } from './typography';

export const theme = {
  colors,
  spacing,
  typography,
  radii,
} as const;

export type Theme = typeof theme;

export { colors, radii, spacing, typography };
