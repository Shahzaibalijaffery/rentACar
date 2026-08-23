import { Platform, ViewStyle } from 'react-native';

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

export const shadows = {
  sm: Platform.select<ShadowStyle>({
    ios: {
      shadowColor: '#1C1612',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
    },
    android: { elevation: 2 },
    default: {},
  })!,
  md: Platform.select<ShadowStyle>({
    ios: {
      shadowColor: '#1C1612',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
    },
    android: { elevation: 4 },
    default: {},
  })!,
} as const;

export type Shadows = typeof shadows;
