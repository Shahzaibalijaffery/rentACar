import { PermissionsAndroid, Platform } from 'react-native';

export type DeviceLocation = {
  latitude: number;
  longitude: number;
};

type GeolocationPosition = {
  coords: {
    latitude: number;
    longitude: number;
  };
};

type GeolocationApi = {
  getCurrentPosition: (
    success: (position: GeolocationPosition) => void,
    error?: (error: { message?: string }) => void,
    options?: {
      enableHighAccuracy?: boolean;
      timeout?: number;
      maximumAge?: number;
    },
  ) => void;
};

let cachedGeolocation: GeolocationApi | null | undefined;

function loadGeolocation(): GeolocationApi | null {
  if (cachedGeolocation !== undefined) {
    return cachedGeolocation;
  }

  try {
    // Lazy require so the discovery screen can load before native linking is complete.
    const module = require('@react-native-community/geolocation') as {
      default?: GeolocationApi;
    };
    cachedGeolocation = module.default ?? null;
  } catch {
    cachedGeolocation = null;
  }

  return cachedGeolocation;
}

export async function requestAndroidLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const permission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  if (!permission) {
    return false;
  }

  const result = await PermissionsAndroid.request(permission, {
    title: 'Location permission',
    message: 'RentACar uses your location to find nearby vehicles available for rent.',
    buttonPositive: 'Allow',
    buttonNegative: 'Not now',
  });

  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export async function readCurrentDeviceLocation(): Promise<DeviceLocation> {
  const geolocation = loadGeolocation();
  if (!geolocation) {
    throw new Error(
      'Location services are unavailable. Rebuild the app after installing geolocation, or enter coordinates manually.',
    );
  }

  return new Promise<DeviceLocation>((resolve, reject) => {
    geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(error.message ?? 'Location unavailable'));
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60_000,
      },
    );
  });
}

export function isGeolocationAvailable(): boolean {
  return loadGeolocation() !== null;
}
