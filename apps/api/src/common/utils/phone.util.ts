import { DomainError } from '../errors/domain.error';

/** Pakistan mobile: 03XXXXXXXXX or +923XXXXXXXXX → stored as +923XXXXXXXXX. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  let national = digits;
  if (national.startsWith('92') && national.length === 12) {
    national = `0${national.slice(2)}`;
  }

  if (national.length === 11 && national.startsWith('03')) {
    return `+92${national.slice(1)}`;
  }

  throw new DomainError('Phone must be a valid Pakistan mobile number', 'INVALID_PHONE', 400);
}

export function isValidPhoneFormat(raw: string): boolean {
  try {
    normalizePhone(raw);
    return true;
  } catch {
    return false;
  }
}
