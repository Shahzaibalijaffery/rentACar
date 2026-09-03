import { Injectable } from '@nestjs/common';
import { RentalStatus } from '@prisma/client';
import type { ApiResponse, RentalAgreementView } from '@rentacar/shared';
import { DomainError } from '../../common/errors/domain.error';
import { runPrivacyAssert } from '../../common/utils/privacy-assert';
import { RentalsRepository } from '../rentals/rentals.repository';
import { AgreementEventsService } from './agreement-events.service';
import { assertAgreementViewParticipantOnly, toRentalAgreementView } from './agreement.mapper';
import type { AgreementRecord } from './agreements.repository';
import { AgreementsRepository } from './agreements.repository';
import { CreateAgreementDto } from './dto/create-agreement.dto';

@Injectable()
export class AgreementsService {
  constructor(
    private readonly agreementsRepository: AgreementsRepository,
    private readonly rentalsRepository: RentalsRepository,
    private readonly agreementEventsService: AgreementEventsService,
  ) {}

  async createAgreement(
    ownerId: string,
    rentalId: string,
    dto: CreateAgreementDto,
  ): Promise<ApiResponse<RentalAgreementView>> {
    const rental = await this.rentalsRepository.findById(rentalId);
    if (!rental) {
      throw new DomainError('Rental not found', 'RENTAL_NOT_FOUND', 404);
    }

    if (rental.ownerId !== ownerId) {
      throw new DomainError(
        'Only the vehicle owner can create the agreement',
        'AGREEMENT_FORBIDDEN',
        403,
      );
    }

    if (rental.status !== RentalStatus.ACCEPTED) {
      throw new DomainError(
        'Agreement can only be created for accepted rentals',
        'RENTAL_INVALID_STATE',
        409,
      );
    }

    const existing = await this.agreementsRepository.findByRentalId(rentalId);
    if (existing) {
      throw new DomainError(
        'An active agreement already exists for this rental',
        'AGREEMENT_EXISTS',
        409,
      );
    }

    const { startDate, endDate } = this.parseRentalDates(
      dto.startDate,
      dto.endDate,
      rental.startDate,
      rental.endDate,
    );

    let agreement: AgreementRecord;
    try {
      agreement = await this.agreementsRepository.createWithRentalTransition({
        rentalId,
        ownerId: rental.ownerId,
        renterId: rental.renterId,
        vehicleId: rental.vehicleId,
        terms: dto.terms.trim(),
        startDate,
        endDate,
        actorId: ownerId,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'RENTAL_NOT_ACCEPTED') {
          throw new DomainError(
            'Agreement can only be created for accepted rentals',
            'RENTAL_INVALID_STATE',
            409,
          );
        }
        if (error.message === 'AGREEMENT_EXISTS') {
          throw new DomainError(
            'An active agreement already exists for this rental',
            'AGREEMENT_EXISTS',
            409,
          );
        }
      }
      throw error;
    }

    const view = toRentalAgreementView(agreement);
    runPrivacyAssert('agreement.view', () => assertAgreementViewParticipantOnly(view, ownerId));

    this.agreementEventsService.emit('AGREEMENT_CREATED', this.toEventPayload(agreement));
    this.agreementEventsService.emit('AGREEMENT_OWNER_APPROVED', this.toEventPayload(agreement));

    return { data: view };
  }

  async getAgreement(
    agreementId: string,
    userId: string,
  ): Promise<ApiResponse<RentalAgreementView>> {
    const agreement = await this.getParticipantAgreementOrThrow(agreementId, userId);
    const view = toRentalAgreementView(agreement);
    runPrivacyAssert('agreement.view', () => assertAgreementViewParticipantOnly(view, userId));
    return { data: view };
  }

  async getAgreementByRental(
    rentalId: string,
    userId: string,
  ): Promise<ApiResponse<RentalAgreementView>> {
    const rental = await this.rentalsRepository.findById(rentalId);
    if (!rental) {
      throw new DomainError('Rental not found', 'RENTAL_NOT_FOUND', 404);
    }

    if (rental.renterId !== userId && rental.ownerId !== userId) {
      throw new DomainError('You do not have access to this rental', 'RENTAL_FORBIDDEN', 403);
    }

    const agreement = await this.agreementsRepository.findLatestByRentalId(rentalId);
    if (!agreement) {
      throw new DomainError('Agreement not found', 'AGREEMENT_NOT_FOUND', 404);
    }

    const view = toRentalAgreementView(agreement);
    runPrivacyAssert('agreement.view', () => assertAgreementViewParticipantOnly(view, userId));
    return { data: view };
  }

