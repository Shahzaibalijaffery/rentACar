import {
  generateEmailVerificationCode,
  hashToken,
  normalizeEmailVerificationCode,
} from './token.util';

describe('email verification codes', () => {
  it('generates a 6-digit numeric code', () => {
    const code = generateEmailVerificationCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('strips non-digits when pasting', () => {
    expect(normalizeEmailVerificationCode('12 34-56')).toBe('123456');
  });

  it('hashes the same code consistently', () => {
    expect(hashToken('123456')).toBe(hashToken('123456'));
    expect(hashToken('123456')).not.toBe(hashToken('654321'));
  });
});
