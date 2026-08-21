import { Injectable } from '@nestjs/common';
import {
  AgreementStatus,
  HandoverStatus,
  HandoverType,
  Prisma,
  RentalStatus,
} from '@prisma/client';
import type { RentalLifecycleFilter } from '@rentacar/shared';
import { PrismaService } from '../../common/database/prisma.service';
import { BLOCKING_RENTAL_STATUSES } from './rental-state.constants';
import { resolveLifecycleStatuses } from './rental-lifecycle.constants';

const rentalInclude = {
  vehicle: { include: { photos: true } },
  renter: {
    select: {
      id: true,
      fullName: true,
      profilePhotoUrl: true,
    },
  },
  owner: {
    select: {
      id: true,
      fullName: true,
      profilePhotoUrl: true,
    },
  },
} satisfies Prisma.RentalInclude;

export type RentalRecord = Prisma.RentalGetPayload<{
  include: typeof rentalInclude;
}>;

@Injectable()
export class RentalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    renterId: string;
    ownerId: string;
    vehicleId: string;
    startDate?: Date | null;
    endDate?: Date | null;
  }): Promise<RentalRecord> {
    return this.prisma.rental.create({
      data: {
        renterId: data.renterId,
        ownerId: data.ownerId,
        vehicleId: data.vehicleId,
        status: RentalStatus.PENDING,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
      },
      include: rentalInclude,
    });
  }

  findById(id: string): Promise<RentalRecord | null> {
    return this.prisma.rental.findUnique({
      where: { id },
      include: rentalInclude,
    });
  }

  findByRenter(
    renterId: string,
    lifecycle: RentalLifecycleFilter = 'all',
  ): Promise<RentalRecord[]> {
    const statuses = resolveLifecycleStatuses(lifecycle);
    return this.prisma.rental.findMany({
      where: {
        renterId,
        ...(statuses ? { status: { in: statuses } } : {}),
      },
      include: rentalInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  findByOwner(ownerId: string, lifecycle: RentalLifecycleFilter = 'all'): Promise<RentalRecord[]> {
    const statuses = resolveLifecycleStatuses(lifecycle);
    return this.prisma.rental.findMany({
      where: {
        ownerId,
        ...(statuses ? { status: { in: statuses } } : {}),
      },
      include: rentalInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRelatedIds(rentalId: string): Promise<{
    agreementId: string | null;
    pickupHandoverId: string | null;
  }> {
    const [agreement, handover] = await Promise.all([
      this.prisma.rentalAgreement.findFirst({
        where: { rentalId, status: AgreementStatus.APPROVED },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      }),
      this.prisma.handover.findFirst({
        where: {
          rentalId,
          type: HandoverType.PICKUP,
          status: HandoverStatus.APPROVED,
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      }),
    ]);

    return {
      agreementId: agreement?.id ?? null,
      pickupHandoverId: handover?.id ?? null,
    };
  }

  completeActiveRental(rentalId: string, completedById: string): Promise<RentalRecord> {
    return this.prisma.$transaction(async (tx) => {
      const rental = await tx.rental.findUnique({ where: { id: rentalId } });
      if (!rental) {
        throw new Error('NOT_FOUND');
      }
      if (rental.status === RentalStatus.COMPLETED) {
        throw new Error('ALREADY_COMPLETED');
      }
      if (rental.status !== RentalStatus.ACTIVE) {
        throw new Error('NOT_ACTIVE');
      }

      const agreement = await tx.rentalAgreement.findFirst({
        where: { rentalId, status: AgreementStatus.APPROVED },
      });
      if (!agreement) {
        throw new Error('AGREEMENT_NOT_APPROVED');
      }

      const handover = await tx.handover.findFirst({
        where: {
          rentalId,
          type: HandoverType.PICKUP,
          status: HandoverStatus.APPROVED,
        },
      });
      if (!handover) {
        throw new Error('HANDOVER_NOT_APPROVED');
      }

      const completedAt = new Date();

      const updated = await tx.rental.update({
        where: { id: rentalId },
        data: {
          status: RentalStatus.COMPLETED,
          completedAt,
          completedById,
        },
        include: rentalInclude,
      });

      const vehicle = await tx.vehicle.findUnique({ where: { id: rental.vehicleId } });
      if (vehicle?.activeRentalId === rentalId) {
        await tx.vehicle.update({
          where: { id: rental.vehicleId },
          data: { activeRentalId: null },
        });
      }

      return updated;
    });
  }

  findBlockingForVehicle(
    vehicleId: string,
    excludeRentalId?: string,
  ): Promise<RentalRecord | null> {
    return this.prisma.rental.findFirst({
      where: {
        vehicleId,
        status: { in: BLOCKING_RENTAL_STATUSES },
        ...(excludeRentalId ? { id: { not: excludeRentalId } } : {}),
      },
      include: rentalInclude,
    });
  }

  findBlockingForRenterAndVehicle(
    renterId: string,
    vehicleId: string,
  ): Promise<RentalRecord | null> {
    return this.prisma.rental.findFirst({
      where: {
        renterId,
        vehicleId,
        status: { in: BLOCKING_RENTAL_STATUSES },
      },
      include: rentalInclude,
    });
  }

  updateStatus(id: string, status: RentalStatus): Promise<RentalRecord> {
    return this.prisma.rental.update({
      where: { id },
      data: { status },
      include: rentalInclude,
    });
  }

  acceptPendingRental(rentalId: string, vehicleId: string): Promise<RentalRecord | null> {
    return this.prisma.$transaction(async (tx) => {
      const rental = await tx.rental.findUnique({ where: { id: rentalId } });
      if (rental?.status !== RentalStatus.PENDING) {
        return null;
      }

      const conflict = await tx.rental.findFirst({
        where: {
          vehicleId,
          status: { in: BLOCKING_RENTAL_STATUSES },
          id: { not: rentalId },
        },
      });

      if (conflict) {
        throw new Error('RENTAL_CONFLICT');
      }

      return tx.rental.update({
        where: { id: rentalId },
        data: { status: RentalStatus.ACCEPTED },
        include: rentalInclude,
      });
    });
  }
}
