import { Injectable, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import type { ApiResponse, HandoverView } from '@rentacar/shared';
import { AppConfig } from '../../config/env.config';
import { DomainError } from '../../common/errors/domain.error';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  buildStorageKey,
  MAX_IMAGE_SIZE_BYTES,
} from '../../common/storage/image-upload.constants';
import { StorageService } from '../../common/storage/storage.service';
import { RentalsRepository } from '../rentals/rentals.repository';
import { HandoverEventsService } from './handover-events.service';
import {
  buildHandoverPhotoContentUrl,
  canTransitionHandover,
  MAX_PICKUP_HANDOVER_PHOTOS,
  MIN_PICKUP_HANDOVER_PHOTOS,
} from './handover.constants';
import { toHandoverView } from './handover.mapper';
import type { HandoverRecord } from './handovers.repository';
import { HandoversRepository } from './handovers.repository';
import { HandoverStatus } from '@prisma/client';

@Injectable()
export class HandoversService {
  constructor(
    private readonly handoversRepository: HandoversRepository,
    private readonly rentalsRepository: RentalsRepository,
    private readonly storageService: StorageService,
    private readonly handoverEventsService: HandoverEventsService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async createPickupHandover(
    ownerId: string,
    rentalId: string,
  ): Promise<ApiResponse<HandoverView>> {
    const rental = await this.rentalsRepository.findById(rentalId);
    if (!rental) {
      throw new DomainError('Rental not found', 'RENTAL_NOT_FOUND', 404);
    }

    if (rental.ownerId !== ownerId) {
      throw new DomainError(
        'Only the vehicle owner can start pickup handover',
        'HANDOVER_FORBIDDEN',
        403,
      );
    }

    let handover: HandoverRecord;
    try {
      handover = await this.handoversRepository.createPickupHandover({
        rentalId,
        ownerId: rental.ownerId,
        renterId: rental.renterId,
        vehicleId: rental.vehicleId,
        actorId: ownerId,
      });
    } catch (error) {
      this.mapRepositoryError(error);
      throw error;
    }

    const view = toHandoverView(handover);
    this.handoverEventsService.emit('HANDOVER_CREATED', this.toEventPayload(handover));
    return { data: view };
  }

  async getHandover(handoverId: string, userId: string): Promise<ApiResponse<HandoverView>> {
    const handover = await this.getParticipantHandoverOrThrow(handoverId, userId);
    return { data: toHandoverView(handover) };
  }

  async getPickupHandoverByRental(
    rentalId: string,
    userId: string,
  ): Promise<ApiResponse<HandoverView>> {
    const rental = await this.rentalsRepository.findById(rentalId);
    if (!rental) {
      throw new DomainError('Rental not found', 'RENTAL_NOT_FOUND', 404);
    }

    if (rental.renterId !== userId && rental.ownerId !== userId) {
      throw new DomainError('You do not have access to this rental', 'RENTAL_FORBIDDEN', 403);
    }

    const handover = await this.handoversRepository.findPickupByRentalId(rentalId);
    if (!handover) {
      throw new DomainError('Pickup handover not found', 'HANDOVER_NOT_FOUND', 404);
    }

    return { data: toHandoverView(handover) };
  }

  async uploadPhoto(
    ownerId: string,
    handoverId: string,
    file: Express.Multer.File,
  ): Promise<ApiResponse<HandoverView>> {
    const handover = await this.getHandoverOrThrow(handoverId);

    if (handover.ownerId !== ownerId) {
      throw new DomainError('Only the owner can upload handover photos', 'HANDOVER_FORBIDDEN', 403);
    }

    if (handover.status !== HandoverStatus.OWNER_PHOTOS_REQUIRED) {
      throw new DomainError(
        'Photos cannot be modified after submission',
        'HANDOVER_NOT_EDITABLE',
        409,
      );
    }

    this.validateUploadedImage(file);

    const photoCount = await this.handoversRepository.countPhotos(handoverId);
    if (photoCount >= MAX_PICKUP_HANDOVER_PHOTOS) {
      throw new DomainError('Maximum handover photos limit reached', 'PHOTO_LIMIT_REACHED', 409);
    }

    const storageKey = buildStorageKey(`handovers/${handoverId}`, file.mimetype);
    const stored = await this.storageService.saveObject({
      buffer: file.buffer,
      mimeType: file.mimetype,
      storageKey,
    });

    const appUrl = this.configService.get('appUrl', { infer: true });

    let updated: HandoverRecord;
    try {
      updated = await this.handoversRepository.addPhoto({
        handoverId,
        storageKey: stored.storageKey,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        sortOrder: photoCount,
        uploadedById: ownerId,
        actorId: ownerId,
        buildPhotoUrl: (photoId) => buildHandoverPhotoContentUrl(appUrl, handoverId, photoId),
      });
    } catch (error) {
      await this.storageService.deleteObject(stored.storageKey);
      this.mapRepositoryError(error);
      throw error;
    }

    this.handoverEventsService.emit('HANDOVER_PHOTO_UPLOADED', this.toEventPayload(updated));
    return { data: toHandoverView(updated) };
  }

  async deletePhoto(
    ownerId: string,
    handoverId: string,
    photoId: string,
  ): Promise<ApiResponse<HandoverView>> {
    const handover = await this.getHandoverOrThrow(handoverId);

    if (handover.ownerId !== ownerId) {
      throw new DomainError('Only the owner can remove handover photos', 'HANDOVER_FORBIDDEN', 403);
    }

    if (handover.status !== HandoverStatus.OWNER_PHOTOS_REQUIRED) {
      throw new DomainError(
        'Submitted handover evidence cannot be modified',
        'HANDOVER_NOT_EDITABLE',
        409,
      );
    }

    const photo = await this.handoversRepository.findPhoto(photoId);
    if (photo?.handoverId !== handoverId) {
      throw new DomainError('Photo not found', 'PHOTO_NOT_FOUND', 404);
    }

    await this.storageService.deleteObject(photo.storageKey);

    let updated: HandoverRecord;
    try {
      updated = await this.handoversRepository.removePhoto(handoverId, photoId, ownerId);
    } catch (error) {
      this.mapRepositoryError(error);
      throw error;
    }

    this.handoverEventsService.emit('HANDOVER_PHOTO_REMOVED', this.toEventPayload(updated));
    return { data: toHandoverView(updated) };
  }

  async submitHandover(ownerId: string, handoverId: string): Promise<ApiResponse<HandoverView>> {
    const handover = await this.getHandoverOrThrow(handoverId);

    if (handover.ownerId !== ownerId) {
      throw new DomainError('Only the owner can submit handover photos', 'HANDOVER_FORBIDDEN', 403);
    }

    if (!canTransitionHandover(handover.status, HandoverStatus.RENTER_APPROVAL_REQUIRED)) {
      throw new DomainError(
        'Handover cannot be submitted in its current state',
        'HANDOVER_INVALID_STATE',
        409,
      );
    }

    const photoCount = handover.photos.length;
    if (photoCount < MIN_PICKUP_HANDOVER_PHOTOS) {
      throw new DomainError(
        `At least ${MIN_PICKUP_HANDOVER_PHOTOS} photos are required before submission`,
        'HANDOVER_INSUFFICIENT_PHOTOS',
        409,
        { required: MIN_PICKUP_HANDOVER_PHOTOS, provided: photoCount },
      );
    }

    const updated = await this.handoversRepository.submitPickupHandover(handoverId, ownerId);
    if (!updated) {
      throw new DomainError(
        'Handover cannot be submitted in its current state',
        'HANDOVER_INVALID_STATE',
        409,
      );
    }

    this.handoverEventsService.emit('HANDOVER_SUBMITTED', this.toEventPayload(updated));
    return { data: toHandoverView(updated) };
  }

  async approveHandover(renterId: string, handoverId: string): Promise<ApiResponse<HandoverView>> {
    const handover = await this.getHandoverOrThrow(handoverId);

    if (handover.renterId !== renterId) {
      throw new DomainError(
        'Only the renter can approve pickup handover',
        'HANDOVER_FORBIDDEN',
        403,
      );
    }

    if (handover.status !== HandoverStatus.RENTER_APPROVAL_REQUIRED) {
      throw new DomainError(
        'Handover is not awaiting renter approval',
        'HANDOVER_INVALID_STATE',
        409,
      );
    }

    let updated: HandoverRecord | null;
    try {
      updated = await this.handoversRepository.approvePickupHandover(handoverId, renterId);
    } catch (error) {
      if (error instanceof Error && error.message === 'ALREADY_APPROVED') {
        throw new DomainError(
          'You have already approved this handover',
          'HANDOVER_ALREADY_APPROVED',
          409,
        );
      }
      if (error instanceof Error && error.message === 'NOT_RENTER') {
        throw new DomainError(
          'Only the renter can approve pickup handover',
          'HANDOVER_FORBIDDEN',
          403,
        );
      }
      throw error;
    }

    if (!updated) {
      throw new DomainError(
        'Handover is not awaiting renter approval',
        'HANDOVER_INVALID_STATE',
        409,
      );
    }

    this.handoverEventsService.emit('HANDOVER_RENTER_APPROVED', this.toEventPayload(updated));
    this.handoverEventsService.emit('HANDOVER_COMPLETED', this.toEventPayload(updated));
    this.handoverEventsService.emit('RENTAL_BECAME_ACTIVE', this.toEventPayload(updated));

    return { data: toHandoverView(updated) };
  }

  async getPhotoContent(
    handoverId: string,
    photoId: string,
    userId: string,
  ): Promise<{ stream: StreamableFile; mimeType: string }> {
    const handover = await this.getParticipantHandoverOrThrow(handoverId, userId);
    const photo = handover.photos.find((item) => item.id === photoId);
    if (!photo) {
      throw new DomainError('Photo not found', 'PHOTO_NOT_FOUND', 404);
    }

    const storageDir = this.configService.get('storageLocalDir', { infer: true });
    const absolutePath = join(storageDir, photo.storageKey);
    if (!existsSync(absolutePath)) {
      throw new DomainError('Photo file not found', 'PHOTO_NOT_FOUND', 404);
    }

    return {
      stream: new StreamableFile(createReadStream(absolutePath)),
      mimeType: photo.mimeType,
    };
  }

  private async getHandoverOrThrow(handoverId: string): Promise<HandoverRecord> {
    const handover = await this.handoversRepository.findById(handoverId);
    if (!handover) {
      throw new DomainError('Handover not found', 'HANDOVER_NOT_FOUND', 404);
    }
    return handover;
  }

  private async getParticipantHandoverOrThrow(
    handoverId: string,
    userId: string,
  ): Promise<HandoverRecord> {
    const handover = await this.getHandoverOrThrow(handoverId);
    if (handover.ownerId !== userId && handover.renterId !== userId) {
      throw new DomainError('You do not have access to this handover', 'HANDOVER_FORBIDDEN', 403);
    }
    return handover;
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

  private mapRepositoryError(error: unknown): void {
    if (!(error instanceof Error)) {
      return;
    }

    const map: Record<string, [string, string, number]> = {
      RENTAL_INVALID_STATE: [
        'Rental is not ready for pickup handover',
        'RENTAL_INVALID_STATE',
        409,
      ],
      AGREEMENT_NOT_APPROVED: [
        'An approved agreement is required before pickup handover',
        'AGREEMENT_NOT_APPROVED',
        409,
      ],
      VEHICLE_OWNER_MISMATCH: ['Vehicle ownership mismatch', 'VEHICLE_FORBIDDEN', 403],
      HANDOVER_EXISTS: ['Pickup handover already exists for this rental', 'HANDOVER_EXISTS', 409],
      HANDOVER_NOT_EDITABLE: [
        'Submitted handover evidence cannot be modified',
        'HANDOVER_NOT_EDITABLE',
        409,
      ],
      PHOTO_NOT_FOUND: ['Photo not found', 'PHOTO_NOT_FOUND', 404],
    };

    const mapped = map[error.message];
    if (mapped) {
      throw new DomainError(mapped[0], mapped[1], mapped[2]);
    }
  }

  private toEventPayload(handover: HandoverRecord) {
    return {
      handoverId: handover.id,
      rentalId: handover.rentalId,
      ownerId: handover.ownerId,
      renterId: handover.renterId,
      vehicleId: handover.vehicleId,
      status: handover.status,
    };
  }
}
