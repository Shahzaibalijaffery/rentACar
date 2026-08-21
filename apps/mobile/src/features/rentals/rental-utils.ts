import type { HandoverStatus, RentalStatus } from '@rentacar/shared';

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

export type RentalNextStep = {
  title: string;
  description: string;
};

export function getRentalNextStep(input: {
  status: RentalStatus;
  perspective: 'owner' | 'renter';
  hasAgreement: boolean;
  userApprovedAgreement: boolean;
  agreementFullyApproved: boolean;
  handoverStatus?: HandoverStatus;
}): RentalNextStep | null {
  const { status, perspective, hasAgreement, userApprovedAgreement, agreementFullyApproved } =
    input;

  if (status === 'PENDING') {
    return perspective === 'owner'
      ? {
          title: 'Accept request',
          description: 'Accepting confirms the rental terms and starts vehicle pickup.',
        }
      : {
          title: 'Waiting for owner',
          description: 'If the owner accepts, you go straight to pickup photos.',
        };
  }

  if (status === 'ACCEPTED') {
    return perspective === 'owner'
      ? {
          title: 'Create agreement',
          description: 'This request still needs terms. Create them to continue to pickup.',
        }
      : {
          title: 'Waiting for agreement',
          description: 'The owner still needs to send rental terms for this request.',
        };
  }

  if (status === 'AGREEMENT_PENDING') {
    if (!hasAgreement) {
      return {
        title: 'Agreement in progress',
        description: 'The rental agreement is being prepared.',
      };
    }

    if (!userApprovedAgreement && perspective === 'renter') {
      return {
        title: 'Approve agreement',
        description: 'Review the terms and approve to continue to vehicle pickup.',
      };
    }

    if (!agreementFullyApproved) {
      return {
        title: 'Waiting for approval',
        description:
          perspective === 'owner'
            ? 'You approved the agreement. Waiting for the renter to approve.'
            : 'You approved the agreement. Waiting for the other party.',
      };
    }

    return null;
  }

  if (status === 'PICKUP_PENDING') {
    return perspective === 'owner'
      ? {
          title: 'Take pickup photos',
          description:
            'Photograph the vehicle condition before handover. Minimum 3 photos required.',
        }
      : {
          title: 'Pickup photos pending',
          description: 'The owner will photograph the vehicle and submit pickup evidence.',
        };
  }

  if (status === 'PICKUP_APPROVAL_PENDING') {
    return perspective === 'renter'
      ? {
          title: 'Review pickup photos',
          description: "Approve the owner's vehicle photos to activate the rental.",
        }
      : {
          title: 'Waiting for renter approval',
          description: 'The renter is reviewing your submitted pickup photos.',
        };
  }

  if (status === 'ACTIVE') {
    return perspective === 'owner'
      ? {
          title: 'Complete rental',
          description: 'Mark the rental complete after the vehicle is returned.',
        }
      : {
          title: 'Rental active',
          description: 'Use the vehicle until the agreed end date.',
        };
  }

  if (status === 'COMPLETED') {
    return {
      title: 'Rental completed',
      description: 'Pickup evidence is saved. Ratings may be available soon.',
    };
  }

  return null;
}
