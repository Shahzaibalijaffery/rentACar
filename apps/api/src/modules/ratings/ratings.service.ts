import { Injectable } from '@nestjs/common';
import { Prisma, RatingTarget, RentalStatus } from '@prisma/client';
import {
  toRatingSummary,
  type ApiResponse,
  type CreateRatingRequest,
  type PublicRatingListView,
  type RentalRatingsView,
} from '@rentacar/shared';
import { DomainError } from '../../common/errors/domain.error';
import { UsersRepository } from '../users/users.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { RentalsRepository } from '../rentals/rentals.repository';
import { RATEABLE_RENTAL_STATUSES } from './rating.constants';
import { normalizeRatingComment, toPublicRatingListView, toRatingPublicView } from './rating.mapper';
import { RatingsRepository } from './ratings.repository';

@Injectable()
export class RatingsService {
  constructor(
    private readonly ratingsRepository: RatingsRepository,
    private readonly rentalsRepository: RentalsRepository,
    private readonly vehiclesRepository: VehiclesRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async getRentalRatings(rentalId: string, userId: string): Promise<ApiResponse<RentalRatingsView>> {
    const rental = await this.getParticipantRentalOrThrow(rentalId, userId);
    const ratings = await this.ratingsRepository.findByRentalId(rentalId);
    const myRating = ratings.find((rating) => rating.raterId === userId) ?? null;
    const counterpartyRating = ratings.find((rating) => rating.raterId !== userId) ?? null;
    const canSubmit =
      RATEABLE_RENTAL_STATUSES.includes(rental.status) &&
      rental.status !== RentalStatus.RATED &&
      myRating === null;

    return {
      data: {
        rentalId,
        myRating: myRating ? toRatingPublicView(myRating) : null,
        counterpartyRating: counterpartyRating ? toRatingPublicView(counterpartyRating) : null,
        canSubmit,
      },
    };
  }

  async submitRentalRating(
    rentalId: string,
    userId: string,
    dto: CreateRatingRequest,
  ): Promise<ApiResponse<RentalRatingsView>> {
    const rental = await this.getParticipantRentalOrThrow(rentalId, userId);

    if (!RATEABLE_RENTAL_STATUSES.includes(rental.status)) {
      throw new DomainError(
        'Ratings can only be submitted after the rental is completed',
        'RATING_NOT_ALLOWED',
        409,
      );
    }

    const existing = await this.ratingsRepository.findByRentalAndRater(rentalId, userId);
    if (existing) {
      throw new DomainError('You have already rated this rental', 'RATING_ALREADY_SUBMITTED', 409);
    }

    const isRenter = rental.renterId === userId;
    const target = isRenter ? RatingTarget.VEHICLE : RatingTarget.RENTER;
    const rateeId = isRenter ? rental.ownerId : rental.renterId;

    try {
      await this.ratingsRepository.create({
        rentalId,
        vehicleId: rental.vehicleId,
        raterId: userId,
        rateeId,
        target,
        stars: dto.stars,
        comment: normalizeRatingComment(dto.comment),
      });
    } catch (error) {
      this.mapRepositoryError(error);
      throw error;
    }

    return this.getRentalRatings(rentalId, userId);
  }

  async getVehicleRatings(vehicleId: string): Promise<ApiResponse<PublicRatingListView>> {
    const vehicle = await this.vehiclesRepository.findById(vehicleId);
    if (!vehicle) {
      throw new DomainError('Vehicle not found', 'VEHICLE_NOT_FOUND', 404);
    }

    const ratings = await this.ratingsRepository.findPublicForVehicle(vehicleId);
    return {
      data: {
        summary: toRatingSummary(vehicle.ratingAverage, vehicle.ratingCount),
        reviews: ratings.map(toRatingPublicView),
      },
    };
  }

  async getRenterRatings(userId: string): Promise<ApiResponse<PublicRatingListView>> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new DomainError('Profile not found', 'USER_NOT_FOUND', 404);
    }

    const ratings = await this.ratingsRepository.findPublicForRenter(userId);
    return { data: toPublicRatingListView(ratings) };
  }

  private async getParticipantRentalOrThrow(rentalId: string, userId: string) {
    const rental = await this.rentalsRepository.findById(rentalId);
    if (!rental) {
      throw new DomainError('Rental not found', 'RENTAL_NOT_FOUND', 404);
    }

    if (rental.renterId !== userId && rental.ownerId !== userId) {
      throw new DomainError('You do not have access to this rental', 'RENTAL_FORBIDDEN', 403);
    }

    return rental;
  }

  private mapRepositoryError(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new DomainError('You have already rated this rental', 'RATING_ALREADY_SUBMITTED', 409);
    }
  }
}
