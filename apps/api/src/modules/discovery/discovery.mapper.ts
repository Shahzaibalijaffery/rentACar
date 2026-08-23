import { toRatingSummary, type VehicleDiscoveryItem, type VehiclePhoto } from '@rentacar/shared';
import { formatDistanceLabel } from '../../common/utils/location.util';

type RawPhoto = {
  _id?: { $oid: string } | string;
  id?: string;
  url: string;
  mimeType: string;
  sortOrder: number;
};

type RawOwner = {
  _id?: { $oid: string } | string;
  id?: string;
  fullName: string;
  profilePhotoUrl: string | null;
  email?: string;
  cnic?: string;
  passwordHash?: string;
};

export type RawDiscoveryVehicle = {
  _id?: { $oid: string } | string;
  id?: string;
  make: string;
  model: string;
  year: number;
  color: string;
  availability: VehicleDiscoveryItem['availability'];
  areaLabel: string | null;
  distanceMeters: number;
  photos?: RawPhoto[];
  owner: RawOwner;
  latitude?: number;
  longitude?: number;
  email?: string;
  cnic?: string;
  ratingAverage?: number | null;
  ratingCount?: number | null;
};

function extractId(value: { $oid: string } | string | undefined, fallback?: string): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object' && '$oid' in value) {
    return value.$oid;
  }

  return fallback ?? '';
}

function toPhoto(photo: RawPhoto): VehiclePhoto {
  return {
    id: extractId(photo._id, photo.id),
    url: photo.url,
    mimeType: photo.mimeType,
    sortOrder: photo.sortOrder,
  };
}

export function toVehicleDiscoveryItem(raw: RawDiscoveryVehicle): VehicleDiscoveryItem {
  const distanceMeters = Math.round(raw.distanceMeters);

  return {
    id: extractId(raw._id, raw.id),
    make: raw.make,
    model: raw.model,
    year: raw.year,
    color: raw.color,
    availability: raw.availability,
    areaLabel: raw.areaLabel,
    photos: (raw.photos ?? []).map(toPhoto).sort((a, b) => a.sortOrder - b.sortOrder),
    rating: toRatingSummary(raw.ratingAverage, raw.ratingCount),
    distanceMeters,
    distanceLabel: formatDistanceLabel(distanceMeters),
    owner: {
      id: extractId(raw.owner._id, raw.owner.id),
      fullName: raw.owner.fullName,
      profilePhotoUrl: raw.owner.profilePhotoUrl,
    },
  };
}

export function assertDiscoveryItemIsPublicSafe(item: VehicleDiscoveryItem): void {
  const forbiddenKeys = ['email', 'cnic', 'passwordHash', 'latitude', 'longitude'];
  const serialized = JSON.stringify(item);

  for (const key of forbiddenKeys) {
    if (serialized.includes(`"${key}"`)) {
      throw new Error(`Discovery item contains forbidden field: ${key}`);
    }
  }
}
