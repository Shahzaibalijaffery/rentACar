export type PasswordPairError =
  | 'passwordRequired'
  | 'passwordTooShort'
  | 'passwordWeak'
  | 'passwordMismatch';

const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_COMPLEXITY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export function passwordPairError(
  password: string,
  confirmPassword: string,
): PasswordPairError | null {
  if (!password || !confirmPassword) {
    return 'passwordRequired';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return 'passwordTooShort';
  }
  if (!PASSWORD_COMPLEXITY.test(password)) {
    return 'passwordWeak';
  }
  if (password !== confirmPassword) {
    return 'passwordMismatch';
  }
  return null;
}

/** @deprecated Use passwordPairError */
export const registrationPasswordError = passwordPairError;
