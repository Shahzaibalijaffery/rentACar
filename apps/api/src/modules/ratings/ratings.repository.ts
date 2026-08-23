import { Injectable } from '@nestjs/common';
import { Prisma, RatingTarget, RentalStatus } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';
import { RATING_LIST_LIMIT } from './rating.constants';

const ratingInclude = {
  rater: {
    select: {
      id: true,
      fullName: true,
      profilePhotoUrl: true,
    },
  },
} satisfies Prisma.RatingInclude;

export type RatingRecord = Prisma.RatingGetPayload<{
  include: typeof ratingInclude;
}>;

export type CreateRatingInput = {
  rentalId: string;
  vehicleId: string;
  raterId: string;
  rateeId: string;
  target: RatingTarget;
  stars: number;
  comment: string | null;
};

@Injectable()
export class RatingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByRentalId(rentalId: string): Promise<RatingRecord[]> {
    return this.prisma.rating.findMany({
      where: { rentalId },
      include: ratingInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  findByRentalAndRater(rentalId: string, raterId: string): Promise<RatingRecord | null> {
    return this.prisma.rating.findUnique({
      where: {
        rentalId_raterId: { rentalId, raterId },
      },
      include: ratingInclude,
    });
  }

  findPublicForVehicle(vehicleId: string): Promise<RatingRecord[]> {
    return this.prisma.rating.findMany({
      where: { vehicleId, target: RatingTarget.VEHICLE },
      include: ratingInclude,
      orderBy: { createdAt: 'desc' },
      take: RATING_LIST_LIMIT,
    });
  }

  findPublicForRenter(rateeId: string): Promise<RatingRecord[]> {
    return this.prisma.rating.findMany({
      where: { rateeId, target: RatingTarget.RENTER },
      include: ratingInclude,
      orderBy: { createdAt: 'desc' },
      take: RATING_LIST_LIMIT,
    });
  }

  create(input: CreateRatingInput): Promise<RatingRecord> {
    return this.prisma.$transaction(async (tx) => {
      const rating = await tx.rating.create({
        data: {
          rentalId: input.rentalId,
          vehicleId: input.vehicleId,
          raterId: input.raterId,
          rateeId: input.rateeId,
          target: input.target,
          stars: input.stars,
          comment: input.comment,
        },
        include: ratingInclude,
      });

      if (input.target === RatingTarget.VEHICLE) {
        await this.refreshVehicleAggregate(tx, input.vehicleId);
      } else {
        await this.refreshRenterAggregate(tx, input.rateeId);
      }

      const ratingCount = await tx.rating.count({ where: { rentalId: input.rentalId } });
      if (ratingCount >= 2) {
        await tx.rental.updateMany({
          where: { id: input.rentalId, status: RentalStatus.COMPLETED },
          data: { status: RentalStatus.RATED },
        });
      }

      return rating;
    });
  }

  private async refreshVehicleAggregate(
    tx: Prisma.TransactionClient,
    vehicleId: string,
  ): Promise<void> {
    const aggregate = await tx.rating.aggregate({
      where: { vehicleId, target: RatingTarget.VEHICLE },
      _avg: { stars: true },
      _count: { _all: true },
    });

    await tx.vehicle.update({
      where: { id: vehicleId },
      data: {
        ratingAverage: aggregate._count._all > 0 ? aggregate._avg.stars : null,
        ratingCount: aggregate._count._all,
      },
    });
  }

  private async refreshRenterAggregate(tx: Prisma.TransactionClient, rateeId: string): Promise<void> {
    const aggregate = await tx.rating.aggregate({
      where: { rateeId, target: RatingTarget.RENTER },
      _avg: { stars: true },
      _count: { _all: true },
    });

    await tx.user.update({
      where: { id: rateeId },
      data: {
        renterRatingAverage: aggregate._count._all > 0 ? aggregate._avg.stars : null,
        renterRatingCount: aggregate._count._all,
      },
    });
  }
}
