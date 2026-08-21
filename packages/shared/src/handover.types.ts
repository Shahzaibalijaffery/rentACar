import type { RentalVehicleSummary } from './rental.types';

export type HandoverType = 'PICKUP' | 'RETURN';

export type HandoverStatus =
  | 'OWNER_PHOTOS_REQUIRED'
  | 'RENTER_APPROVAL_REQUIRED'
  | 'APPROVED'
  | 'CANCELLED';

export type HandoverPhotoView = {
  id: string;
  url: string;
  mimeType: string;
  sortOrder: number;
  uploadedById: string;
  createdAt: string;
};

export type HandoverApprovalView = {
  id: string;
  approvedById: string;
  role: 'RENTER' | 'OWNER';
  approvedAt: string;
};

export type HandoverView = {
  id: string;
  rentalId: string;
  type: HandoverType;
  status: HandoverStatus;
  vehicle: RentalVehicleSummary;
  owner: { id: string; fullName: string };
  renter: { id: string; fullName: string };
  photos: HandoverPhotoView[];
  approvals: HandoverApprovalView[];
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HandoverAuditAction =
  | 'HANDOVER_CREATED'
  | 'HANDOVER_PHOTO_UPLOADED'
  | 'HANDOVER_PHOTO_REMOVED'
  | 'HANDOVER_SUBMITTED'
  | 'HANDOVER_RENTER_APPROVED'
  | 'HANDOVER_COMPLETED'
  | 'RENTAL_BECAME_ACTIVE';
