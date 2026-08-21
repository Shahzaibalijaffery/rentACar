import { UserStatus } from '@prisma/client';
import { DomainError } from '../../common/errors/domain.error';
import { StorageService } from '../../common/storage/storage.service';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

const ownerUser = {
  id: 'owner-1',
  email: 'owner@example.com',
  emailVerifiedAt: new Date(),
  passwordHash: 'hashed',
  fullName: 'Owner User',
  cnic: '35201-1234567-1',
  phone: '+923001111111',
  profilePhotoUrl: 'https://cdn.example/owner.jpg',
  status: UserStatus.ACTIVE,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const renterUser = {
  ...ownerUser,
  id: 'renter-1',
  email: 'renter@example.com',
  fullName: 'Renter User',
  cnic: '35202-2345678-2',
  profilePhotoUrl: null,
};

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let vehiclesRepository: jest.Mocked<VehiclesRepository>;
  let storageService: jest.Mocked<StorageService>;

  beforeEach(() => {
    usersRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByCnic: jest.fn(),
      create: jest.fn(),
      updateProfile: jest.fn(),
      markEmailVerified: jest.fn(),
      getByIdOrThrow: jest.fn(),
      hasSharedRental: jest.fn(),
    };

    vehiclesRepository = {
      findPublicByOwner: jest.fn(),
    } as unknown as jest.Mocked<VehiclesRepository>;

    storageService = {
      saveObject: jest.fn(),
    } as unknown as jest.Mocked<StorageService>;

    usersService = new UsersService(usersRepository, vehiclesRepository, storageService);
  });

  describe('lookupByCnic', () => {
    it('returns participant profile when users share a rental', async () => {
      usersRepository.findByCnic.mockResolvedValue(ownerUser);
      usersRepository.hasSharedRental.mockResolvedValue(true);

      const result = await usersService.lookupByCnic(
        { userId: renterUser.id, email: renterUser.email },
        '3520112345671',
      );

      expect(usersRepository.findByCnic).toHaveBeenCalledWith('35201-1234567-1');
      expect(usersRepository.hasSharedRental).toHaveBeenCalledWith(renterUser.id, ownerUser.id);
      expect(result.data).toEqual({
        id: ownerUser.id,
        fullName: ownerUser.fullName,
        profilePhotoUrl: ownerUser.profilePhotoUrl,
        cnic: ownerUser.cnic,
      });
    });

    it('rejects lookup for own CNIC', async () => {
      usersRepository.findByCnic.mockResolvedValue(ownerUser);

      await expect(
        usersService.lookupByCnic(
          { userId: ownerUser.id, email: ownerUser.email },
          ownerUser.cnic,
        ),
      ).rejects.toMatchObject<Partial<DomainError>>({
        errorCode: 'USER_NOT_FOUND',
        statusCode: 404,
      });

      expect(usersRepository.hasSharedRental).not.toHaveBeenCalled();
    });

    it('rejects lookup when CNIC is unknown', async () => {
      usersRepository.findByCnic.mockResolvedValue(null);

      await expect(
        usersService.lookupByCnic(
          { userId: renterUser.id, email: renterUser.email },
          '35201-9999999-9',
        ),
      ).rejects.toMatchObject<Partial<DomainError>>({
        errorCode: 'USER_NOT_FOUND',
        statusCode: 404,
      });
    });

    it('rejects lookup when users do not share a rental', async () => {
      usersRepository.findByCnic.mockResolvedValue(ownerUser);
      usersRepository.hasSharedRental.mockResolvedValue(false);

      await expect(
        usersService.lookupByCnic(
          { userId: renterUser.id, email: renterUser.email },
          ownerUser.cnic,
        ),
      ).rejects.toMatchObject<Partial<DomainError>>({
        errorCode: 'USER_NOT_FOUND',
        statusCode: 404,
      });
    });

    it('rejects invalid CNIC format', async () => {
      await expect(
        usersService.lookupByCnic(
          { userId: renterUser.id, email: renterUser.email },
          'invalid',
        ),
      ).rejects.toBeInstanceOf(DomainError);

      expect(usersRepository.findByCnic).not.toHaveBeenCalled();
    });
  });

  describe('searchByCnic', () => {
    it('returns public profile and vehicles for another active user', async () => {
      usersRepository.findByCnic.mockResolvedValue(ownerUser);
      vehiclesRepository.findPublicByOwner.mockResolvedValue([
        {
          id: 'vehicle-1',
          ownerId: ownerUser.id,
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          color: 'White',
          availability: 'AVAILABLE',
          status: 'ACTIVE',
          latitude: 24.86,
          longitude: 67.0,
          geohash: 'abc',
          areaLabel: 'Clifton',
          activeRentalId: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          photos: [],
          owner: {
            id: ownerUser.id,
            fullName: ownerUser.fullName,
            profilePhotoUrl: ownerUser.profilePhotoUrl,
          },
        },
      ] as never);

      const result = await usersService.searchByCnic(
        { userId: renterUser.id, email: renterUser.email },
        ownerUser.cnic,
      );

      expect(vehiclesRepository.findPublicByOwner).toHaveBeenCalledWith(ownerUser.id);
      expect(result.data.user).toEqual({
        id: ownerUser.id,
        fullName: ownerUser.fullName,
        profilePhotoUrl: ownerUser.profilePhotoUrl,
      });
      expect(result.data.vehicles).toHaveLength(1);
      expect(result.data.vehicles[0]?.make).toBe('Toyota');
    });

    it('rejects search for own CNIC', async () => {
      usersRepository.findByCnic.mockResolvedValue(ownerUser);

      await expect(
        usersService.searchByCnic(
          { userId: ownerUser.id, email: ownerUser.email },
          ownerUser.cnic,
        ),
      ).rejects.toMatchObject<Partial<DomainError>>({
        errorCode: 'USER_NOT_FOUND',
        statusCode: 404,
      });

      expect(vehiclesRepository.findPublicByOwner).not.toHaveBeenCalled();
    });

    it('rejects search when CNIC is unknown', async () => {
      usersRepository.findByCnic.mockResolvedValue(null);

      await expect(
        usersService.searchByCnic(
          { userId: renterUser.id, email: renterUser.email },
          '35201-9999999-9',
        ),
      ).rejects.toMatchObject<Partial<DomainError>>({
        errorCode: 'USER_NOT_FOUND',
        statusCode: 404,
      });
    });
  });
});
