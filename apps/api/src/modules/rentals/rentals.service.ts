import { Injectable } from '@nestjs/common';
import { RentalStatus, VehicleAvailability } from '@prisma/client';
import type {
  ApiResponse,
  RentalDetailView,
  RentalLifecycleFilter,
  RentalSummary,
} from '@rentacar/shared';
import { DomainError } from '../../common/errors/domain.error';
import { isUserActive } from '../users/user.mapper';
import { UsersRepository } from '../users/users.repository';
import { isVehicleActive } from '../vehicles/vehicle.mapper';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { CreateRentalDto } from './dto/create-rental.dto';
import { RentalEventsService } from './rental-events.service';
import {
  assertRentalDetailIsSafe,
  assertRentalSummaryIsPublicSafe,
  toRentalDetailView,
  toRentalSummary,
} from './rental.mapper';
import { BLOCKING_RENTAL_STATUSES, canTransitionRental } from './rental-state.constants';
import type { RentalRecord } from './rentals.repository';
import { RentalsRepository } from './rentals.repository';

@Injectable()
export class RentalsService {
  constructor(
    private readonly rentalsRepository: RentalsRepository,
    private readonly vehiclesRepository: VehiclesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly rentalEventsService: RentalEventsService,
  ) {}

  async createRental(renterId: string, dto: CreateRentalDto): Promise<ApiResponse<RentalSummary>> {
    const { startDate, endDate } = this.parseOptionalRentalDates(dto.startDate, dto.endDate);

    const vehicle = await this.vehiclesRepository.findById(dto.vehicleId);
    if (!vehicle || !isVehicleActive(vehicle)) {
      throw new DomainError('Vehicle not found', 'VEHICLE_NOT_FOUND', 404);
    }

    if (vehicle.availability !== VehicleAvailability.AVAILABLE) {
      throw new DomainError('Vehicle is not available', 'VEHICLE_UNAVAILABLE', 409);
    }

    if (vehicle.activeRentalId) {
      throw new DomainError('Vehicle is currently rented', 'VEHICLE_IN_ACTIVE_RENTAL', 409);
    }

    if (vehicle.ownerId === renterId) {
      throw new DomainError('You cannot rent your own vehicle', 'RENTAL_OWN_VEHICLE', 409);
    }

    const owner = await this.usersRepository.findById(vehicle.ownerId);
    if (!owner || !isUserActive(owner)) {
      throw new DomainError('Vehicle owner not found', 'OWNER_NOT_FOUND', 404);
    }

    const existingForRenter = await this.rentalsRepository.findBlockingForRenterAndVehicle(
      renterId,
      dto.vehicleId,
    );
    if (existingForRenter) {
      throw new DomainError(
        'You already have an active rental request for this vehicle',
        'RENTAL_DUPLICATE',
        409,
      );
    }

    const committedForVehicle = await this.rentalsRepository.findCommittedForVehicle(dto.vehicleId);
    if (committedForVehicle) {
      throw new DomainError(
        'This vehicle already has an accepted rental',
        'RENTAL_VEHICLE_CONFLICT',
        409,
      );
    }

    const rental = await this.rentalsRepository.create({
      renterId,
      ownerId: vehicle.ownerId,
      vehicleId: dto.vehicleId,
      startDate,
      endDate,
    });

    const summary = toRentalSummary(rental);
    assertRentalSummaryIsPublicSafe(summary);

    this.rentalEventsService.emit('RENTAL_CREATED', {
      rentalId: rental.id,
      renterId: rental.renterId,
      ownerId: rental.ownerId,
      vehicleId: rental.vehicleId,
      status: rental.status,
    });

    return { data: summary };
  }

  async listMyRentals(
    renterId: string,
    lifecycle: RentalLifecycleFilter = 'all',
  ): Promise<ApiResponse<RentalSummary[]>> {
    const rentals = await this.rentalsRepository.findByRenter(renterId, lifecycle);
    const data = rentals.map((rental) => {
      const summary = toRentalSummary(rental);
      assertRentalSummaryIsPublicSafe(summary);
      return summary;
    });
    return { data };
  }

  async listIncomingRentals(
    ownerId: string,
    lifecycle: RentalLifecycleFilter = 'all',
  ): Promise<ApiResponse<RentalSummary[]>> {
    const rentals = await this.rentalsRepository.findByOwner(ownerId, lifecycle);
    const data = rentals.map((rental) => {
      const summary = toRentalSummary(rental);
      assertRentalSummaryIsPublicSafe(summary);
      return summary;
    });
    return { data };
  }

