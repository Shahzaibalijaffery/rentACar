import { VehicleAvailability, VehicleStatus } from '@prisma/client';
import { DomainError } from '../../common/errors/domain.error';
import { UserPlanLookup } from '../../common/plans/user-plan.lookup';
import { StorageService } from '../../common/storage/storage.service';
import { VehiclesRepository } from './vehicles.repository';
import { VehiclesService } from './vehicles.service';

const ownerId = 'owner-1';
const otherOwnerId = 'owner-2';
const vehicleId = 'vehicle-1';

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
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  photos: [],
  owner: {
    id: ownerId,
    fullName: 'Test Owner',
    profilePhotoUrl: null,
  },
};

describe('VehiclesService', () => {
  let service: VehiclesService;
  let repository: jest.Mocked<VehiclesRepository>;
  let storageService: jest.Mocked<StorageService>;
  let userPlanLookup: jest.Mocked<UserPlanLookup>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findPublicById: jest.fn(),
      findByOwner: jest.fn(),
      update: jest.fn(),
      addPhoto: jest.fn(),
      findPhoto: jest.fn(),
      deletePhoto: jest.fn(),
      countPhotos: jest.fn(),
      countActiveByOwner: jest.fn(),
    };

    storageService = {
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
    };

    userPlanLookup = {
      getLimitsForUser: jest.fn().mockResolvedValue({
        maxListedVehicles: 2,
        maxVehiclePhotos: 5,
        maxHandoverPhotos: 5,
      }),
    } as unknown as jest.Mocked<UserPlanLookup>;

    repository.countActiveByOwner.mockResolvedValue(0);

    service = new VehiclesService(repository, storageService, userPlanLookup);
  });

  describe('createVehicle', () => {
    it('creates a vehicle for the authenticated owner', async () => {
      repository.create.mockResolvedValue(baseVehicle);

      const result = await service.createVehicle(ownerId, {
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        color: 'White',
        latitude: 24.86,
        longitude: 67.0,
        areaLabel: 'Clifton',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId,
          make: 'Toyota',
        }),
      );
      const createArgs = repository.create.mock.calls[0]?.[0];
      expect(createArgs?.geohash).toEqual(expect.any(String));
      expect(result.data.id).toBe(vehicleId);
    });

    it('rejects invalid vehicle year', async () => {
      await expect(
        service.createVehicle(ownerId, {
          make: 'Toyota',
          model: 'Corolla',
          year: 1800,
          color: 'White',
          latitude: 24.86,
          longitude: 67.0,
        }),
      ).rejects.toThrow(DomainError);
    });

    it('rejects listing when the plan vehicle cap is reached', async () => {
      repository.countActiveByOwner.mockResolvedValue(2);

      await expect(
        service.createVehicle(ownerId, {
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          color: 'White',
          latitude: 24.86,
          longitude: 67.0,
        }),
      ).rejects.toMatchObject({ errorCode: 'VEHICLE_PLAN_LIMIT' });
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('rejects invalid coordinates', async () => {
      await expect(
        service.createVehicle(ownerId, {
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          color: 'White',
          latitude: 100,
          longitude: 67.0,
        }),
      ).rejects.toThrow(DomainError);
    });
  });

  describe('updateVehicle', () => {
    it('updates owned vehicle fields', async () => {
      repository.findById.mockResolvedValue(baseVehicle);
      repository.update.mockResolvedValue({ ...baseVehicle, color: 'Black' });

      const result = await service.updateVehicle(ownerId, vehicleId, { color: 'Black' });

      expect(repository.update).toHaveBeenCalledWith(vehicleId, { color: 'Black' });
      expect(result.data.color).toBe('Black');
    });

    it('rejects updates from non-owner', async () => {
      repository.findById.mockResolvedValue(baseVehicle);

      await expect(
        service.updateVehicle(otherOwnerId, vehicleId, { color: 'Black' }),
      ).rejects.toMatchObject({ errorCode: 'VEHICLE_FORBIDDEN' });
    });
  });

  describe('archiveVehicle', () => {
    it('archives an owned vehicle', async () => {
      repository.findById.mockResolvedValue(baseVehicle);
      repository.update.mockResolvedValue({
        ...baseVehicle,
        status: VehicleStatus.ARCHIVED,
        availability: VehicleAvailability.UNAVAILABLE,
      });

      const result = await service.archiveVehicle(ownerId, vehicleId);

      expect(repository.update).toHaveBeenCalledWith(vehicleId, {
        status: VehicleStatus.ARCHIVED,
        availability: VehicleAvailability.UNAVAILABLE,
      });
      expect(result.data.message).toContain('archived');
    });
  });

  describe('updateAvailability', () => {
    it('changes availability for active vehicles', async () => {
      repository.findById.mockResolvedValue(baseVehicle);
      repository.update.mockResolvedValue({
        ...baseVehicle,
        availability: VehicleAvailability.UNAVAILABLE,
      });

      const result = await service.updateAvailability(ownerId, vehicleId, {
        availability: VehicleAvailability.UNAVAILABLE,
      });

      expect(result.data.availability).toBe(VehicleAvailability.UNAVAILABLE);
    });

    it('rejects availability changes for archived vehicles', async () => {
      repository.findById.mockResolvedValue({
        ...baseVehicle,
        status: VehicleStatus.ARCHIVED,
      });

      await expect(
        service.updateAvailability(ownerId, vehicleId, {
          availability: VehicleAvailability.AVAILABLE,
        }),
      ).rejects.toMatchObject({ errorCode: 'VEHICLE_ARCHIVED' });
    });
  });

  describe('addPhoto', () => {
    const file = {
      buffer: Buffer.from('fake'),
      mimetype: 'image/jpeg',
      size: 1024,
    } as Express.Multer.File;

    it('uploads photo for owned vehicle', async () => {
      repository.findById.mockResolvedValueOnce(baseVehicle).mockResolvedValueOnce({
        ...baseVehicle,
        photos: [
          {
            id: 'photo-1',
            vehicleId,
            storageKey: 'vehicles/key.jpg',
            url: 'http://localhost/files/key.jpg',
            mimeType: 'image/jpeg',
            sizeBytes: 1024,
            sortOrder: 0,
            createdAt: new Date(),
          },
        ],
      });
      repository.countPhotos.mockResolvedValue(0);
      storageService.saveObject.mockResolvedValue({
        storageKey: 'vehicles/key.jpg',
        url: 'http://localhost/files/key.jpg',
      });

      const result = await service.addPhoto(ownerId, vehicleId, file);

      expect(storageService.saveObject).toHaveBeenCalled();
      expect(repository.addPhoto).toHaveBeenCalled();
      expect(result.data.photos).toHaveLength(1);
    });

    it('rejects photo upload when the plan photo cap is reached', async () => {
      repository.findById.mockResolvedValue(baseVehicle);
      repository.countPhotos.mockResolvedValue(5);

      await expect(service.addPhoto(ownerId, vehicleId, file)).rejects.toMatchObject({
        errorCode: 'PHOTO_LIMIT_REACHED',
      });
      expect(storageService.saveObject).not.toHaveBeenCalled();
    });

    it('rejects photo upload from non-owner', async () => {
      repository.findById.mockResolvedValue(baseVehicle);

      await expect(service.addPhoto(otherOwnerId, vehicleId, file)).rejects.toMatchObject({
        errorCode: 'VEHICLE_FORBIDDEN',
      });
    });

    it('rejects invalid image type', async () => {
      repository.findById.mockResolvedValue(baseVehicle);

      await expect(
        service.addPhoto(ownerId, vehicleId, {
          ...file,
          mimetype: 'application/pdf',
        }),
      ).rejects.toMatchObject({ errorCode: 'INVALID_IMAGE_TYPE' });
    });
  });

  describe('deletePhoto', () => {
    it('deletes photo for owned vehicle', async () => {
      repository.findById.mockResolvedValueOnce(baseVehicle).mockResolvedValueOnce(baseVehicle);
      repository.findPhoto.mockResolvedValue({
        id: 'photo-1',
        vehicleId,
        storageKey: 'vehicles/key.jpg',
        url: 'http://localhost/files/key.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1024,
        sortOrder: 0,
        createdAt: new Date(),
      });

      await service.deletePhoto(ownerId, vehicleId, 'photo-1');

      expect(storageService.deleteObject).toHaveBeenCalledWith('vehicles/key.jpg');
      expect(repository.deletePhoto).toHaveBeenCalledWith('photo-1');
    });

    it('rejects deleting photo from non-owned vehicle', async () => {
      repository.findById.mockResolvedValue(baseVehicle);

      await expect(service.deletePhoto(otherOwnerId, vehicleId, 'photo-1')).rejects.toMatchObject({
        errorCode: 'VEHICLE_FORBIDDEN',
      });
    });
  });

  describe('getPublicVehicle', () => {
    it('returns public view for active vehicles', async () => {
      repository.findPublicById.mockResolvedValue(baseVehicle);

      const result = await service.getPublicVehicle(vehicleId);

      expect(result.data.make).toBe('Toyota');
      expect(result.data).not.toHaveProperty('status');
      expect(result.data).not.toHaveProperty('latitude');
      expect(result.data.owner.fullName).toBe('Test Owner');
    });

    it('hides archived vehicles', async () => {
      repository.findPublicById.mockResolvedValue({
        ...baseVehicle,
        status: VehicleStatus.ARCHIVED,
      });

      await expect(service.getPublicVehicle(vehicleId)).rejects.toMatchObject({
        errorCode: 'VEHICLE_NOT_FOUND',
      });
    });
  });
});
