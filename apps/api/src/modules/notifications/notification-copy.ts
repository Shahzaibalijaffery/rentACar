import type { NotificationType } from '@rentacar/shared';

const COPY: Record<NotificationType, { en: { title: string; body: string }; ur: { title: string; body: string } }> =
  {
    RENTAL_CREATED: {
      en: { title: 'New rental request', body: 'A renter asked to book your vehicle.' },
      ur: { title: 'نئی کرایہ کی درخواست', body: 'کسی نے آپ کی گاڑی مانگی ہے۔' },
    },
    RENTAL_ACCEPTED: {
      en: { title: 'Request accepted', body: 'The owner accepted your rental request.' },
      ur: { title: 'درخواست منظور ہو گئی', body: 'مالک نے آپ کی درخواست منظور کر لی۔' },
    },
    RENTAL_REJECTED: {
      en: { title: 'Request rejected', body: 'The owner rejected your rental request.' },
      ur: { title: 'درخواست مسترد', body: 'مالک نے آپ کی درخواست مسترد کر دی۔' },
    },
    RENTAL_CANCELLED: {
      en: { title: 'Rental cancelled', body: 'This rental was cancelled.' },
      ur: { title: 'کرایہ منسوخ', body: 'یہ کرایہ منسوخ ہو گیا۔' },
    },
    RENTAL_COMPLETED: {
      en: { title: 'Rental completed', body: 'The rental is complete. You can leave a rating.' },
      ur: { title: 'کرایہ مکمل', body: 'کرایہ مکمل ہو گیا۔ آپ درجہ دے سکتے ہیں۔' },
    },
    AGREEMENT_CREATED: {
      en: { title: 'Agreement to review', body: 'Review and approve the rental agreement.' },
      ur: { title: 'معاہدہ دیکھیں', body: 'کرایہ کا معاہدہ پڑھیں اور منظور کریں۔' },
    },
    AGREEMENT_APPROVAL_NEEDED: {
      en: { title: 'Agreement waiting', body: 'The rental agreement needs your approval.' },
      ur: { title: 'معاہدے کی منظوری', body: 'معاہدے کے لیے آپ کی منظوری درکار ہے۔' },
    },
    AGREEMENT_FULLY_APPROVED: {
      en: { title: 'Agreement approved', body: 'Both parties approved the rental agreement.' },
      ur: { title: 'معاہدہ منظور', body: 'دونوں فریقوں نے معاہدہ منظور کر لیا۔' },
    },
    AGREEMENT_CANCELLED: {
      en: { title: 'Agreement cancelled', body: 'The rental agreement was cancelled.' },
      ur: { title: 'معاہدہ منسوخ', body: 'کرایہ کا معاہدہ منسوخ ہو گیا۔' },
    },
    HANDOVER_PHOTOS_READY: {
      en: { title: 'Pickup photos ready', body: 'Review and approve the vehicle photos.' },
      ur: { title: 'پک اپ تصاویر تیار', body: 'گاڑی کی تصاویر دیکھیں اور منظور کریں۔' },
    },
    HANDOVER_APPROVED: {
      en: { title: 'Pickup approved', body: 'The renter approved the pickup photos.' },
      ur: { title: 'پک اپ منظور', body: 'کرایہ دار نے پک اپ تصاویر منظور کر لیں۔' },
    },
    RENTAL_BECAME_ACTIVE: {
      en: { title: 'Rental is active', body: 'Pickup is done. The rental is now active.' },
      ur: { title: 'کرایہ جاری ہے', body: 'پک اپ ہو گیا۔ کرایہ اب جاری ہے۔' },
    },
  };

export function getPushCopy(
  type: NotificationType,
  locale: string,
): { title: string; body: string } {
  const pack = COPY[type];
  return locale.toLowerCase().startsWith('ur') ? pack.ur : pack.en;
}
