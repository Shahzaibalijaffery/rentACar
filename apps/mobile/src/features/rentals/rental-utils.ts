import type { HandoverStatus, RentalStatus } from '@rentacar/shared';
import { getCurrentLocale, i18n } from '@/i18n';
import { getIntlTag } from '@/i18n/locale.types';

export function getRentalStatusLabel(status: RentalStatus): string {
  return i18n.t(`rentals:status.${status}`, { defaultValue: status });
}

export function formatRentalDate(value: string | null): string {
  if (!value) {
    return i18n.t('rentals:notSpecified');
  }

  return new Date(value).toLocaleDateString(getIntlTag(getCurrentLocale()));
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
  hasSubmittedRating?: boolean;
}): RentalNextStep | null {
  const { status, perspective, hasAgreement, userApprovedAgreement, agreementFullyApproved } =
    input;

  if (status === 'PENDING') {
    return perspective === 'owner'
      ? {
          title: i18n.t('rentals:next.reviewRequestTitle'),
          description: i18n.t('rentals:next.reviewRequestBody'),
        }
      : {
          title: i18n.t('rentals:next.waitingOwnerTitle'),
          description: i18n.t('rentals:next.waitingOwnerBody'),
        };
  }

  if (status === 'ACCEPTED') {
    return perspective === 'owner'
      ? {
          title: i18n.t('rentals:next.callRenterTitle'),
          description: i18n.t('rentals:next.callRenterBody'),
        }
      : {
          title: i18n.t('rentals:next.callOwnerTitle'),
          description: i18n.t('rentals:next.callOwnerBody'),
        };
  }

  if (status === 'AGREEMENT_PENDING') {
    if (!hasAgreement) {
      return {
        title: i18n.t('rentals:next.agreementProgressTitle'),
        description: i18n.t('rentals:next.agreementProgressBody'),
      };
    }

    if (!userApprovedAgreement && perspective === 'renter') {
      return {
        title: i18n.t('rentals:next.approveAgreementTitle'),
        description: i18n.t('rentals:next.approveAgreementBody'),
      };
    }

    if (!agreementFullyApproved) {
      return {
        title: i18n.t('rentals:next.waitingApprovalTitle'),
        description:
          perspective === 'owner'
            ? i18n.t('rentals:next.waitingApprovalOwner')
            : i18n.t('rentals:next.waitingApprovalRenter'),
      };
    }

    return null;
  }

  if (status === 'PICKUP_PENDING') {
    return perspective === 'owner'
      ? {
          title: i18n.t('rentals:next.takePhotosTitle'),
          description: i18n.t('rentals:next.takePhotosBody'),
        }
      : {
          title: i18n.t('rentals:next.photosPendingTitle'),
          description: i18n.t('rentals:next.photosPendingBody'),
        };
  }

  if (status === 'PICKUP_APPROVAL_PENDING') {
    return perspective === 'renter'
      ? {
          title: i18n.t('rentals:next.reviewPhotosTitle'),
          description: i18n.t('rentals:next.reviewPhotosBody'),
        }
      : {
          title: i18n.t('rentals:next.waitingRenterTitle'),
          description: i18n.t('rentals:next.waitingRenterBody'),
        };
  }

  if (status === 'ACTIVE') {
    return perspective === 'owner'
      ? {
          title: i18n.t('rentals:next.completeTitle'),
          description: i18n.t('rentals:next.completeBody'),
        }
      : {
          title: i18n.t('rentals:next.activeTitle'),
          description: i18n.t('rentals:next.activeBody'),
        };
  }

  if (status === 'COMPLETED') {
    if (input.hasSubmittedRating) {
      return {
        title: i18n.t('rentals:next.ratingSentTitle'),
        description: i18n.t('rentals:next.ratingSentBody'),
      };
    }

    return perspective === 'owner'
      ? {
          title: i18n.t('rentals:next.rateRenterTitle'),
          description: i18n.t('rentals:next.rateRenterBody'),
        }
      : {
          title: i18n.t('rentals:next.rateCarTitle'),
          description: i18n.t('rentals:next.rateCarBody'),
        };
  }

  if (status === 'RATED') {
    return {
      title: i18n.t('rentals:next.doneTitle'),
      description: i18n.t('rentals:next.doneBody'),
    };
  }

  return null;
}
