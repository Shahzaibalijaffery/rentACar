import { resolveMessagingApi } from './resolve-messaging-api';

describe('resolveMessagingApi', () => {
  it('uses the modular named export from RN Firebase v22+', () => {
    const getMessaging = jest.fn();
    const api = resolveMessagingApi({ getMessaging });
    expect(api?.getMessaging).toBe(getMessaging);
  });

  it('unwraps an ESM default namespace', () => {
    const getMessaging = jest.fn();
    const api = resolveMessagingApi({ default: { getMessaging } });
    expect(api?.getMessaging).toBe(getMessaging);
  });

  it('does not treat the removed namespaced default() factory as valid', () => {
    const api = resolveMessagingApi({
      default: () => ({ getToken: jest.fn() }),
    });
    expect(api).toBeNull();
  });
});
