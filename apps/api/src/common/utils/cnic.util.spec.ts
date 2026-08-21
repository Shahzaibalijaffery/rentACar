import { normalizeCnic } from './cnic.util';
import { DomainError } from '../errors/domain.error';

describe('normalizeCnic', () => {
  it('normalizes dashed CNIC input', () => {
    expect(normalizeCnic('35202-1234567-1')).toBe('35202-1234567-1');
  });

  it('normalizes digit-only CNIC input', () => {
    expect(normalizeCnic('3520212345671')).toBe('35202-1234567-1');
  });

  it('rejects invalid length', () => {
    expect(() => normalizeCnic('123')).toThrow(DomainError);
  });
});
