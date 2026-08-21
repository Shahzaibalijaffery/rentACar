import { Injectable } from '@nestjs/common';
import type { ApiResponse, VehicleOwnerView, VehiclePublicView } from '@rentacar/shared';
import { DomainError } from '../../common/errors/domain.error';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  buildStorageKey,
} from '../../common/storage/image-upload.constants';
import { StorageService } from '../../common/storage/storage.service';
import {
  encodeGeohash,
  validateCoordinates,
  validateVehicleYear,
} from '../../common/utils/location.util';
import { toVehicleOwnerView, toVehiclePublicView } from './vehicle.mapper';
import { VehiclesRepository } from './vehicles.repository';
import {
  CreateVehicleDto,
  UpdateVehicleAvailabilityDto,
  UpdateVehicleDto,
} from './dto/vehicle.dto';

const MAX_PHOTOS_PER_VEHICLE = 8;

@Injectable()
export class VehiclesService {
  constructor(
    private readonly vehiclesRepository: VehiclesRepository,
    private readonly storageService: StorageService,
  ) {}

  async createVehicle(
    ownerId: string,
    dto: CreateVehicleDto,
  ): Promise<ApiResponse<VehicleOwnerView>> {
    const year = validateVehicleYear(dto.year);
    const { latitude, longitude } = validateCoordinates(dto.latitude, dto.longitude);

    const vehicle = await this.vehiclesRepository.create({
      ownerId,
      make: dto.make,
      model: dto.model,
      year,
      color: dto.color,
      latitude,
      longitude,
      geohash: encodeGeohash(latitude, longitude),
      ...(dto.areaLabel !== undefined ? { areaLabel: dto.areaLabel } : {}),
    });

    return { data: toVehicleOwnerView(vehicle) };
  }

  async listMyVehicles(
    ownerId: string,
    includeArchived = false,
  ): Promise<ApiResponse<VehicleOwnerView[]>> {
    const vehicles = await this.vehiclesRepository.findByOwner(ownerId, includeArchived);
    return { data: vehicles.map(toVehicleOwnerView) };
  }

  async getMyVehicle(ownerId: string, vehicleId: string): Promise<ApiResponse<VehicleOwnerView>> {
    const vehicle = await this.getOwnedVehicleOrThrow(ownerId, vehicleId);
    return { data: toVehicleOwnerView(vehicle) };
  }

  async getPublicVehicle(vehicleId: string): Promise<ApiResponse<VehiclePublicView>> {
    const vehicle = await this.vehiclesRepository.findPublicById(vehicleId);
    if (vehicle?.status !== 'ACTIVE') {
      throw new DomainError('Vehicle not found', 'VEHICLE_NOT_FOUND', 404);
    }

    return { data: toVehiclePublicView(vehicle) };
  }

  async updateVehicle(
    ownerId: string,
    vehicleId: string,
    dto: UpdateVehicleDto,
  ): Promise<ApiResponse<VehicleOwnerView>> {
    await this.getOwnedVehicleOrThrow(ownerId, vehicleId);

    const updateData: Parameters<VehiclesRepository['update']>[1] = {};

    if (dto.make !== undefined) updateData.make = dto.make.trim();
    if (dto.model !== undefined) updateData.model = dto.model.trim();
    if (dto.year !== undefined) updateData.year = validateVehicleYear(dto.year);
    if (dto.color !== undefined) updateData.color = dto.color.trim();
    if (dto.areaLabel !== undefined) updateData.areaLabel = dto.areaLabel?.trim() ?? null;

    if (dto.latitude !== undefined || dto.longitude !== undefined) {
      const current = await this.vehiclesRepository.findById(vehicleId);
      if (!current) {
        throw new DomainError('Vehicle not found', 'VEHICLE_NOT_FOUND', 404);
      }

      const { latitude, longitude } = validateCoordinates(
        dto.latitude ?? current.latitude,
        dto.longitude ?? current.longitude,
      );
      updateData.latitude = latitude;
      updateData.longitude = longitude;
      updateData.geohash = encodeGeohash(latitude, longitude);
    }

    if (Object.keys(updateData).length === 0) {
      throw new DomainError('No vehicle fields provided', 'VALIDATION_ERROR', 400);
    }

    const vehicle = await this.vehiclesRepository.update(vehicleId, updateData);
    return { data: toVehicleOwnerView(vehicle) };
  }

