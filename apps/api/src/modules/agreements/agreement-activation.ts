import {
  AgreementStatus,
  HandoverStatus,
  HandoverType,
  Prisma,
  RentalStatus,
} from '@prisma/client';
import { DEFAULT_RENTAL_AGREEMENT_TERMS } from '@rentacar/shared';

const ACTIVE_AGREEMENT_STATUSES: AgreementStatus[] = [
  AgreementStatus.DRAFT,
  AgreementStatus.PENDING_APPROVAL,
  AgreementStatus.APPROVED,
];

const ACTIVE_HANDOVER_STATUSES: HandoverStatus[] = [
  HandoverStatus.OWNER_PHOTOS_REQUIRED,
  HandoverStatus.RENTER_APPROVAL_REQUIRED,
  HandoverStatus.APPROVED,
];

export async function ensurePickupHandoverInTransaction(
  tx: Prisma.TransactionClient,
  input: {
    rentalId: string;
    ownerId: string;
    renterId: string;
    vehicleId: string;
    actorId: string;
  },
): Promise<void> {
  const existingHandover = await tx.handover.findFirst({
    where: {
      rentalId: input.rentalId,
      type: HandoverType.PICKUP,
      status: { in: ACTIVE_HANDOVER_STATUSES },
    },
  });

  if (existingHandover) {
    return;
  }

  const handover = await tx.handover.create({
    data: {
      rentalId: input.rentalId,
      ownerId: input.ownerId,
      renterId: input.renterId,
      vehicleId: input.vehicleId,
      type: HandoverType.PICKUP,
      status: HandoverStatus.OWNER_PHOTOS_REQUIRED,
    },
  });

  await tx.handoverAuditEntry.create({
    data: {
      handoverId: handover.id,
      actorId: input.actorId,
      action: 'HANDOVER_CREATED',
    },
  });
}

/**
 * Owner accept implies both parties agree to standard terms:
 * the renter by requesting, the owner by accepting.
 */
export async function activateRentalOnOwnerAccept(
  tx: Prisma.TransactionClient,
  rental: {
    id: string;
    ownerId: string;
    renterId: string;
    vehicleId: string;
    startDate: Date | null;
    endDate: Date | null;
  },
  actorId: string,
): Promise<void> {
  const existing = await tx.rentalAgreement.findFirst({
    where: {
      rentalId: rental.id,
      status: { in: ACTIVE_AGREEMENT_STATUSES },
    },
  });
  if (existing) {
    throw new Error('AGREEMENT_EXISTS');
  }

  const [owner, renter] = await Promise.all([
    tx.user.findUnique({
      where: { id: rental.ownerId },
      select: { id: true, cnic: true },
    }),
    tx.user.findUnique({
      where: { id: rental.renterId },
      select: { id: true, cnic: true },
    }),
  ]);

  if (!owner || !renter) {
    throw new Error('PARTICIPANT_NOT_FOUND');
  }

  const now = new Date();
  const terms = DEFAULT_RENTAL_AGREEMENT_TERMS;

  const agreement = await tx.rentalAgreement.create({
    data: {
      rentalId: rental.id,
      ownerId: rental.ownerId,
      renterId: rental.renterId,
      vehicleId: rental.vehicleId,
      status: AgreementStatus.APPROVED,
      version: 1,
      terms,
      startDate: rental.startDate,
      endDate: rental.endDate,
      ownerApprovedAt: now,
      renterApprovedAt: now,
      approvedTerms: terms,
      approvedStartDate: rental.startDate,
      approvedEndDate: rental.endDate,
      ownerCnicSnapshot: owner.cnic,
      renterCnicSnapshot: renter.cnic,
    },
  });

  await tx.agreementAuditEntry.create({
    data: { agreementId: agreement.id, actorId, action: 'AGREEMENT_CREATED' },
  });
  await tx.agreementAuditEntry.create({
    data: { agreementId: agreement.id, actorId, action: 'AGREEMENT_OWNER_APPROVED' },
  });
  await tx.agreementAuditEntry.create({
    data: {
      agreementId: agreement.id,
      actorId: rental.renterId,
      action: 'AGREEMENT_RENTER_APPROVED',
    },
  });

  await tx.agreementAuditEntry.create({
    data: {
      agreementId: agreement.id,
      actorId: rental.renterId,
      action: 'AGREEMENT_RENTER_APPROVED',
    },
  });

  await tx.rental.update({
    where: { id: rental.id },
    data: { status: RentalStatus.ACCEPTED },
  });

  await tx.rental.updateMany({
    where: {
      vehicleId: rental.vehicleId,
      status: RentalStatus.PENDING,
      id: { not: rental.id },
    },
    data: { status: RentalStatus.REJECTED },
  });
}
