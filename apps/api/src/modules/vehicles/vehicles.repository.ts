import { Injectable } from '@nestjs/common';
import { Prisma, VehicleAvailability, VehicleStatus } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { toGeoJsonPoint } from '../../common/utils/location.util';

export type VehicleRecord = Prisma.VehicleGetPayload<{
  include: { photos: true };
}>;

export type VehiclePublicRecord = Prisma.VehicleGetPayload<{
  include: {
    photos: true;
    owner: {
      select: {
        id: true;
        fullName: true;
        profilePhotoUrl: true;
      };
    };
  };
}>;

@Injectable()
export class VehiclesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    ownerId: string;
    make: string;
    model: string;
    year: number;
    color: string;
    latitude: number;
    longitude: number;
    geohash: string;
    areaLabel?: string | null;
  }): Promise<VehicleRecord> {
    return this.prisma.vehicle.create({
      data: {
        ownerId: data.ownerId,
        make: data.make.trim(),
        model: data.model.trim(),
        year: data.year,
        color: data.color.trim(),
        latitude: data.latitude,
        longitude: data.longitude,
        location: toGeoJsonPoint(data.latitude, data.longitude),
        geohash: data.geohash,
        areaLabel: data.areaLabel?.trim() ?? null,
      },
      include: { photos: true },
    });
  }

  findById(id: string): Promise<VehicleRecord | null> {
    return this.prisma.vehicle.findUnique({
      where: { id },
      include: { photos: true },
    });
  }

  findPublicById(id: string): Promise<VehiclePublicRecord | null> {
    return this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        photos: true,
        owner: {
          select: {
            id: true,
            fullName: true,
            profilePhotoUrl: true,
          },
        },
      },
    });
  }

  findPublicByOwner(ownerId: string): Promise<VehiclePublicRecord[]> {
    return this.prisma.vehicle.findMany({
      where: {
        ownerId,
        status: VehicleStatus.ACTIVE,
      },
      include: {
        photos: true,
        owner: {
          select: {
            id: true,
            fullName: true,
            profilePhotoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByOwner(ownerId: string, includeArchived: boolean): Promise<VehicleRecord[]> {
    return this.prisma.vehicle.findMany({
      where: {
        ownerId,
        ...(includeArchived ? {} : { status: VehicleStatus.ACTIVE }),
      },
      include: { photos: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  update(
    id: string,
    data: Partial<{
      make: string;
      model: string;
      year: number;
      color: string;
      latitude: number;
      longitude: number;
      geohash: string;
      areaLabel: string | null;
      availability: VehicleAvailability;
      status: VehicleStatus;
    }>,
  ): Promise<VehicleRecord> {
    const updateData: Prisma.VehicleUpdateInput = { ...data };

    if (data.latitude !== undefined && data.longitude !== undefined) {
      updateData.location = toGeoJsonPoint(data.latitude, data.longitude);
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: updateData,
      include: { photos: true },
    });
  }

  addPhoto(data: {
    vehicleId: string;
    storageKey: string;
    url: string;
    mimeType: string;
    sizeBytes: number;
    sortOrder: number;
  }) {
    return this.prisma.vehiclePhoto.create({ data });
  }

  findPhoto(photoId: string) {
    return this.prisma.vehiclePhoto.findUnique({ where: { id: photoId } });
  }

  deletePhoto(photoId: string) {
    return this.prisma.vehiclePhoto.delete({ where: { id: photoId } });
  }

  countPhotos(vehicleId: string): Promise<number> {
    return this.prisma.vehiclePhoto.count({ where: { vehicleId } });
  }

  countActiveByOwner(ownerId: string): Promise<number> {
    return this.prisma.vehicle.count({
      where: {
        ownerId,
        status: VehicleStatus.ACTIVE,
      },
    });
  }
}
