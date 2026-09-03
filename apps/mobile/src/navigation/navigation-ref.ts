import { createNavigationContainerRef } from '@react-navigation/native';
import type { AppStackParamList, RootStackParamList } from '@/navigation/types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateInApp<Name extends keyof AppStackParamList>(
  screen: Name,
  params?: AppStackParamList[Name],
): void {
  if (!navigationRef.isReady()) {
    return;
  }

  navigationRef.navigate('App', {
    screen,
    params,
  } as never);
}