  async getRental(rentalId: string, userId: string): Promise<ApiResponse<RentalDetailView>> {
    const rental = await this.getParticipantRentalOrThrow(rentalId, userId);
    const related = await this.rentalsRepository.findRelatedIds(rentalId);
    const detail = toRentalDetailView(rental, related);
    assertRentalDetailIsSafe(detail);
    return { data: detail };
  }

  async completeRental(userId: string, rentalId: string): Promise<ApiResponse<RentalDetailView>> {
    const rental = await this.getParticipantRentalOrThrow(rentalId, userId);

    if (rental.renterId !== userId && rental.ownerId !== userId) {
      throw new DomainError('You cannot complete this rental', 'RENTAL_FORBIDDEN', 403);
    }

    this.assertTransitionAllowed(rental.status, RentalStatus.COMPLETED);

    let updated: RentalRecord;
    try {
      updated = await this.rentalsRepository.completeActiveRental(rentalId, userId);
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case 'NOT_ACTIVE':
            throw new DomainError('Rental is not active', 'RENTAL_INVALID_STATE', 409);
          case 'ALREADY_COMPLETED':
            throw new DomainError('Rental is already completed', 'RENTAL_ALREADY_COMPLETED', 409);
          case 'AGREEMENT_NOT_APPROVED':
            throw new DomainError(
              'Rental agreement must be approved before completion',
              'AGREEMENT_NOT_APPROVED',
              409,
            );
          case 'HANDOVER_NOT_APPROVED':
            throw new DomainError(
              'Pickup handover must be approved before completion',
              'HANDOVER_NOT_APPROVED',
              409,
            );
          default:
            break;
        }
      }
      throw error;
    }

    const related = await this.rentalsRepository.findRelatedIds(rentalId);
    const detail = toRentalDetailView(updated, related);
    assertRentalDetailIsSafe(detail);

    this.rentalEventsService.emit('RENTAL_COMPLETED', {
      rentalId: updated.id,
      renterId: updated.renterId,
      ownerId: updated.ownerId,
      vehicleId: updated.vehicleId,
      status: updated.status,
      completedById: userId,
      ...(updated.completedAt ? { completedAt: updated.completedAt.toISOString() } : {}),
    });

    return { data: detail };
  }

  async acceptRental(ownerId: string, rentalId: string): Promise<ApiResponse<RentalDetailView>> {
    const rental = await this.getRentalOrThrow(rentalId);

    if (rental.ownerId !== ownerId) {
      throw new DomainError('You cannot accept this rental request', 'RENTAL_FORBIDDEN', 403);
    }

    this.assertTransitionAllowed(rental.status, RentalStatus.ACCEPTED);

    const vehicle = await this.vehiclesRepository.findById(rental.vehicleId);
    if (!vehicle || !isVehicleActive(vehicle)) {
      throw new DomainError('Vehicle not found', 'VEHICLE_NOT_FOUND', 404);
    }

    if (vehicle.availability !== VehicleAvailability.AVAILABLE) {
      throw new DomainError('Vehicle is no longer available', 'VEHICLE_UNAVAILABLE', 409);
    }

    if (vehicle.activeRentalId) {
      throw new DomainError('Vehicle is currently rented', 'VEHICLE_IN_ACTIVE_RENTAL', 409);
    }

    let updated: RentalRecord;
    try {
      const result = await this.rentalsRepository.acceptPendingRental(rentalId, rental.vehicleId);
      if (!result) {
        throw new DomainError('Rental request is no longer pending', 'RENTAL_INVALID_STATE', 409);
      }
      updated = result;
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case 'RENTAL_CONFLICT':
            throw new DomainError(
              'Another rental request is already active for this vehicle',
              'RENTAL_VEHICLE_CONFLICT',
              409,
            );
          case 'AGREEMENT_EXISTS':
            throw new DomainError(
              'An active agreement already exists for this rental',
              'AGREEMENT_EXISTS',
              409,
            );
          case 'PARTICIPANT_NOT_FOUND':
            throw new DomainError('Rental participant not found', 'OWNER_NOT_FOUND', 404);
          default:
            break;
        }
      }
      throw error;
    }

    const related = await this.rentalsRepository.findRelatedIds(rentalId);
    const detail = toRentalDetailView(updated, related);
    assertRentalDetailIsSafe(detail);

    this.rentalEventsService.emit('RENTAL_ACCEPTED', {
      rentalId: updated.id,
      renterId: updated.renterId,
      ownerId: updated.ownerId,
      vehicleId: updated.vehicleId,
      status: updated.status,
    });

    return { data: detail };
  }

  async rejectRental(ownerId: string, rentalId: string): Promise<ApiResponse<RentalSummary>> {
    const rental = await this.getRentalOrThrow(rentalId);

    if (rental.ownerId !== ownerId) {
      throw new DomainError('You cannot reject this rental request', 'RENTAL_FORBIDDEN', 403);
    }

    this.assertTransitionAllowed(rental.status, RentalStatus.REJECTED);

    const updated = await this.rentalsRepository.updateStatus(rentalId, RentalStatus.REJECTED);
    const summary = toRentalSummary(updated);
    assertRentalSummaryIsPublicSafe(summary);

    this.rentalEventsService.emit('RENTAL_REJECTED', {
      rentalId: updated.id,
      renterId: updated.renterId,
      ownerId: updated.ownerId,
      vehicleId: updated.vehicleId,
      status: updated.status,
    });

    return { data: summary };
  }

  async cancelRental(userId: string, rentalId: string): Promise<ApiResponse<RentalSummary>> {
    const rental = await this.getRentalOrThrow(rentalId);

    if (rental.renterId !== userId && rental.ownerId !== userId) {
      throw new DomainError('You cannot cancel this rental', 'RENTAL_FORBIDDEN', 403);
    }

    if (rental.status === RentalStatus.PENDING && rental.renterId !== userId) {
      throw new DomainError(
        'Owners reject pending requests instead of cancelling them',
        'RENTAL_FORBIDDEN',
        403,
      );
    }

    this.assertTransitionAllowed(rental.status, RentalStatus.CANCELLED);

    let updated: RentalRecord;
    try {
      updated = await this.rentalsRepository.cancelRental(rentalId, userId);
    } catch (error) {
      if (error instanceof Error && error.message === 'NOT_CANCELLABLE') {
        throw new DomainError(
          'This rental cannot be cancelled in its current state',
          'RENTAL_INVALID_STATE',
          409,
        );
      }
      throw error;
    }

    const summary = toRentalSummary(updated);
    assertRentalSummaryIsPublicSafe(summary);

    this.rentalEventsService.emit('RENTAL_CANCELLED', {
      rentalId: updated.id,
      renterId: updated.renterId,
      ownerId: updated.ownerId,
      vehicleId: updated.vehicleId,
      status: updated.status,
    });

    return { data: summary };
  }

  private async getRentalOrThrow(rentalId: string): Promise<RentalRecord> {
    const rental = await this.rentalsRepository.findById(rentalId);
    if (!rental) {
      throw new DomainError('Rental not found', 'RENTAL_NOT_FOUND', 404);
    }
    return rental;
  }

  private async getParticipantRentalOrThrow(
    rentalId: string,
    userId: string,
  ): Promise<RentalRecord> {
    const rental = await this.getRentalOrThrow(rentalId);
    if (rental.renterId !== userId && rental.ownerId !== userId) {
      throw new DomainError('You do not have access to this rental', 'RENTAL_FORBIDDEN', 403);
    }
    return rental;
  }

  private assertTransitionAllowed(from: RentalStatus, to: RentalStatus): void {
    if (!canTransitionRental(from, to)) {
      throw new DomainError(
        `Cannot transition rental from ${from} to ${to}`,
        'RENTAL_INVALID_TRANSITION',
        409,
        { from, to, blockingStatuses: BLOCKING_RENTAL_STATUSES },
      );
    }
  }

  private parseOptionalRentalDates(
    startDateRaw?: string,
    endDateRaw?: string,
  ): { startDate: Date | null; endDate: Date | null } {
    const startDate = startDateRaw ? new Date(startDateRaw) : null;
    const endDate = endDateRaw ? new Date(endDateRaw) : null;

    if (startDate && Number.isNaN(startDate.getTime())) {
      throw new DomainError('Invalid start date', 'VALIDATION_ERROR', 400);
    }

    if (endDate && Number.isNaN(endDate.getTime())) {
      throw new DomainError('Invalid end date', 'VALIDATION_ERROR', 400);
    }

    if (startDate && endDate && endDate < startDate) {
      throw new DomainError('End date must be on or after start date', 'VALIDATION_ERROR', 400);
    }

    return { startDate, endDate };
  }
}
