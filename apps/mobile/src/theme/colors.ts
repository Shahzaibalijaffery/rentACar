export const colors = {
  primary: '#0F766E',
  primaryDark: '#115E59',
  primaryLight: '#14B8A6',
  primaryMuted: '#CCFBF1',
  accent: '#F59E0B',
  background: '#F4F6F8',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF2F6',
  /** @deprecated Use surfaceMuted */
  backgroundSecondary: '#EEF2F6',
  text: '#0F172A',
  textSecondary: '#64748B',
  textOnPrimary: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  error: '#DC2626',
  errorMuted: '#FEE2E2',
  success: '#059669',
  successMuted: '#D1FAE5',
  warning: '#D97706',
  warningMuted: '#FEF3C7',
  overlay: 'rgba(15, 23, 42, 0.04)',
} as const;

export type Colors = typeof colors;
