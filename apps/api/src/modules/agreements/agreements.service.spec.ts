import { AgreementStatus, RentalStatus, VehicleAvailability, VehicleStatus } from '@prisma/client';
import { RentalsRepository } from '../rentals/rentals.repository';
import { AgreementEventsService } from './agreement-events.service';
import { AgreementsRepository } from './agreements.repository';
import { AgreementsService } from './agreements.service';

const ownerId = 'owner-1';
const renterId = 'renter-1';
const otherUserId = 'user-3';
const rentalId = 'rental-1';
const agreementId = 'agreement-1';
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
  status: RentalStatus.ACCEPTED,
  startDate: new Date('2026-02-01T00:00:00.000Z'),
  endDate: new Date('2026-02-05T00:00:00.000Z'),
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

const baseAgreement = {
  id: agreementId,
  rentalId,
  ownerId,
  renterId,
  vehicleId,
  status: AgreementStatus.PENDING_APPROVAL,
  version: 1,
  terms: 'Standard peer-to-peer rental terms apply.',
  startDate: baseRental.startDate,
  endDate: baseRental.endDate,
  ownerApprovedAt: null,
  renterApprovedAt: null,
  cancelledAt: null,
  cancelledById: null,
  approvedTerms: null,
  approvedStartDate: null,
  approvedEndDate: null,
  ownerCnicSnapshot: null,
  renterCnicSnapshot: null,
  createdAt: new Date('2026-01-03T00:00:00.000Z'),
  updatedAt: new Date('2026-01-03T00:00:00.000Z'),
  rental: { vehicle: baseVehicle },
  owner: {
    id: ownerId,
    fullName: 'Test Owner',
    profilePhotoUrl: null,
    cnic: '1111111111111',
  },
  renter: {
    id: renterId,
    fullName: 'Test Renter',
    profilePhotoUrl: null,
    cnic: '2222222222222',
  },
};

