import { Vehicle, VehiclePhoto, VehicleStatus } from '@prisma/client';
import type {
  VehicleOwnerView,
  VehiclePhoto as SharedVehiclePhoto,
  VehiclePublicView,
} from '@rentacar/shared';

type VehicleWithPhotos = Vehicle & { photos: VehiclePhoto[] };

type VehicleWithPhotosAndOwner = VehicleWithPhotos & {
  owner: {
    id: string;
    fullName: string;
    profilePhotoUrl: string | null;
  };
};

function toPhoto(photo: VehiclePhoto): SharedVehiclePhoto {
  return {
    id: photo.id,
    url: photo.url,
    mimeType: photo.mimeType,
    sortOrder: photo.sortOrder,
  };
}

export function toVehicleOwnerView(vehicle: VehicleWithPhotos): VehicleOwnerView {
  return {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    availability: vehicle.availability,
    status: vehicle.status,
    latitude: vehicle.latitude,
    longitude: vehicle.longitude,
    areaLabel: vehicle.areaLabel,
    photos: vehicle.photos.map(toPhoto).sort((a, b) => a.sortOrder - b.sortOrder),
    createdAt: vehicle.createdAt.toISOString(),
    updatedAt: vehicle.updatedAt.toISOString(),
  };
}

export function toVehiclePublicView(vehicle: VehicleWithPhotosAndOwner): VehiclePublicView {
  return {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    availability: vehicle.availability,
    areaLabel: vehicle.areaLabel,
    photos: vehicle.photos.map(toPhoto).sort((a, b) => a.sortOrder - b.sortOrder),
    owner: {
      id: vehicle.owner.id,
      fullName: vehicle.owner.fullName,
      profilePhotoUrl: vehicle.owner.profilePhotoUrl,
    },
  };
}

export function isVehicleActive(vehicle: Pick<Vehicle, 'status'>): boolean {
  return vehicle.status === VehicleStatus.ACTIVE;
}
