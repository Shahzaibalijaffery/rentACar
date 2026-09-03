import { jsonHasQuotedKeys } from '../../common/utils/privacy-assert';

describe('jsonHasQuotedKeys', () => {
  it('detects a real JSON key', () => {
    expect(jsonHasQuotedKeys({ email: 'a@b.com' }, ['email'])).toBe(true);
  });

  it('ignores the same word inside a string value', () => {
    expect(jsonHasQuotedKeys({ fullName: 'Email Khan' }, ['email'])).toBe(false);
    expect(
      jsonHasQuotedKeys({ profilePhotoUrl: 'https://cdn.example/phone-cover.jpg' }, ['phone']),
    ).toBe(false);
  });
});
