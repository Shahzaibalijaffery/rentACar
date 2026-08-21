import { Injectable } from '@nestjs/common';
import {
  AgreementStatus,
  HandoverStatus,
  HandoverType,
  Prisma,
  RentalStatus,
} from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service';

const handoverInclude = {
  rental: {
    include: {
      vehicle: { include: { photos: true } },
    },
  },
  owner: {
    select: {
      id: true,
      fullName: true,
    },
  },
  renter: {
    select: {
      id: true,
      fullName: true,
    },
  },
  photos: true,
  approvals: true,
} satisfies Prisma.HandoverInclude;

export type HandoverRecord = Prisma.HandoverGetPayload<{
  include: typeof handoverInclude;
}>;

const ACTIVE_HANDOVER_STATUSES: HandoverStatus[] = [
  HandoverStatus.OWNER_PHOTOS_REQUIRED,
  HandoverStatus.RENTER_APPROVAL_REQUIRED,
  HandoverStatus.APPROVED,
];

@Injectable()
export class HandoversRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<HandoverRecord | null> {
    return this.prisma.handover.findUnique({
      where: { id },
      include: handoverInclude,
    });
  }

  findPickupByRentalId(rentalId: string): Promise<HandoverRecord | null> {
    return this.prisma.handover.findFirst({
      where: {
        rentalId,
        type: HandoverType.PICKUP,
        status: { in: ACTIVE_HANDOVER_STATUSES },
      },
      include: handoverInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  findPhoto(photoId: string) {
    return this.prisma.handoverPhoto.findUnique({
      where: { id: photoId },
      include: { handover: true },
    });
  }

  countPhotos(handoverId: string): Promise<number> {
    return this.prisma.handoverPhoto.count({ where: { handoverId } });
  }

  createPickupHandover(data: {
    rentalId: string;
    ownerId: string;
    renterId: string;
    vehicleId: string;
    actorId: string;
  }): Promise<HandoverRecord> {
    return this.prisma.$transaction(async (tx) => {
      const rental = await tx.rental.findUnique({ where: { id: data.rentalId } });
      if (rental?.status !== RentalStatus.PICKUP_PENDING) {
        throw new Error('RENTAL_INVALID_STATE');
      }

      const agreement = await tx.rentalAgreement.findFirst({
        where: {
          rentalId: data.rentalId,
          status: AgreementStatus.APPROVED,
        },
        orderBy: { createdAt: 'desc' },
      });
      if (!agreement) {
        throw new Error('AGREEMENT_NOT_APPROVED');
      }

      const vehicle = await tx.vehicle.findUnique({ where: { id: data.vehicleId } });
      if (vehicle?.ownerId !== data.ownerId) {
        throw new Error('VEHICLE_OWNER_MISMATCH');
      }

      const existing = await tx.handover.findFirst({
        where: {
          rentalId: data.rentalId,
          type: HandoverType.PICKUP,
          status: { in: ACTIVE_HANDOVER_STATUSES },
        },
      });
      if (existing) {
        throw new Error('HANDOVER_EXISTS');
      }

      const handover = await tx.handover.create({
        data: {
          rentalId: data.rentalId,
          ownerId: data.ownerId,
          renterId: data.renterId,
          vehicleId: data.vehicleId,
          type: HandoverType.PICKUP,
          status: HandoverStatus.OWNER_PHOTOS_REQUIRED,
        },
        include: handoverInclude,
      });

      await tx.handoverAuditEntry.create({
        data: {
          handoverId: handover.id,
          actorId: data.actorId,
          action: 'HANDOVER_CREATED',
        },
      });

      return handover;
    });
  }

  addPhoto(data: {
    handoverId: string;
    storageKey: string;
    mimeType: string;
    sizeBytes: number;
    sortOrder: number;
    uploadedById: string;
    actorId: string;
    buildPhotoUrl: (photoId: string) => string;
  }): Promise<HandoverRecord> {
    return this.prisma.$transaction(async (tx) => {
      const handover = await tx.handover.findUnique({ where: { id: data.handoverId } });
      if (handover?.status !== HandoverStatus.OWNER_PHOTOS_REQUIRED) {
        throw new Error('HANDOVER_NOT_EDITABLE');
      }

      const photo = await tx.handoverPhoto.create({
        data: {
          handoverId: data.handoverId,
          storageKey: data.storageKey,
          url: data.buildPhotoUrl('pending'),
          mimeType: data.mimeType,
          sizeBytes: data.sizeBytes,
          sortOrder: data.sortOrder,
          uploadedById: data.uploadedById,
        },
      });

      await tx.handoverPhoto.update({
        where: { id: photo.id },
        data: { url: data.buildPhotoUrl(photo.id) },
      });

      await tx.handoverAuditEntry.create({
        data: {
          handoverId: data.handoverId,
          actorId: data.actorId,
          action: 'HANDOVER_PHOTO_UPLOADED',
        },
      });

      return tx.handover.findUniqueOrThrow({
        where: { id: data.handoverId },
        include: handoverInclude,
      });
    });
  }

  removePhoto(handoverId: string, photoId: string, actorId: string): Promise<HandoverRecord> {
    return this.prisma.$transaction(async (tx) => {
      const handover = await tx.handover.findUnique({ where: { id: handoverId } });
      if (handover?.status !== HandoverStatus.OWNER_PHOTOS_REQUIRED) {
        throw new Error('HANDOVER_NOT_EDITABLE');
      }

      const photo = await tx.handoverPhoto.findUnique({ where: { id: photoId } });
      if (photo?.handoverId !== handoverId) {
        throw new Error('PHOTO_NOT_FOUND');
      }

      await tx.handoverPhoto.delete({ where: { id: photoId } });

      await tx.handoverAuditEntry.create({
        data: {
          handoverId,
          actorId,
          action: 'HANDOVER_PHOTO_REMOVED',
        },
      });

      return tx.handover.findUniqueOrThrow({
        where: { id: handoverId },
        include: handoverInclude,
      });
    });
  }

  submitPickupHandover(handoverId: string, actorId: string): Promise<HandoverRecord | null> {
    return this.prisma.$transaction(async (tx) => {
      const handover = await tx.handover.findUnique({
        where: { id: handoverId },
        include: { photos: true },
      });

      if (handover?.status !== HandoverStatus.OWNER_PHOTOS_REQUIRED) {
        return null;
      }

      const submitted = await tx.handover.update({
        where: { id: handoverId },
        data: {
          status: HandoverStatus.RENTER_APPROVAL_REQUIRED,
          submittedAt: new Date(),
        },
        include: handoverInclude,
      });

      await tx.rental.update({
        where: { id: handover.rentalId },
        data: { status: RentalStatus.PICKUP_APPROVAL_PENDING },
      });

      await tx.handoverAuditEntry.create({
        data: {
          handoverId,
          actorId,
          action: 'HANDOVER_SUBMITTED',
        },
      });

      return submitted;
    });
  }

  approvePickupHandover(handoverId: string, renterId: string): Promise<HandoverRecord | null> {
    return this.prisma.$transaction(async (tx) => {
      const handover = await tx.handover.findUnique({ where: { id: handoverId } });
      if (handover?.status !== HandoverStatus.RENTER_APPROVAL_REQUIRED) {
        return null;
      }

      if (handover.renterId !== renterId) {
        throw new Error('NOT_RENTER');
      }

      const existingApproval = await tx.handoverApproval.findUnique({
        where: {
          handoverId_approvedById: {
            handoverId,
            approvedById: renterId,
          },
        },
      });
      if (existingApproval) {
        throw new Error('ALREADY_APPROVED');
      }

      await tx.handoverApproval.create({
        data: {
          handoverId,
          approvedById: renterId,
          role: 'RENTER',
        },
      });

      const approved = await tx.handover.update({
        where: { id: handoverId },
        data: { status: HandoverStatus.APPROVED },
        include: handoverInclude,
      });

      await tx.rental.update({
        where: { id: handover.rentalId },
        data: { status: RentalStatus.ACTIVE },
      });

      await tx.vehicle.update({
        where: { id: handover.vehicleId },
        data: { activeRentalId: handover.rentalId },
      });

      await tx.handoverAuditEntry.create({
        data: {
          handoverId,
          actorId: renterId,
          action: 'HANDOVER_RENTER_APPROVED',
        },
      });

      await tx.handoverAuditEntry.create({
        data: {
          handoverId,
          actorId: renterId,
          action: 'HANDOVER_COMPLETED',
        },
      });

      await tx.handoverAuditEntry.create({
        data: {
          handoverId,
          actorId: renterId,
          action: 'RENTAL_BECAME_ACTIVE',
        },
      });

      return approved;
    });
  }
}