describe('AgreementsService', () => {
  let service: AgreementsService;
  let agreementsRepository: jest.Mocked<AgreementsRepository>;
  let rentalsRepository: jest.Mocked<RentalsRepository>;
  let agreementEventsService: jest.Mocked<AgreementEventsService>;

  beforeEach(() => {
    agreementsRepository = {
      findById: jest.fn(),
      findByRentalId: jest.fn(),
      findLatestByRentalId: jest.fn(),
      createWithRentalTransition: jest.fn(),
      approveParticipant: jest.fn(),
      cancelAgreement: jest.fn(),
      listAuditEntries: jest.fn(),
    };

    rentalsRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<RentalsRepository>;

    agreementEventsService = {
      emit: jest.fn(),
    };

    service = new AgreementsService(
      agreementsRepository,
      rentalsRepository,
      agreementEventsService,
    );
  });

  describe('createAgreement', () => {
    it('allows owner to create agreement for accepted rental', async () => {
      rentalsRepository.findById.mockResolvedValue(baseRental);
      agreementsRepository.findByRentalId.mockResolvedValue(null);
      agreementsRepository.createWithRentalTransition.mockResolvedValue(baseAgreement);

      const result = await service.createAgreement(ownerId, rentalId, {
        terms: 'Standard peer-to-peer rental terms apply.',
      });

      expect(agreementsRepository.createWithRentalTransition).toHaveBeenCalled();
      expect(result.data.status).toBe('PENDING_APPROVAL');
      expect(result.data.owner.cnic).toBe('1111111111111');
      expect(result.data.renter.cnic).toBe('2222222222222');
    });

    it('rejects agreement creation by non-owner', async () => {
      rentalsRepository.findById.mockResolvedValue(baseRental);

      await expect(
        service.createAgreement(renterId, rentalId, {
          terms: 'Standard peer-to-peer rental terms apply.',
        }),
      ).rejects.toMatchObject({ errorCode: 'AGREEMENT_FORBIDDEN' });
    });

    it('rejects agreement creation when rental is not accepted', async () => {
      rentalsRepository.findById.mockResolvedValue({
        ...baseRental,
        status: RentalStatus.PENDING,
      });

      await expect(
        service.createAgreement(ownerId, rentalId, {
          terms: 'Standard peer-to-peer rental terms apply.',
        }),
      ).rejects.toMatchObject({ errorCode: 'RENTAL_INVALID_STATE' });
    });

    it('rejects duplicate active agreement', async () => {
      rentalsRepository.findById.mockResolvedValue(baseRental);
      agreementsRepository.findByRentalId.mockResolvedValue(baseAgreement);

      await expect(
        service.createAgreement(ownerId, rentalId, {
          terms: 'Standard peer-to-peer rental terms apply.',
        }),
      ).rejects.toMatchObject({ errorCode: 'AGREEMENT_EXISTS' });
    });
  });

  describe('getAgreement', () => {
    it('returns agreement with CNIC for renter participant', async () => {
      agreementsRepository.findById.mockResolvedValue(baseAgreement);

      const result = await service.getAgreement(agreementId, renterId);

      expect(result.data.owner.cnic).toBe('1111111111111');
      expect(result.data.renter.cnic).toBe('2222222222222');
    });

    it('denies unrelated user access to agreement', async () => {
      agreementsRepository.findById.mockResolvedValue(baseAgreement);

      await expect(service.getAgreement(agreementId, otherUserId)).rejects.toMatchObject({
        errorCode: 'AGREEMENT_FORBIDDEN',
      });
    });
  });

  describe('approveAgreement', () => {
    it('records owner approval without fully approving agreement', async () => {
      agreementsRepository.findById.mockResolvedValue(baseAgreement);
      agreementsRepository.approveParticipant.mockResolvedValue({
        ...baseAgreement,
        ownerApprovedAt: new Date('2026-01-04T00:00:00.000Z'),
      });

      const result = await service.approveAgreement(ownerId, agreementId);

      expect(result.data.ownerApprovedAt).toBeTruthy();
      expect(result.data.status).toBe('PENDING_APPROVAL');
      expect(agreementEventsService.emit).toHaveBeenCalledWith(
        'AGREEMENT_OWNER_APPROVED',
        expect.any(Object),
      );
    });

    it('fully approves agreement after renter approval when owner already approved', async () => {
      agreementsRepository.findById.mockResolvedValue({
        ...baseAgreement,
        ownerApprovedAt: new Date('2026-01-04T00:00:00.000Z'),
      });
      agreementsRepository.approveParticipant.mockResolvedValue({
        ...baseAgreement,
        status: AgreementStatus.APPROVED,
        ownerApprovedAt: new Date('2026-01-04T00:00:00.000Z'),
        renterApprovedAt: new Date('2026-01-05T00:00:00.000Z'),
        approvedTerms: baseAgreement.terms,
      });

      const result = await service.approveAgreement(renterId, agreementId);

      expect(result.data.status).toBe('APPROVED');
      expect(agreementEventsService.emit).toHaveBeenCalledWith(
        'AGREEMENT_FULLY_APPROVED',
        expect.any(Object),
      );
    });

    it('rejects duplicate approval by same participant', async () => {
      agreementsRepository.findById.mockResolvedValue(baseAgreement);
      agreementsRepository.approveParticipant.mockRejectedValue(new Error('ALREADY_APPROVED'));

      await expect(service.approveAgreement(ownerId, agreementId)).rejects.toMatchObject({
        errorCode: 'AGREEMENT_ALREADY_APPROVED',
      });
    });

    it('rejects approval from unrelated user', async () => {
      agreementsRepository.findById.mockResolvedValue(baseAgreement);

      await expect(service.approveAgreement(otherUserId, agreementId)).rejects.toMatchObject({
        errorCode: 'AGREEMENT_FORBIDDEN',
      });
    });

    it('rejects approval when agreement is already approved', async () => {
      agreementsRepository.findById.mockResolvedValue({
        ...baseAgreement,
        status: AgreementStatus.APPROVED,
      });

      await expect(service.approveAgreement(ownerId, agreementId)).rejects.toMatchObject({
        errorCode: 'AGREEMENT_INVALID_STATE',
      });
    });
  });

  describe('cancelAgreement', () => {
    it('allows owner to cancel pending agreement', async () => {
      agreementsRepository.findById.mockResolvedValue(baseAgreement);
      agreementsRepository.cancelAgreement.mockResolvedValue({
        ...baseAgreement,
        status: AgreementStatus.CANCELLED,
      });

      const result = await service.cancelAgreement(ownerId, agreementId);

      expect(result.data.status).toBe('CANCELLED');
      expect(agreementEventsService.emit).toHaveBeenCalledWith(
        'AGREEMENT_CANCELLED',
        expect.any(Object),
      );
    });

    it('rejects cancellation by unrelated user', async () => {
      agreementsRepository.findById.mockResolvedValue(baseAgreement);

      await expect(service.cancelAgreement(otherUserId, agreementId)).rejects.toMatchObject({
        errorCode: 'AGREEMENT_FORBIDDEN',
      });
    });

    it('rejects cancellation after approval', async () => {
      agreementsRepository.findById.mockResolvedValue({
        ...baseAgreement,
        status: AgreementStatus.APPROVED,
      });

      await expect(service.cancelAgreement(ownerId, agreementId)).rejects.toMatchObject({
        errorCode: 'AGREEMENT_INVALID_STATE',
      });
    });
  });

  describe('CNIC privacy', () => {
    it('does not expose CNIC through rental summary paths', async () => {
      rentalsRepository.findById.mockResolvedValue(baseRental);
      agreementsRepository.findLatestByRentalId.mockResolvedValue(baseAgreement);

      const result = await service.getAgreementByRental(rentalId, renterId);

      expect(result.data.owner.cnic).toBeTruthy();
      expect(JSON.stringify(baseRental)).not.toContain('cnic');
    });
  });
});
