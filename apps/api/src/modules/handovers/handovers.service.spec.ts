import {
  HandoverStatus,
  HandoverType,
  RentalStatus,
  VehicleAvailability,
  VehicleStatus,
} from '@prisma/client';
import { UserPlanLookup } from '../../common/plans/user-plan.lookup';
import { RentalsRepository } from '../rentals/rentals.repository';
import { StorageService } from '../../common/storage/storage.service';
import { HandoverEventsService } from './handover-events.service';
import { MIN_PICKUP_HANDOVER_PHOTOS } from './handover.constants';
import { HandoversRepository } from './handovers.repository';
import { HandoversService } from './handovers.service';

const ownerId = 'owner-1';
const renterId = 'renter-1';
const otherUserId = 'user-3';
const rentalId = 'rental-1';
const handoverId = 'handover-1';
const vehicleId = 'vehicle-1';
const photoId = 'photo-1';

const baseVehicle = {
  id: vehicleId,
  ownerId,
  make: 'Toyota',
  model: 'Corolla',
  year: 2020,
  color: 'White',
  availability: VehicleAvailability.AVAILABLE,
  status: VehicleStatus.ACTIVE,
  latitude: 24.86,
  longitude: 67.0,
  geohash: 'ttest01',
  areaLabel: 'Clifton',
  location: null,
  ratingAverage: null,
  ratingCount: 0,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  photos: [],
};

