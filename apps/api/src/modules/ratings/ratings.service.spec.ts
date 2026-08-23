import { RatingTarget, RentalStatus } from '@prisma/client';
import { DomainError } from '../../common/errors/domain.error';
import { RentalsRepository } from '../rentals/rentals.repository';
import { UsersRepository } from '../users/users.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import type { RatingRecord } from './ratings.repository';
import { RatingsRepository } from './ratings.repository';
import { RatingsService } from './ratings.service';

const ownerId = 'owner-1';
const renterId = 'renter-1';
const otherUserId = 'user-3';
const rentalId = 'rental-1';
const vehicleId = 'vehicle-1';

const completedRental = {
  id: rentalId,
  renterId,
  ownerId,
  vehicleId,
  status: RentalStatus.COMPLETED,
};

const vehicleRating = {
  id: 'rating-1',
  rentalId,
  vehicleId,
  raterId: renterId,
  rateeId: ownerId,
  target: RatingTarget.VEHICLE,
  stars: 5,
  comment: 'Excellent car',
  createdAt: new Date('2026-01-16T10:00:00.000Z'),
  updatedAt: new Date('2026-01-16T10:00:00.000Z'),
  rater: { id: renterId, fullName: 'Test Renter', profilePhotoUrl: null },
} as RatingRecord;

describe('RatingsService', () => {
  let service: RatingsService;
  let ratingsRepository: jest.Mocked<RatingsRepository>;
  let rentalsRepository: jest.Mocked<Pick<RentalsRepository, 'findById'>>;
  let vehiclesRepository: jest.Mocked<Pick<VehiclesRepository, 'findById'>>;
  let usersRepository: jest.Mocked<Pick<UsersRepository, 'findById'>>;

  beforeEach(() => {
    ratingsRepository = {
      findByRentalId: jest.fn(),
      findByRentalAndRater: jest.fn(),
      findPublicForVehicle: jest.fn(),
      findPublicForRenter: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<RatingsRepository>;

    rentalsRepository = {
      findById: jest.fn(),
    };

    vehiclesRepository = {
      findById: jest.fn(),
    };

    usersRepository = {
      findById: jest.fn(),
    };

    service = new RatingsService(
      ratingsRepository,
      rentalsRepository as unknown as RentalsRepository,
      vehiclesRepository as unknown as VehiclesRepository,
      usersRepository as unknown as UsersRepository,
    );
  });

  it('lets the renter rate the vehicle after completion', async () => {
    rentalsRepository.findById.mockResolvedValue(completedRental as never);
    ratingsRepository.findByRentalAndRater.mockResolvedValue(null);
    ratingsRepository.create.mockResolvedValue(vehicleRating);
    ratingsRepository.findByRentalId.mockResolvedValue([vehicleRating]);

    const result = await service.submitRentalRating(rentalId, renterId, {
      stars: 5,
      comment: 'Excellent car',
    });

    expect(ratingsRepository.create).toHaveBeenCalledWith({
      rentalId,
      vehicleId,
      raterId: renterId,
      rateeId: ownerId,
      target: RatingTarget.VEHICLE,
      stars: 5,
      comment: 'Excellent car',
    });
    expect(result.data.myRating?.stars).toBe(5);
    expect(result.data.canSubmit).toBe(false);
  });

  it('lets the owner rate the renter after completion', async () => {
    rentalsRepository.findById.mockResolvedValue(completedRental as never);
    ratingsRepository.findByRentalAndRater.mockResolvedValue(null);
    ratingsRepository.create.mockResolvedValue({
      ...vehicleRating,
      id: 'rating-2',
      raterId: ownerId,
      rateeId: renterId,
      target: RatingTarget.RENTER,
      comment: 'On time and careful',
      rater: { id: ownerId, fullName: 'Test Owner', profilePhotoUrl: null },
    });
    ratingsRepository.findByRentalId.mockResolvedValue([]);

    await service.submitRentalRating(rentalId, ownerId, {
      stars: 4,
      comment: 'On time and careful',
    });

    expect(ratingsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        raterId: ownerId,
        rateeId: renterId,
        target: RatingTarget.RENTER,
        stars: 4,
      }),
    );
  });

  it('rejects ratings before the rental is completed', async () => {
    rentalsRepository.findById.mockResolvedValue({
      ...completedRental,
      status: RentalStatus.ACTIVE,
    } as never);

    await expect(
      service.submitRentalRating(rentalId, renterId, { stars: 5 }),
    ).rejects.toMatchObject<Partial<DomainError>>({
      errorCode: 'RATING_NOT_ALLOWED',
      statusCode: 409,
    });
  });

  it('rejects a second rating from the same party', async () => {
    rentalsRepository.findById.mockResolvedValue(completedRental as never);
    ratingsRepository.findByRentalAndRater.mockResolvedValue(vehicleRating);

    await expect(
      service.submitRentalRating(rentalId, renterId, { stars: 3 }),
    ).rejects.toMatchObject<Partial<DomainError>>({
      errorCode: 'RATING_ALREADY_SUBMITTED',
      statusCode: 409,
    });
  });

  it('hides ratings from users who are not on the rental', async () => {
    rentalsRepository.findById.mockResolvedValue(completedRental as never);

    await expect(service.getRentalRatings(rentalId, otherUserId)).rejects.toMatchObject<
      Partial<DomainError>
    >({
      errorCode: 'RENTAL_FORBIDDEN',
      statusCode: 403,
    });
  });

  it('returns public vehicle reviews without rental identifiers', async () => {
    vehiclesRepository.findById.mockResolvedValue({
      id: vehicleId,
      ratingAverage: 5,
      ratingCount: 1,
    } as never);
    ratingsRepository.findPublicForVehicle.mockResolvedValue([vehicleRating]);

    const result = await service.getVehicleRatings(vehicleId);

    expect(result.data.summary.totalCount).toBe(1);
    expect(JSON.stringify(result.data)).not.toMatch(/cnic|email|phone|"rentalId"/i);
  });
});
