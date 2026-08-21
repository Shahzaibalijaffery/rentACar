import { Injectable } from '@nestjs/common';
import type {
  AgreementParticipant,
  ApiResponse,
  UserProfile,
  UserProfileSearchResult,
} from '@rentacar/shared';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { DomainError } from '../../common/errors/domain.error';
import { normalizeCnic } from '../../common/utils/cnic.util';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  buildStorageKey,
} from '../../common/storage/image-upload.constants';
import { StorageService } from '../../common/storage/storage.service';
import { toVehiclePublicView } from '../vehicles/vehicle.mapper';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { isUserActive, toAgreementParticipant, toUserProfile, toUserPublicProfile } from './user.mapper';
import { UsersRepository } from './users.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly vehiclesRepository: VehiclesRepository,
    private readonly storageService: StorageService,
  ) {}

  async getMyProfile(currentUser: AuthenticatedUser): Promise<ApiResponse<UserProfile>> {
    const user = await this.usersRepository.getByIdOrThrow(currentUser.userId);
    return { data: toUserProfile(user) };
  }

  async lookupByCnic(
    currentUser: AuthenticatedUser,
    rawCnic: string,
  ): Promise<ApiResponse<AgreementParticipant>> {
    const normalizedCnic = normalizeCnic(rawCnic);
    const targetUser = await this.usersRepository.findByCnic(normalizedCnic);

    if (!targetUser || targetUser.id === currentUser.userId) {
      throw new DomainError('Profile not found', 'USER_NOT_FOUND', 404);
    }

    const hasSharedRental = await this.usersRepository.hasSharedRental(
      currentUser.userId,
      targetUser.id,
    );

    if (!hasSharedRental) {
      throw new DomainError('Profile not found', 'USER_NOT_FOUND', 404);
    }

    return { data: toAgreementParticipant(targetUser) };
  }

  async searchByCnic(
    currentUser: AuthenticatedUser,
    rawCnic: string,
  ): Promise<ApiResponse<UserProfileSearchResult>> {
    const normalizedCnic = normalizeCnic(rawCnic);
    const targetUser = await this.usersRepository.findByCnic(normalizedCnic);

    if (!targetUser || targetUser.id === currentUser.userId) {
      throw new DomainError('Profile not found', 'USER_NOT_FOUND', 404);
    }

    if (!isUserActive(targetUser)) {
      throw new DomainError('Profile not found', 'USER_NOT_FOUND', 404);
    }

    const vehicles = await this.vehiclesRepository.findPublicByOwner(targetUser.id);

    return {
      data: {
        user: toUserPublicProfile(targetUser),
        vehicles: vehicles.map(toVehiclePublicView),
      },
    };
  }

  async updateMyProfile(
    currentUser: AuthenticatedUser,
    dto: UpdateProfileDto,
  ): Promise<ApiResponse<UserProfile>> {
    if (dto.fullName === undefined && dto.profilePhotoUrl === undefined) {
      throw new DomainError('No profile fields provided', 'VALIDATION_ERROR', 400);
    }

    const updateData: { fullName?: string; profilePhotoUrl?: string | null } = {};
    if (dto.fullName !== undefined) {
      updateData.fullName = dto.fullName;
    }
    if (dto.profilePhotoUrl !== undefined) {
      updateData.profilePhotoUrl = dto.profilePhotoUrl;
    }

    const user = await this.usersRepository.updateProfile(currentUser.userId, updateData);
    return { data: toUserProfile(user) };
  }

  async uploadProfilePhoto(
    currentUser: AuthenticatedUser,
    file: Express.Multer.File,
  ): Promise<ApiResponse<UserProfile>> {
    this.validateUploadedImage(file);

    const storageKey = buildStorageKey(`profiles/${currentUser.userId}`, file.mimetype);
    const stored = await this.storageService.saveObject({
      buffer: file.buffer,
      mimeType: file.mimetype,
      storageKey,
    });

    const user = await this.usersRepository.updateProfile(currentUser.userId, {
      profilePhotoUrl: stored.url,
    });

    return { data: toUserProfile(user) };
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
