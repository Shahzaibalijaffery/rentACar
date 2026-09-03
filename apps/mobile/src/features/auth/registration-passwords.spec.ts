import { registrationPasswordError } from './registration-passwords';

describe('registrationPasswordError', () => {
  it('requires both password fields', () => {
    expect(registrationPasswordError('', 'Password1')).toBe('passwordRequired');
    expect(registrationPasswordError('Password1', '')).toBe('passwordRequired');
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(registrationPasswordError('Pass1', 'Pass1')).toBe('passwordTooShort');
  });

  it('rejects a mismatched confirmation', () => {
    expect(registrationPasswordError('Password1', 'Password2')).toBe('passwordMismatch');
  });

  it('rejects a password without mixed case and a digit', () => {
    expect(registrationPasswordError('password', 'password')).toBe('passwordWeak');
  });

  it('accepts matching passwords of at least 8 characters', () => {
    expect(registrationPasswordError('Password1', 'Password1')).toBeNull();
  });
});
