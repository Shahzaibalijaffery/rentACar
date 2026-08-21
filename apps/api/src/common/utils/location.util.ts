import { DomainError } from '../errors/domain.error';

const MIN_LAT = -90;
const MAX_LAT = 90;
const MIN_LNG = -180;
const MAX_LNG = 180;
const MIN_YEAR = 1980;
const MAX_YEAR = new Date().getFullYear() + 1;

export function roundCoordinate(value: number, precision = 3): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function validateCoordinates(
  latitude: number,
  longitude: number,
): {
  latitude: number;
  longitude: number;
} {
  if (latitude < MIN_LAT || latitude > MAX_LAT) {
    throw new DomainError('Latitude must be between -90 and 90', 'INVALID_LOCATION', 400);
  }

  if (longitude < MIN_LNG || longitude > MAX_LNG) {
    throw new DomainError('Longitude must be between -180 and 180', 'INVALID_LOCATION', 400);
  }

  return {
    latitude: roundCoordinate(latitude),
    longitude: roundCoordinate(longitude),
  };
}

export function validateVehicleYear(year: number): number {
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    throw new DomainError(
      `Vehicle year must be between ${MIN_YEAR} and ${MAX_YEAR}`,
      'INVALID_VEHICLE_YEAR',
      400,
    );
  }

  return year;
}

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export function encodeGeohash(latitude: number, longitude: number, precision = 7): string {
  let latMin = MIN_LAT;
  let latMax = MAX_LAT;
  let lngMin = MIN_LNG;
  let lngMax = MAX_LNG;
  let hash = '';
  let bit = 0;
  let ch = 0;
  let isLng = true;

  while (hash.length < precision) {
    const mid = isLng ? (lngMin + lngMax) / 2 : (latMin + latMax) / 2;
    const value = isLng ? longitude : latitude;

    if (value >= mid) {
      ch = (ch << 1) + 1;
      if (isLng) {
        lngMin = mid;
      } else {
        latMin = mid;
      }
    } else {
      ch <<= 1;
      if (isLng) {
        lngMax = mid;
      } else {
        latMax = mid;
      }
    }

    isLng = !isLng;
    bit++;

    if (bit === 5) {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return hash;
}

export type GeoJsonPoint = {
  type: 'Point';
  coordinates: [number, number];
};

export function toGeoJsonPoint(latitude: number, longitude: number): GeoJsonPoint {
  return {
    type: 'Point',
    coordinates: [longitude, latitude],
  };
}

const DEFAULT_SEARCH_RADIUS_KM = 10;
const MIN_SEARCH_RADIUS_KM = 1;
const MAX_SEARCH_RADIUS_KM = 100;

export function validateSearchRadiusKm(radiusKm: number): number {
  if (
    Number.isNaN(radiusKm) ||
    radiusKm < MIN_SEARCH_RADIUS_KM ||
    radiusKm > MAX_SEARCH_RADIUS_KM
  ) {
    throw new DomainError(
      `Search radius must be between ${MIN_SEARCH_RADIUS_KM} and ${MAX_SEARCH_RADIUS_KM} km`,
      'INVALID_SEARCH_RADIUS',
      400,
    );
  }

  return radiusKm;
}

export function resolveSearchRadiusKm(radiusKm?: number): number {
  if (radiusKm === undefined) {
    return DEFAULT_SEARCH_RADIUS_KM;
  }

  return validateSearchRadiusKm(radiusKm);
}

export function kmToMeters(radiusKm: number): number {
  return Math.round(radiusKm * 1000);
}

export function formatDistanceLabel(distanceMeters: number): string {
  const meters = Math.max(0, Math.round(distanceMeters));

  if (meters < 1000) {
    return `${meters} m away`;
  }

  const kilometers = meters / 1000;
  const formatted =
    kilometers < 10 ? kilometers.toFixed(1).replace(/\.0$/, '') : Math.round(kilometers).toString();

  return `${formatted} km away`;
}
