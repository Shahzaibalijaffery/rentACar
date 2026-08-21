import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import {
  readCurrentDeviceLocation,
  requestAndroidLocationPermission,
  type DeviceLocation,
} from '@/services/location-service';

export type { DeviceLocation } from '@/services/location-service';
export type LocationPermissionState = 'unknown' | 'granted' | 'denied';

export function useDeviceLocation() {
  const [location, setLocation] = useState<DeviceLocation | null>(null);
  const [permissionState, setPermissionState] = useState<LocationPermissionState>('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (Platform.OS === 'android') {
        const granted = await requestAndroidLocationPermission();
        if (!granted) {
          setPermissionState('denied');
          setErrorMessage('Location permission was denied.');
          return;
        }
      }

      const coords = await readCurrentDeviceLocation();
      setLocation(coords);
      setPermissionState('granted');
    } catch (error) {
      setPermissionState('denied');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not determine your location. You can enter coordinates manually.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setManualLocation = useCallback((coords: DeviceLocation | null) => {
    setLocation(coords);
    if (coords) {
      setPermissionState('granted');
      setErrorMessage(null);
    }
  }, []);

  return {
    location,
    permissionState,
    isLoading,
    errorMessage,
    requestLocation,
    setManualLocation,
  };
}

export default useDeviceLocation;
