import type { RentalStatus } from '@rentacar/shared';

export function getRentalStatusLabel(status: RentalStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'ACCEPTED':
      return 'Accepted';
    case 'REJECTED':
      return 'Rejected';
    case 'CANCELLED':
      return 'Cancelled';
    case 'AGREEMENT_PENDING':
      return 'Agreement pending';
    case 'PICKUP_PENDING':
      return 'Pickup pending';
    case 'PICKUP_APPROVAL_PENDING':
      return 'Pickup approval pending';
    case 'ACTIVE':
      return 'Active';
    case 'RETURN_PENDING':
      return 'Return pending';
    case 'RETURN_APPROVAL_PENDING':
      return 'Return approval pending';
    case 'COMPLETED':
      return 'Completed';
    case 'RATED':
      return 'Rated';
    default:
      return status;
  }
}

export function formatRentalDate(value: string | null): string {
  if (!value) {
    return 'Not specified';
  }

  return new Date(value).toLocaleDateString();
}
