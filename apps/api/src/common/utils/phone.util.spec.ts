import { normalizePhone } from './phone.util';
import { DomainError } from '../errors/domain.error';

describe('normalizePhone', () => {
  it('normalizes local 03 mobile numbers', () => {
    expect(normalizePhone('03001234567')).toBe('+923001234567');
  });

  it('normalizes +92 mobile numbers', () => {
    expect(normalizePhone('+92 300 1234567')).toBe('+923001234567');
  });

  it('rejects invalid numbers', () => {
    expect(() => normalizePhone('123')).toThrow(DomainError);
  });
});