const baseRental = {
  id: rentalId,
  renterId,
  ownerId,
  vehicleId,
  status: RentalStatus.PICKUP_PENDING,
  startDate: new Date('2026-02-01T00:00:00.000Z'),
  endDate: new Date('2026-02-05T00:00:00.000Z'),
  createdAt: new Date('2026-01-02T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  vehicle: baseVehicle,
  renter: { id: renterId, fullName: 'Test Renter' },
  owner: { id: ownerId, fullName: 'Test Owner' },
};

const baseHandover = {
  id: handoverId,
  rentalId,
  ownerId,
  renterId,
  vehicleId,
  type: HandoverType.PICKUP,
  status: HandoverStatus.OWNER_PHOTOS_REQUIRED,
  submittedAt: null,
  createdAt: new Date('2026-01-04T00:00:00.000Z'),
  updatedAt: new Date('2026-01-04T00:00:00.000Z'),
  rental: { vehicle: baseVehicle },
  owner: { id: ownerId, fullName: 'Test Owner' },
  renter: { id: renterId, fullName: 'Test Renter' },
  photos: [],
  approvals: [],
};

describe('HandoversService', () => {
  let service: HandoversService;
  let handoversRepository: jest.Mocked<HandoversRepository>;
  let rentalsRepository: jest.Mocked<RentalsRepository>;
  let storageService: jest.Mocked<StorageService>;
  let handoverEventsService: jest.Mocked<HandoverEventsService>;
  let userPlanLookup: jest.Mocked<UserPlanLookup>;

  beforeEach(() => {
    handoversRepository = {
      findById: jest.fn(),
      findPickupByRentalId: jest.fn(),
      findPhoto: jest.fn(),
      countPhotos: jest.fn(),
      createPickupHandover: jest.fn(),
      addPhoto: jest.fn(),
      removePhoto: jest.fn(),
      submitPickupHandover: jest.fn(),
      approvePickupHandover: jest.fn(),
    };

    rentalsRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<RentalsRepository>;

    storageService = {
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
    };

    handoverEventsService = {
      emit: jest.fn(),
    };

    userPlanLookup = {
      getLimitsForUser: jest.fn().mockResolvedValue({
        maxListedVehicles: 2,
        maxVehiclePhotos: 5,
        maxHandoverPhotos: 5,
      }),
    } as unknown as jest.Mocked<UserPlanLookup>;

    service = new HandoversService(
      handoversRepository,
      rentalsRepository,
      storageService,
      handoverEventsService,
      userPlanLookup,
    );
  });

  describe('createPickupHandover', () => {
    it('allows owner to create pickup handover from accepted rental', async () => {
      rentalsRepository.findById.mockResolvedValue({
        ...baseRental,
        status: RentalStatus.ACCEPTED,
      });
      handoversRepository.createPickupHandover.mockResolvedValue(baseHandover);

      const result = await service.createPickupHandover(ownerId, rentalId);

      expect(result.data.status).toBe('OWNER_PHOTOS_REQUIRED');
    });

    it('rejects creation by non-owner', async () => {
      rentalsRepository.findById.mockResolvedValue(baseRental);

      await expect(service.createPickupHandover(renterId, rentalId)).rejects.toMatchObject({
        errorCode: 'HANDOVER_FORBIDDEN',
      });
    });

    it('maps agreement requirement failures', async () => {
      rentalsRepository.findById.mockResolvedValue(baseRental);
      handoversRepository.createPickupHandover.mockRejectedValue(
        new Error('AGREEMENT_NOT_APPROVED'),
      );

      await expect(service.createPickupHandover(ownerId, rentalId)).rejects.toMatchObject({
        errorCode: 'AGREEMENT_NOT_APPROVED',
      });
    });
  });

  describe('uploadPhoto', () => {
    const file = {
      buffer: Buffer.from('fake'),
      mimetype: 'image/jpeg',
      size: 1024,
    } as Express.Multer.File;

    it('allows owner to upload photos before submission', async () => {
      handoversRepository.findById.mockResolvedValue(baseHandover);
      handoversRepository.countPhotos.mockResolvedValue(0);
      storageService.saveObject.mockResolvedValue({
        storageKey: 'handovers/key.jpg',
        url: 'https://cdn.example.com/handovers/key.jpg',
      });
      handoversRepository.addPhoto.mockResolvedValue({
        ...baseHandover,
        photos: [
          {
            id: photoId,
            handoverId,
            storageKey: 'handovers/key.jpg',
            url: 'https://cdn.example.com/handovers/key.jpg',
            mimeType: 'image/jpeg',
            sizeBytes: 1024,
            sortOrder: 0,
            uploadedById: ownerId,
            createdAt: new Date(),
          },
        ],
      });

      const result = await service.uploadPhoto(ownerId, handoverId, file);

      expect(storageService.saveObject).toHaveBeenCalled();
      expect(result.data.photos).toHaveLength(1);
    });

    it('rejects upload when the plan evidence cap is reached', async () => {
      handoversRepository.findById.mockResolvedValue(baseHandover);
      handoversRepository.countPhotos.mockResolvedValue(5);

      await expect(service.uploadPhoto(ownerId, handoverId, file)).rejects.toMatchObject({
        errorCode: 'PHOTO_LIMIT_REACHED',
      });
      expect(storageService.saveObject).not.toHaveBeenCalled();
    });

    it('rejects renter photo upload', async () => {
      handoversRepository.findById.mockResolvedValue(baseHandover);

      await expect(service.uploadPhoto(renterId, handoverId, file)).rejects.toMatchObject({
        errorCode: 'HANDOVER_FORBIDDEN',
      });
    });

    it('cleans up storage when database write fails', async () => {
      handoversRepository.findById.mockResolvedValue(baseHandover);
      handoversRepository.countPhotos.mockResolvedValue(0);
      storageService.saveObject.mockResolvedValue({
        storageKey: 'handovers/key.jpg',
        url: 'https://cdn.example.com/handovers/key.jpg',
      });
      handoversRepository.addPhoto.mockRejectedValue(new Error('HANDOVER_NOT_EDITABLE'));

      await expect(service.uploadPhoto(ownerId, handoverId, file)).rejects.toMatchObject({
        errorCode: 'HANDOVER_NOT_EDITABLE',
      });
      expect(storageService.deleteObject).toHaveBeenCalledWith('handovers/key.jpg');
    });
  });

  describe('deletePhoto', () => {
    it('allows owner to delete draft photos', async () => {
      handoversRepository.findById.mockResolvedValue({
        ...baseHandover,
        photos: [
          {
            id: photoId,
            handoverId,
            storageKey: 'handovers/key.jpg',
            url: 'http://localhost/content',
            mimeType: 'image/jpeg',
            sizeBytes: 1024,
            sortOrder: 0,
            uploadedById: ownerId,
            createdAt: new Date(),
          },
        ],
      });
      handoversRepository.findPhoto.mockResolvedValue({
        id: photoId,
        handoverId,
        storageKey: 'handovers/key.jpg',
        url: 'http://localhost/content',
        mimeType: 'image/jpeg',
        sizeBytes: 1024,
        sortOrder: 0,
        uploadedById: ownerId,
        createdAt: new Date(),
        handover: baseHandover,
      });
      handoversRepository.removePhoto.mockResolvedValue(baseHandover);

      await service.deletePhoto(ownerId, handoverId, photoId);

      expect(storageService.deleteObject).toHaveBeenCalledWith('handovers/key.jpg');
    });

    it('rejects deleting submitted evidence', async () => {
      handoversRepository.findById.mockResolvedValue({
        ...baseHandover,
        status: HandoverStatus.RENTER_APPROVAL_REQUIRED,
      });

      await expect(service.deletePhoto(ownerId, handoverId, photoId)).rejects.toMatchObject({
        errorCode: 'HANDOVER_NOT_EDITABLE',
      });
    });
  });

  describe('submitHandover', () => {
    it('requires minimum photos before submission', async () => {
      handoversRepository.findById.mockResolvedValue({
        ...baseHandover,
        photos: [{ id: photoId } as never],
      });

      await expect(service.submitHandover(ownerId, handoverId)).rejects.toMatchObject({
        errorCode: 'HANDOVER_INSUFFICIENT_PHOTOS',
      });
    });

    it('submits handover when minimum photos are present', async () => {
      const photos = Array.from({ length: MIN_PICKUP_HANDOVER_PHOTOS }, (_, index) => ({
        id: `photo-${index}`,
        handoverId,
        storageKey: `handovers/${index}.jpg`,
        url: `http://localhost/content/${index}`,
        mimeType: 'image/jpeg',
        sizeBytes: 1024,
        sortOrder: index,
        uploadedById: ownerId,
        createdAt: new Date(),
      }));

      handoversRepository.findById.mockResolvedValue({
        ...baseHandover,
        photos,
      });
      handoversRepository.submitPickupHandover.mockResolvedValue({
        ...baseHandover,
        status: HandoverStatus.RENTER_APPROVAL_REQUIRED,
        photos,
        submittedAt: new Date(),
      });

      const result = await service.submitHandover(ownerId, handoverId);

      expect(result.data.status).toBe('RENTER_APPROVAL_REQUIRED');
    });
  });

  describe('approveHandover', () => {
    it('allows renter to approve submitted handover', async () => {
      handoversRepository.findById.mockResolvedValue({
        ...baseHandover,
        status: HandoverStatus.RENTER_APPROVAL_REQUIRED,
        submittedAt: new Date(),
      });
      handoversRepository.approvePickupHandover.mockResolvedValue({
        ...baseHandover,
        status: HandoverStatus.APPROVED,
        approvals: [
          {
            id: 'approval-1',
            handoverId,
            approvedById: renterId,
            role: 'RENTER',
            approvedAt: new Date(),
          },
        ],
      });

      const result = await service.approveHandover(renterId, handoverId);

      expect(result.data.status).toBe('APPROVED');
      expect(handoverEventsService.emit).toHaveBeenCalledWith(
        'RENTAL_BECAME_ACTIVE',
        expect.any(Object),
      );
    });

    it('rejects owner self-approval', async () => {
      handoversRepository.findById.mockResolvedValue({
        ...baseHandover,
        status: HandoverStatus.RENTER_APPROVAL_REQUIRED,
      });

      await expect(service.approveHandover(ownerId, handoverId)).rejects.toMatchObject({
        errorCode: 'HANDOVER_FORBIDDEN',
      });
    });

    it('rejects duplicate approval', async () => {
      handoversRepository.findById.mockResolvedValue({
        ...baseHandover,
        status: HandoverStatus.RENTER_APPROVAL_REQUIRED,
      });
      handoversRepository.approvePickupHandover.mockRejectedValue(new Error('ALREADY_APPROVED'));

      await expect(service.approveHandover(renterId, handoverId)).rejects.toMatchObject({
        errorCode: 'HANDOVER_ALREADY_APPROVED',
      });
    });
  });

  describe('access control', () => {
    it('denies unrelated users from viewing handover', async () => {
      handoversRepository.findById.mockResolvedValue(baseHandover);

      await expect(service.getHandover(handoverId, otherUserId)).rejects.toMatchObject({
        errorCode: 'HANDOVER_FORBIDDEN',
      });
    });
  });
});
