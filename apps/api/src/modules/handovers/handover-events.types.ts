export type HandoverEventType =
  | 'HANDOVER_CREATED'
  | 'HANDOVER_PHOTO_UPLOADED'
  | 'HANDOVER_PHOTO_REMOVED'
  | 'HANDOVER_SUBMITTED'
  | 'HANDOVER_RENTER_APPROVED'
  | 'HANDOVER_COMPLETED'
  | 'RENTAL_BECAME_ACTIVE';

export type HandoverEventPayload = {
  handoverId: string;
  rentalId: string;
  ownerId: string;
  renterId: string;
  vehicleId: string;
  status: string;
};
