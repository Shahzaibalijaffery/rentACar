export const colors = {
  primary: '#1B4332',
  primaryLight: '#2D6A4F',
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  text: '#212529',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
  error: '#DC3545',
  success: '#198754',
  warning: '#FFC107',
} as const;

export type Colors = typeof colors;
