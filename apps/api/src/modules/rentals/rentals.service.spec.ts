import { RentalStatus, UserStatus, VehicleAvailability, VehicleStatus } from '@prisma/client';
import { UsersRepository } from '../users/users.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { RentalEventsService } from './rental-events.service';
import { RentalsRepository } from './rentals.repository';
import { RentalsService } from './rentals.service';

const renterId = 'renter-1';
const ownerId = 'owner-1';
const otherUserId = 'user-2';
const vehicleId = 'vehicle-1';
const rentalId = 'rental-1';

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
  activeRentalId: null,
  location: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  photos: [],
};

const baseOwner = {
  id: ownerId,
  email: 'owner@example.com',
  emailVerifiedAt: new Date(),
  passwordHash: 'hash',
  fullName: 'Test Owner',
  cnic: '1234567890123',
  profilePhotoUrl: null,
  status: UserStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const baseRental = {
  id: rentalId,
  renterId,
  ownerId,
  vehicleId,
  status: RentalStatus.PENDING,
  startDate: null,
  endDate: null,
  completedAt: null,
  completedById: null,
  createdAt: new Date('2026-01-02T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  vehicle: baseVehicle,
  renter: {
    id: renterId,
    fullName: 'Test Renter',
    profilePhotoUrl: null,
  },
  owner: {
    id: ownerId,
    fullName: 'Test Owner',
    profilePhotoUrl: null,
  },
};

describe('RentalsService', () => {
  let service: RentalsService;
  let rentalsRepository: jest.Mocked<RentalsRepository>;
  let vehiclesRepository: jest.Mocked<VehiclesRepository>;
  let usersRepository: jest.Mocked<UsersRepository>;
  let rentalEventsService: jest.Mocked<RentalEventsService>;

  beforeEach(() => {
    rentalsRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByRenter: jest.fn(),
      findByOwner: jest.fn(),
      findBlockingForVehicle: jest.fn(),
      findBlockingForRenterAndVehicle: jest.fn(),
      updateStatus: jest.fn(),
      acceptPendingRental: jest.fn(),
      findRelatedIds: jest.fn(),
      completeActiveRental: jest.fn(),
    };

    vehiclesRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<VehiclesRepository>;

    usersRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    rentalEventsService = {
      emit: jest.fn(),
    };

    service = new RentalsService(
      rentalsRepository,
      vehiclesRepository,
      usersRepository,
      rentalEventsService,
    );
  });

  describe('createRental', () => {
    it('creates a rental request with owner derived from vehicle', async () => {
      vehiclesRepository.findById.mockResolvedValue(baseVehicle);
      usersRepository.findById.mockResolvedValue(baseOwner);
      rentalsRepository.findBlockingForRenterAndVehicle.mockResolvedValue(null);
      rentalsRepository.findBlockingForVehicle.mockResolvedValue(null);
      rentalsRepository.create.mockResolvedValue(baseRental);

      const result = await service.createRental(renterId, { vehicleId });

      expect(rentalsRepository.create).toHaveBeenCalledWith({
        renterId,
        ownerId,
        vehicleId,
        startDate: null,
        endDate: null,
      });
      expect(result.data.status).toBe('PENDING');
      expect(result.data.owner.fullName).toBe('Test Owner');
      expect(JSON.stringify(result.data)).not.toContain('cnic');
      expect(rentalEventsService.emit).toHaveBeenCalledWith('RENTAL_CREATED', expect.any(Object));
    });

    it('rejects renting own vehicle', async () => {
      vehiclesRepository.findById.mockResolvedValue(baseVehicle);

      await expect(service.createRental(ownerId, { vehicleId })).rejects.toMatchObject({
        errorCode: 'RENTAL_OWN_VEHICLE',
      });
    });

    it('rejects unavailable vehicle', async () => {
      vehiclesRepository.findById.mockResolvedValue({
        ...baseVehicle,
        availability: VehicleAvailability.UNAVAILABLE,
      });

      await expect(service.createRental(renterId, { vehicleId })).rejects.toMatchObject({
        errorCode: 'VEHICLE_UNAVAILABLE',
      });
    });

    it('rejects archived vehicle', async () => {
      vehiclesRepository.findById.mockResolvedValue({
        ...baseVehicle,
        status: VehicleStatus.ARCHIVED,
      });

      await expect(service.createRental(renterId, { vehicleId })).rejects.toMatchObject({
        errorCode: 'VEHICLE_NOT_FOUND',
      });
    });

    it('rejects nonexistent vehicle', async () => {
      vehiclesRepository.findById.mockResolvedValue(null);

      await expect(service.createRental(renterId, { vehicleId })).rejects.toMatchObject({
        errorCode: 'VEHICLE_NOT_FOUND',
      });
    });

    it('rejects when vehicle is in an active rental', async () => {
      vehiclesRepository.findById.mockResolvedValue({
        ...baseVehicle,
        activeRentalId: 'other-rental',
      });

      await expect(service.createRental(renterId, { vehicleId })).rejects.toMatchObject({
        errorCode: 'VEHICLE_IN_ACTIVE_RENTAL',
      });
    });

    it('rejects duplicate request from same renter', async () => {
      vehiclesRepository.findById.mockResolvedValue(baseVehicle);
      usersRepository.findById.mockResolvedValue(baseOwner);
      rentalsRepository.findBlockingForRenterAndVehicle.mockResolvedValue(baseRental);

      await expect(service.createRental(renterId, { vehicleId })).rejects.toMatchObject({
        errorCode: 'RENTAL_DUPLICATE',
      });
    });

    it('rejects when vehicle has blocking rental from another renter', async () => {
      vehiclesRepository.findById.mockResolvedValue(baseVehicle);
      usersRepository.findById.mockResolvedValue(baseOwner);
      rentalsRepository.findBlockingForRenterAndVehicle.mockResolvedValue(null);
      rentalsRepository.findBlockingForVehicle.mockResolvedValue(baseRental);

      await expect(service.createRental(renterId, { vehicleId })).rejects.toMatchObject({
        errorCode: 'RENTAL_VEHICLE_CONFLICT',
      });
    });

    it('rejects invalid rental date range', async () => {
      await expect(
        service.createRental(renterId, {
          vehicleId,
          startDate: '2026-02-10T00:00:00.000Z',
          endDate: '2026-02-01T00:00:00.000Z',
        }),
      ).rejects.toMatchObject({ errorCode: 'VALIDATION_ERROR' });
    });
  });

  describe('acceptRental', () => {
    it('allows owner to accept pending rental and start pickup', async () => {
      rentalsRepository.findById.mockResolvedValue(baseRental);
      vehiclesRepository.findById.mockResolvedValue(baseVehicle);
      rentalsRepository.acceptPendingRental.mockResolvedValue({
        ...baseRental,
        status: RentalStatus.PICKUP_PENDING,
      });
      rentalsRepository.findRelatedIds.mockResolvedValue({
        agreementId: 'agreement-1',
        pickupHandoverId: 'handover-1',
      });

      const result = await service.acceptRental(ownerId, rentalId);

      expect(rentalsRepository.acceptPendingRental).toHaveBeenCalledWith(rentalId, vehicleId);
      expect(result.data.status).toBe('PICKUP_PENDING');
      expect(result.data.agreementId).toBe('agreement-1');
      expect(result.data.pickupHandoverId).toBe('handover-1');
      expect(rentalEventsService.emit).toHaveBeenCalledWith('RENTAL_ACCEPTED', expect.any(Object));
    });

    it('rejects accept from non-owner', async () => {
      rentalsRepository.findById.mockResolvedValue(baseRental);

      await expect(service.acceptRental(otherUserId, rentalId)).rejects.toMatchObject({
        errorCode: 'RENTAL_FORBIDDEN',
      });
    });

    it('rejects accept when rental is not pending', async () => {
      rentalsRepository.findById.mockResolvedValue({
        ...baseRental,
        status: RentalStatus.REJECTED,
      });

      await expect(service.acceptRental(ownerId, rentalId)).rejects.toMatchObject({
        errorCode: 'RENTAL_INVALID_TRANSITION',
      });
    });

    it('rejects accept when vehicle conflict occurs in transaction', async () => {
      rentalsRepository.findById.mockResolvedValue(baseRental);
      vehiclesRepository.findById.mockResolvedValue(baseVehicle);
      rentalsRepository.acceptPendingRental.mockRejectedValue(new Error('RENTAL_CONFLICT'));

      await expect(service.acceptRental(ownerId, rentalId)).rejects.toMatchObject({
        errorCode: 'RENTAL_VEHICLE_CONFLICT',
      });
    });

    it('rejects accept when an agreement already exists', async () => {
      rentalsRepository.findById.mockResolvedValue(baseRental);
      vehiclesRepository.findById.mockResolvedValue(baseVehicle);
      rentalsRepository.acceptPendingRental.mockRejectedValue(new Error('AGREEMENT_EXISTS'));

      await expect(service.acceptRental(ownerId, rentalId)).rejects.toMatchObject({
        errorCode: 'AGREEMENT_EXISTS',
      });
    });

    it('rejects accept when vehicle became unavailable', async () => {
      rentalsRepository.findById.mockResolvedValue(baseRental);
      vehiclesRepository.findById.mockResolvedValue({
        ...baseVehicle,
        availability: VehicleAvailability.UNAVAILABLE,
      });

      await expect(service.acceptRental(ownerId, rentalId)).rejects.toMatchObject({
        errorCode: 'VEHICLE_UNAVAILABLE',
      });
    });
  });

  describe('rejectRental', () => {
    it('allows owner to reject pending rental', async () => {
      rentalsRepository.findById.mockResolvedValue(baseRental);
      rentalsRepository.updateStatus.mockResolvedValue({
        ...baseRental,
        status: RentalStatus.REJECTED,
      });

      const result = await service.rejectRental(ownerId, rentalId);

      expect(result.data.status).toBe('REJECTED');
      expect(rentalEventsService.emit).toHaveBeenCalledWith('RENTAL_REJECTED', expect.any(Object));
    });

    it('rejects reject from non-owner', async () => {
      rentalsRepository.findById.mockResolvedValue(baseRental);

      await expect(service.rejectRental(otherUserId, rentalId)).rejects.toMatchObject({
        errorCode: 'RENTAL_FORBIDDEN',
      });
    });

    it('rejects reject when rental is already accepted', async () => {
      rentalsRepository.findById.mockResolvedValue({
        ...baseRental,
        status: RentalStatus.ACCEPTED,
      });

      await expect(service.rejectRental(ownerId, rentalId)).rejects.toMatchObject({
        errorCode: 'RENTAL_INVALID_TRANSITION',
      });
    });
  });

  describe('cancelRental', () => {
    it('allows renter to cancel pending rental', async () => {
      rentalsRepository.findById.mockResolvedValue(baseRental);
      rentalsRepository.updateStatus.mockResolvedValue({
        ...baseRental,
        status: RentalStatus.CANCELLED,
      });

      const result = await service.cancelRental(renterId, rentalId);

      expect(result.data.status).toBe('CANCELLED');
      expect(rentalEventsService.emit).toHaveBeenCalledWith('RENTAL_CANCELLED', expect.any(Object));
    });

    it('rejects cancel from non-renter', async () => {
      rentalsRepository.findById.mockResolvedValue(baseRental);

      await expect(service.cancelRental(otherUserId, rentalId)).rejects.toMatchObject({
        errorCode: 'RENTAL_FORBIDDEN',
      });
    });

    it('rejects cancel when rental is not pending', async () => {
      rentalsRepository.findById.mockResolvedValue({
        ...baseRental,
        status: RentalStatus.ACCEPTED,
      });

      await expect(service.cancelRental(renterId, rentalId)).rejects.toMatchObject({
        errorCode: 'RENTAL_INVALID_TRANSITION',
      });
    });
  });

  describe('getRental', () => {
    it('allows renter to view rental details', async () => {
      rentalsRepository.findById.mockResolvedValue(baseRental);
      rentalsRepository.findRelatedIds.mockResolvedValue({
        agreementId: 'agreement-1',
        pickupHandoverId: 'handover-1',
      });

      const result = await service.getRental(rentalId, renterId);

      expect(result.data.id).toBe(rentalId);
      expect(result.data.agreementId).toBe('agreement-1');
      expect(result.data.pickupHandoverId).toBe('handover-1');
      expect(JSON.stringify(result.data)).not.toContain('cnic');
    });

    it('allows owner to view rental details', async () => {
      rentalsRepository.findById.mockResolvedValue(baseRental);
      rentalsRepository.findRelatedIds.mockResolvedValue({
        agreementId: null,
        pickupHandoverId: null,
      });

      const result = await service.getRental(rentalId, ownerId);

      expect(result.data.id).toBe(rentalId);
    });

    it('denies unrelated user access', async () => {
      rentalsRepository.findById.mockResolvedValue(baseRental);

      await expect(service.getRental(rentalId, otherUserId)).rejects.toMatchObject({
        errorCode: 'RENTAL_FORBIDDEN',
      });
    });

    it('returns not found for missing rental', async () => {
      rentalsRepository.findById.mockResolvedValue(null);

      await expect(service.getRental(rentalId, renterId)).rejects.toMatchObject({
        errorCode: 'RENTAL_NOT_FOUND',
      });
    });
  });

  describe('listMyRentals', () => {
    it('returns renter rentals without private fields', async () => {
      rentalsRepository.findByRenter.mockResolvedValue([baseRental]);

      const result = await service.listMyRentals(renterId);

      expect(result.data).toHaveLength(1);
      expect(JSON.stringify(result.data)).not.toContain('cnic');
    });
  });

  describe('listIncomingRentals', () => {
    it('returns owner incoming rentals', async () => {
      rentalsRepository.findByOwner.mockResolvedValue([baseRental]);

      const result = await service.listIncomingRentals(ownerId);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.renter.fullName).toBe('Test Renter');
    });

    it('filters completed rentals when lifecycle is completed', async () => {
      rentalsRepository.findByOwner.mockResolvedValue([
        { ...baseRental, status: RentalStatus.COMPLETED },
      ]);

      const result = await service.listIncomingRentals(ownerId, 'completed');

      expect(rentalsRepository.findByOwner).toHaveBeenCalledWith(ownerId, 'completed');
      expect(result.data[0]?.status).toBe('COMPLETED');
    });
  });

  describe('completeRental', () => {
    const activeRental = {
      ...baseRental,
      status: RentalStatus.ACTIVE,
    };

    it('allows owner to complete active rental', async () => {
      const completedAt = new Date('2026-03-01T12:00:00.000Z');
      rentalsRepository.findById.mockResolvedValue(activeRental);
      rentalsRepository.completeActiveRental.mockResolvedValue({
        ...activeRental,
        status: RentalStatus.COMPLETED,
        completedAt,
        completedById: ownerId,
      });
      rentalsRepository.findRelatedIds.mockResolvedValue({
        agreementId: 'agreement-1',
        pickupHandoverId: 'handover-1',
      });

      const result = await service.completeRental(ownerId, rentalId);

      expect(rentalsRepository.completeActiveRental).toHaveBeenCalledWith(rentalId, ownerId);
      expect(result.data.status).toBe('COMPLETED');
      expect(result.data.completedAt).toBe(completedAt.toISOString());
      expect(result.data.completedById).toBe(ownerId);
      expect(result.data.pickupHandoverId).toBe('handover-1');
      expect(rentalEventsService.emit).toHaveBeenCalledWith(
        'RENTAL_COMPLETED',
        expect.objectContaining({
          rentalId,
          completedById: ownerId,
        }),
      );
    });

    it('allows renter to complete active rental', async () => {
      rentalsRepository.findById.mockResolvedValue(activeRental);
      rentalsRepository.completeActiveRental.mockResolvedValue({
        ...activeRental,
        status: RentalStatus.COMPLETED,
        completedAt: new Date(),
        completedById: renterId,
      });
      rentalsRepository.findRelatedIds.mockResolvedValue({
        agreementId: 'agreement-1',
        pickupHandoverId: 'handover-1',
      });

      const result = await service.completeRental(renterId, rentalId);

      expect(result.data.status).toBe('COMPLETED');
      expect(rentalsRepository.completeActiveRental).toHaveBeenCalledWith(rentalId, renterId);
    });

    it('rejects completion from non-participant', async () => {
      rentalsRepository.findById.mockResolvedValue(activeRental);

      await expect(service.completeRental(otherUserId, rentalId)).rejects.toMatchObject({
        errorCode: 'RENTAL_FORBIDDEN',
      });
    });

    it('rejects completion when rental is not active', async () => {
      rentalsRepository.findById.mockResolvedValue(baseRental);

      await expect(service.completeRental(ownerId, rentalId)).rejects.toMatchObject({
        errorCode: 'RENTAL_INVALID_TRANSITION',
      });
    });

    it('rejects completion when rental is already completed', async () => {
      rentalsRepository.findById.mockResolvedValue({
        ...activeRental,
        status: RentalStatus.COMPLETED,
      });

      await expect(service.completeRental(ownerId, rentalId)).rejects.toMatchObject({
        errorCode: 'RENTAL_INVALID_TRANSITION',
      });
    });

    it('maps repository NOT_ACTIVE error', async () => {
      rentalsRepository.findById.mockResolvedValue(activeRental);
      rentalsRepository.completeActiveRental.mockRejectedValue(new Error('NOT_ACTIVE'));

      await expect(service.completeRental(ownerId, rentalId)).rejects.toMatchObject({
        errorCode: 'RENTAL_INVALID_STATE',
      });
    });

    it('maps repository ALREADY_COMPLETED error', async () => {
      rentalsRepository.findById.mockResolvedValue(activeRental);
      rentalsRepository.completeActiveRental.mockRejectedValue(new Error('ALREADY_COMPLETED'));

      await expect(service.completeRental(ownerId, rentalId)).rejects.toMatchObject({
        errorCode: 'RENTAL_ALREADY_COMPLETED',
      });
    });

    it('maps missing approved agreement error', async () => {
      rentalsRepository.findById.mockResolvedValue(activeRental);
      rentalsRepository.completeActiveRental.mockRejectedValue(new Error('AGREEMENT_NOT_APPROVED'));

      await expect(service.completeRental(ownerId, rentalId)).rejects.toMatchObject({
        errorCode: 'AGREEMENT_NOT_APPROVED',
      });
    });

    it('maps missing approved handover error', async () => {
      rentalsRepository.findById.mockResolvedValue(activeRental);
      rentalsRepository.completeActiveRental.mockRejectedValue(new Error('HANDOVER_NOT_APPROVED'));

      await expect(service.completeRental(ownerId, rentalId)).rejects.toMatchObject({
        errorCode: 'HANDOVER_NOT_APPROVED',
      });
    });
  });
});