  async approveAgreement(
    userId: string,
    agreementId: string,
  ): Promise<ApiResponse<RentalAgreementView>> {
    const agreement = await this.getAgreementOrThrow(agreementId);

    if (agreement.ownerId !== userId && agreement.renterId !== userId) {
      throw new DomainError('You cannot approve this agreement', 'AGREEMENT_FORBIDDEN', 403);
    }

    if (agreement.status !== 'PENDING_APPROVAL') {
      throw new DomainError('Agreement is not awaiting approval', 'AGREEMENT_INVALID_STATE', 409);
    }

    const role = agreement.ownerId === userId ? 'owner' : 'renter';

    let updated: AgreementRecord | null;
    try {
      updated = await this.agreementsRepository.approveParticipant(agreementId, userId, role);
    } catch (error) {
      if (error instanceof Error && error.message === 'ALREADY_APPROVED') {
        throw new DomainError(
          'You have already approved this agreement',
          'AGREEMENT_ALREADY_APPROVED',
          409,
        );
      }
      if (
        error instanceof Error &&
        (error.message === 'NOT_OWNER' || error.message === 'NOT_RENTER')
      ) {
        throw new DomainError('You cannot approve this agreement', 'AGREEMENT_FORBIDDEN', 403);
      }
      throw error;
    }

    if (!updated) {
      throw new DomainError('Agreement is not awaiting approval', 'AGREEMENT_INVALID_STATE', 409);
    }

    const view = toRentalAgreementView(updated);
    runPrivacyAssert('agreement.view', () => assertAgreementViewParticipantOnly(view, userId));

    if (role === 'owner') {
      this.agreementEventsService.emit('AGREEMENT_OWNER_APPROVED', this.toEventPayload(updated));
    } else {
      this.agreementEventsService.emit('AGREEMENT_RENTER_APPROVED', this.toEventPayload(updated));
    }

    if (updated.status === 'APPROVED') {
      this.agreementEventsService.emit('AGREEMENT_FULLY_APPROVED', this.toEventPayload(updated));
    }

    return { data: view };
  }

  async cancelAgreement(
    userId: string,
    agreementId: string,
  ): Promise<ApiResponse<RentalAgreementView>> {
    const agreement = await this.getAgreementOrThrow(agreementId);

    if (agreement.ownerId !== userId && agreement.renterId !== userId) {
      throw new DomainError('You cannot cancel this agreement', 'AGREEMENT_FORBIDDEN', 403);
    }

    if (agreement.status !== 'PENDING_APPROVAL' && agreement.status !== 'DRAFT') {
      throw new DomainError(
        'Agreement cannot be cancelled in its current state',
        'AGREEMENT_INVALID_STATE',
        409,
      );
    }

    const updated = await this.agreementsRepository.cancelAgreement(agreementId, userId);
    if (!updated) {
      throw new DomainError(
        'Agreement cannot be cancelled in its current state',
        'AGREEMENT_INVALID_STATE',
        409,
      );
    }

    const view = toRentalAgreementView(updated);
    runPrivacyAssert('agreement.view', () => assertAgreementViewParticipantOnly(view, userId));

    this.agreementEventsService.emit('AGREEMENT_CANCELLED', this.toEventPayload(updated));

    return { data: view };
  }

  private async getAgreementOrThrow(agreementId: string): Promise<AgreementRecord> {
    const agreement = await this.agreementsRepository.findById(agreementId);
    if (!agreement) {
      throw new DomainError('Agreement not found', 'AGREEMENT_NOT_FOUND', 404);
    }
    return agreement;
  }

  private async getParticipantAgreementOrThrow(
    agreementId: string,
    userId: string,
  ): Promise<AgreementRecord> {
    const agreement = await this.getAgreementOrThrow(agreementId);
    if (agreement.ownerId !== userId && agreement.renterId !== userId) {
      throw new DomainError('You do not have access to this agreement', 'AGREEMENT_FORBIDDEN', 403);
    }
    return agreement;
  }

  private parseRentalDates(
    startDateRaw?: string,
    endDateRaw?: string,
    rentalStart?: Date | null,
    rentalEnd?: Date | null,
  ): { startDate: Date | null; endDate: Date | null } {
    const startDate = startDateRaw
      ? new Date(startDateRaw)
      : rentalStart
        ? new Date(rentalStart)
        : null;
    const endDate = endDateRaw ? new Date(endDateRaw) : rentalEnd ? new Date(rentalEnd) : null;

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

  private toEventPayload(agreement: AgreementRecord) {
    return {
      agreementId: agreement.id,
      rentalId: agreement.rentalId,
      ownerId: agreement.ownerId,
      renterId: agreement.renterId,
      vehicleId: agreement.vehicleId,
      status: agreement.status,
    };
  }
}
