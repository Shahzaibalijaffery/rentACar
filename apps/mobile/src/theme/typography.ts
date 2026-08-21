import { TextStyle } from 'react-native';

export const typography = {
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
} as const satisfies Record<string, TextStyle>;

export type Typography = typeof typography;
