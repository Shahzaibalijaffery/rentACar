import { Injectable } from '@nestjs/common';
import { AgreementStatus, Prisma, RentalStatus } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';

const ACTIVE_AGREEMENT_STATUSES: AgreementStatus[] = [
  AgreementStatus.DRAFT,
  AgreementStatus.PENDING_APPROVAL,
  AgreementStatus.APPROVED,
];

const agreementInclude = {
  rental: {
    include: {
      vehicle: { include: { photos: true } },
    },
  },
  owner: {
    select: {
      id: true,
      fullName: true,
      profilePhotoUrl: true,
      cnic: true,
    },
  },
  renter: {
    select: {
      id: true,
      fullName: true,
      profilePhotoUrl: true,
      cnic: true,
    },
  },
} satisfies Prisma.RentalAgreementInclude;

export type AgreementRecord = Prisma.RentalAgreementGetPayload<{
  include: typeof agreementInclude;
}>;

@Injectable()
export class AgreementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<AgreementRecord | null> {
    return this.prisma.rentalAgreement.findUnique({
      where: { id },
      include: agreementInclude,
    });
  }

  findByRentalId(rentalId: string): Promise<AgreementRecord | null> {
    return this.prisma.rentalAgreement.findFirst({
      where: {
        rentalId,
        status: { in: ACTIVE_AGREEMENT_STATUSES },
      },
      include: agreementInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  findLatestByRentalId(rentalId: string): Promise<AgreementRecord | null> {
    return this.prisma.rentalAgreement.findFirst({
      where: { rentalId },
      include: agreementInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  createWithRentalTransition(data: {
    rentalId: string;
    ownerId: string;
    renterId: string;
    vehicleId: string;
    terms: string;
    startDate: Date | null;
    endDate: Date | null;
    actorId: string;
  }): Promise<AgreementRecord> {
    return this.prisma.$transaction(async (tx) => {
      const rental = await tx.rental.findUnique({ where: { id: data.rentalId } });
      if (rental?.status !== RentalStatus.ACCEPTED) {
        throw new Error('RENTAL_NOT_ACCEPTED');
      }

      const existing = await tx.rentalAgreement.findFirst({
        where: {
          rentalId: data.rentalId,
          status: { in: ACTIVE_AGREEMENT_STATUSES },
        },
      });
      if (existing) {
        throw new Error('AGREEMENT_EXISTS');
      }

      const priorCount = await tx.rentalAgreement.count({
        where: { rentalId: data.rentalId },
      });

      await tx.rental.update({
        where: { id: data.rentalId },
        data: { status: RentalStatus.AGREEMENT_PENDING },
      });

      const agreement = await tx.rentalAgreement.create({
        data: {
          rentalId: data.rentalId,
          ownerId: data.ownerId,
          renterId: data.renterId,
          vehicleId: data.vehicleId,
          status: AgreementStatus.PENDING_APPROVAL,
          version: priorCount + 1,
          terms: data.terms,
          startDate: data.startDate,
          endDate: data.endDate,
        },
        include: agreementInclude,
      });

      await tx.agreementAuditEntry.create({
        data: {
          agreementId: agreement.id,
          actorId: data.actorId,
          action: 'AGREEMENT_CREATED',
        },
      });

      return agreement;
    });
  }

  approveParticipant(
    agreementId: string,
    participantId: string,
    role: 'owner' | 'renter',
  ): Promise<AgreementRecord | null> {
    return this.prisma.$transaction(async (tx) => {
      const agreement = await tx.rentalAgreement.findUnique({
        where: { id: agreementId },
        include: {
          owner: { select: { id: true, cnic: true } },
          renter: { select: { id: true, cnic: true } },
        },
      });

      if (agreement?.status !== AgreementStatus.PENDING_APPROVAL) {
        return null;
      }

      if (role === 'owner' && agreement.ownerId !== participantId) {
        throw new Error('NOT_OWNER');
      }
      if (role === 'renter' && agreement.renterId !== participantId) {
        throw new Error('NOT_RENTER');
      }

      const approvalField = role === 'owner' ? 'ownerApprovedAt' : 'renterApprovedAt';
      if (agreement[approvalField]) {
        throw new Error('ALREADY_APPROVED');
      }

      const now = new Date();
      const updatedPartial = await tx.rentalAgreement.update({
        where: { id: agreementId },
        data: { [approvalField]: now },
        include: agreementInclude,
      });

      await tx.agreementAuditEntry.create({
        data: {
          agreementId,
          actorId: participantId,
          action: role === 'owner' ? 'AGREEMENT_OWNER_APPROVED' : 'AGREEMENT_RENTER_APPROVED',
        },
      });

      const ownerApprovedAt = role === 'owner' ? now : agreement.ownerApprovedAt;
      const renterApprovedAt = role === 'renter' ? now : agreement.renterApprovedAt;

      if (ownerApprovedAt && renterApprovedAt) {
        const fullyApproved = await tx.rentalAgreement.update({
          where: { id: agreementId },
          data: {
            status: AgreementStatus.APPROVED,
            approvedTerms: agreement.terms,
            approvedStartDate: agreement.startDate,
            approvedEndDate: agreement.endDate,
            ownerCnicSnapshot: agreement.owner.cnic,
            renterCnicSnapshot: agreement.renter.cnic,
          },
          include: agreementInclude,
        });

        await tx.rental.update({
          where: { id: agreement.rentalId },
          data: { status: RentalStatus.PICKUP_PENDING },
        });

        return fullyApproved;
      }

      return updatedPartial;
    });
  }

  cancelAgreement(agreementId: string, actorId: string): Promise<AgreementRecord | null> {
    return this.prisma.$transaction(async (tx) => {
      const agreement = await tx.rentalAgreement.findUnique({ where: { id: agreementId } });
      if (
        agreement?.status !== AgreementStatus.PENDING_APPROVAL &&
        agreement?.status !== AgreementStatus.DRAFT
      ) {
        return null;
      }

      const cancelled = await tx.rentalAgreement.update({
        where: { id: agreementId },
        data: {
          status: AgreementStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledById: actorId,
        },
        include: agreementInclude,
      });

      await tx.rental.update({
        where: { id: agreement.rentalId },
        data: { status: RentalStatus.ACCEPTED },
      });

      await tx.agreementAuditEntry.create({
        data: {
          agreementId,
          actorId,
          action: 'AGREEMENT_CANCELLED',
        },
      });

      return cancelled;
    });
  }

  listAuditEntries(agreementId: string) {
    return this.prisma.agreementAuditEntry.findMany({
      where: { agreementId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
