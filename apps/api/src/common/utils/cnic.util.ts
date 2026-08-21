import { DomainError } from '../errors/domain.error';

const CNIC_DIGIT_COUNT = 13;

export function normalizeCnic(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  if (digits.length !== CNIC_DIGIT_COUNT) {
    throw new DomainError('CNIC must contain exactly 13 digits', 'INVALID_CNIC', 400);
  }

  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function isValidCnicFormat(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  return digits.length === CNIC_DIGIT_COUNT;
}
