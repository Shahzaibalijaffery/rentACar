import { Injectable, Logger } from '@nestjs/common';
import { VehicleAvailability, VehicleStatus } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { kmToMeters, toGeoJsonPoint } from '../../common/utils/location.util';
import {
  USER_COLLECTION,
  VEHICLE_COLLECTION,
  VEHICLE_LOCATION_INDEX,
  VEHICLE_PHOTO_COLLECTION,
} from './discovery.constants';
import type { RawDiscoveryVehicle } from './discovery.mapper';

export type DiscoverNearbyInput = {
  latitude: number;
  longitude: number;
  radiusKm: number;
  page: number;
  pageSize: number;
  make?: string;
  model?: string;
  availability: VehicleAvailability;
  excludeOwnerId?: string;
};

type FacetAggregateResult = {
  data?: RawDiscoveryVehicle[];
  meta?: { total: number }[];
}[];

@Injectable()
export class DiscoveryRepository {
  private readonly logger = new Logger(DiscoveryRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async ensureGeoSpatialIndex(): Promise<void> {
    try {
      await this.prisma.$runCommandRaw({
        createIndexes: VEHICLE_COLLECTION,
        indexes: [
          {
            key: { location: '2dsphere' },
            name: VEHICLE_LOCATION_INDEX,
          },
        ],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('already exists') || message.includes('IndexOptionsConflict')) {
        return;
      }
      this.logger.warn('Could not ensure geospatial index', error);
      throw error;
    }
  }

  async backfillVehicleLocations(): Promise<void> {
    const vehicles = await this.prisma.vehicle.findMany({
      select: { id: true, latitude: true, longitude: true, location: true },
      take: 200,
    });

    const missing = vehicles.filter((vehicle) => vehicle.location === null);

    if (missing.length === 0) {
      return;
    }

    await Promise.all(
      missing.map((vehicle) =>
        this.prisma.vehicle.update({
          where: { id: vehicle.id },
          data: { location: toGeoJsonPoint(vehicle.latitude, vehicle.longitude) },
        }),
      ),
    );

    this.logger.log(`Backfilled GeoJSON location for ${missing.length} vehicles`);
  }

  private isMissingGeoIndexError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes('IndexNotFound') || message.includes('2dsphere index');
  }

  private async runDiscoverNearbyPipeline(input: DiscoverNearbyInput): Promise<{
    items: RawDiscoveryVehicle[];
    total: number;
  }> {
    const skip = (input.page - 1) * input.pageSize;
    const maxDistance = kmToMeters(input.radiusKm);

    const geoQuery: Record<string, unknown> = {
      status: VehicleStatus.ACTIVE,
      availability: input.availability,
      location: { $exists: true, $ne: null },
      $or: [{ activeRentalId: null }, { activeRentalId: { $exists: false } }],
    };

    if (input.excludeOwnerId) {
      geoQuery['ownerId'] = { $ne: { $oid: input.excludeOwnerId } };
    }

    const postGeoMatch: Record<string, unknown> = {};
    if (input.make?.trim()) {
      postGeoMatch['make'] = { $regex: input.make.trim(), $options: 'i' };
    }
    if (input.model?.trim()) {
      postGeoMatch['model'] = { $regex: input.model.trim(), $options: 'i' };
    }

    const pipeline: Record<string, unknown>[] = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [input.longitude, input.latitude],
          },
          distanceField: 'distanceMeters',
          maxDistance,
          spherical: true,
          query: geoQuery,
        },
      },
    ];

    if (Object.keys(postGeoMatch).length > 0) {
      pipeline.push({ $match: postGeoMatch });
    }

    pipeline.push(
      {
        $lookup: {
          from: VEHICLE_PHOTO_COLLECTION,
          localField: '_id',
          foreignField: 'vehicleId',
          as: 'photos',
        },
      },
      {
        $lookup: {
          from: USER_COLLECTION,
          localField: 'ownerId',
          foreignField: '_id',
          as: 'ownerDocs',
        },
      },
      { $unwind: '$ownerDocs' },
      {
        $project: {
          make: 1,
          model: 1,
          year: 1,
          color: 1,
          availability: 1,
          areaLabel: 1,
          distanceMeters: 1,
          photos: {
            $map: {
              input: '$photos',
              as: 'photo',
              in: {
                _id: '$$photo._id',
                url: '$$photo.url',
                mimeType: '$$photo.mimeType',
                sortOrder: '$$photo.sortOrder',
              },
            },
          },
          owner: {
            _id: '$ownerDocs._id',
            fullName: '$ownerDocs.fullName',
            profilePhotoUrl: '$ownerDocs.profilePhotoUrl',
          },
        },
      },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: input.pageSize }],
          meta: [{ $count: 'total' }],
        },
      },
    );

    const result = (await this.prisma.vehicle.aggregateRaw({
      pipeline: pipeline as never,
    })) as unknown as FacetAggregateResult;

    const facet = result[0];
    const items = facet?.data ?? [];
    const total = facet?.meta?.[0]?.total ?? 0;

    return { items, total };
  }

  async discoverNearby(input: DiscoverNearbyInput): Promise<{
    items: RawDiscoveryVehicle[];
    total: number;
  }> {
    await this.ensureGeoSpatialIndex();

    try {
      return await this.runDiscoverNearbyPipeline(input);
    } catch (error) {
      if (!this.isMissingGeoIndexError(error)) {
        throw error;
      }

      this.logger.warn('Geospatial index missing during discovery; recreating index and retrying');
      await this.ensureGeoSpatialIndex();
      await this.backfillVehicleLocations();
      return this.runDiscoverNearbyPipeline(input);
    }
  }
}