  async archiveVehicle(
    ownerId: string,
    vehicleId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    await this.getOwnedVehicleOrThrow(ownerId, vehicleId);
    await this.vehiclesRepository.update(vehicleId, {
      status: 'ARCHIVED',
      availability: 'UNAVAILABLE',
    });
    return { data: { message: 'Vehicle archived successfully' } };
  }

  async updateAvailability(
    ownerId: string,
    vehicleId: string,
    dto: UpdateVehicleAvailabilityDto,
  ): Promise<ApiResponse<VehicleOwnerView>> {
    const vehicle = await this.getOwnedVehicleOrThrow(ownerId, vehicleId);
    if (vehicle.status !== 'ACTIVE') {
      throw new DomainError(
        'Archived vehicles cannot change availability',
        'VEHICLE_ARCHIVED',
        409,
      );
    }

    const updated = await this.vehiclesRepository.update(vehicleId, {
      availability: dto.availability,
    });

    return { data: toVehicleOwnerView(updated) };
  }

  async addPhoto(
    ownerId: string,
    vehicleId: string,
    file: Express.Multer.File,
  ): Promise<ApiResponse<VehicleOwnerView>> {
    const vehicle = await this.getOwnedVehicleOrThrow(ownerId, vehicleId);
    if (vehicle.status !== 'ACTIVE') {
      throw new DomainError('Cannot add photos to archived vehicle', 'VEHICLE_ARCHIVED', 409);
    }

    this.validateUploadedImage(file);

    const photoCount = await this.vehiclesRepository.countPhotos(vehicleId);
    if (photoCount >= MAX_PHOTOS_PER_VEHICLE) {
      throw new DomainError('Maximum photos limit reached', 'PHOTO_LIMIT_REACHED', 409);
    }

    const storageKey = buildStorageKey(`vehicles/${vehicleId}`, file.mimetype);
    const stored = await this.storageService.saveObject({
      buffer: file.buffer,
      mimeType: file.mimetype,
      storageKey,
    });

    await this.vehiclesRepository.addPhoto({
      vehicleId,
      storageKey: stored.storageKey,
      url: stored.url,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      sortOrder: photoCount,
    });

    const updated = await this.vehiclesRepository.findById(vehicleId);
    if (!updated) {
      throw new DomainError('Vehicle not found', 'VEHICLE_NOT_FOUND', 404);
    }

    return { data: toVehicleOwnerView(updated) };
  }

  async deletePhoto(
    ownerId: string,
    vehicleId: string,
    photoId: string,
  ): Promise<ApiResponse<VehicleOwnerView>> {
    await this.getOwnedVehicleOrThrow(ownerId, vehicleId);

    const photo = await this.vehiclesRepository.findPhoto(photoId);
    if (photo?.vehicleId !== vehicleId) {
      throw new DomainError('Photo not found', 'PHOTO_NOT_FOUND', 404);
    }

    await this.storageService.deleteObject(photo.storageKey);
    await this.vehiclesRepository.deletePhoto(photoId);

    const updated = await this.vehiclesRepository.findById(vehicleId);
    if (!updated) {
      throw new DomainError('Vehicle not found', 'VEHICLE_NOT_FOUND', 404);
    }

    return { data: toVehicleOwnerView(updated) };
  }

  private async getOwnedVehicleOrThrow(ownerId: string, vehicleId: string) {
    const vehicle = await this.vehiclesRepository.findById(vehicleId);
    if (!vehicle) {
      throw new DomainError('Vehicle not found', 'VEHICLE_NOT_FOUND', 404);
    }

    if (vehicle.ownerId !== ownerId) {
      throw new DomainError('You do not have access to this vehicle', 'VEHICLE_FORBIDDEN', 403);
    }

    return vehicle;
  }

  private validateUploadedImage(file: Express.Multer.File): void {
    if (!file) {
      throw new DomainError('Photo file is required', 'VALIDATION_ERROR', 400);
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      throw new DomainError('Invalid image type', 'INVALID_IMAGE_TYPE', 400);
    }

    if (file.size <= 0 || file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new DomainError('Invalid image size', 'INVALID_IMAGE_SIZE', 400);
    }
  }
}
