import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { AppConfig } from '../../config/env.config';
import { ResendEmailService } from './resend-email.service';

jest.mock('resend');

describe('ResendEmailService', () => {
  const send = jest.fn();

  beforeEach(() => {
    send.mockReset();
    (Resend as unknown as jest.Mock).mockImplementation(() => ({
      emails: { send },
    }));
  });

  function createService(apiKey: string | undefined): ResendEmailService {
    const configService = {
      get: (key: keyof AppConfig) => {
        if (key === 'resendApiKey') {
          return apiKey;
        }
        if (key === 'emailFrom') {
          return 'beth.t@example.com';
        }
        if (key === 'emailFromName') {
          return 'RentACar';
        }
        return undefined;
      },
    } as ConfigService<AppConfig, true>;

    return new ResendEmailService(configService);
  }

  it('sends html and text over the Resend API', async () => {
    send.mockResolvedValue({ data: { id: 'msg_1' }, error: null });
    const service = createService('re_test_key');

    await service.sendEmail({
      to: 'user@example.com',
      subject: 'Your RentACar verification code',
      text: 'Your RentACar verification code is 123456.',
      html: '<p>Your RentACar verification code is:</p><p>123456</p>',
    });

    expect(send).toHaveBeenCalledWith({
      from: 'RentACar <beth.t@example.com>',
      to: 'user@example.com',
      subject: 'Your RentACar verification code',
      text: 'Your RentACar verification code is 123456.',
      html: '<p>Your RentACar verification code is:</p><p>123456</p>',
    });
  });

  it('does not log or send when the API key is missing', async () => {
    const service = createService(undefined);
    await expect(
      service.sendEmail({
        to: 'user@example.com',
        subject: 'x',
        text: 'x',
        html: '<p>x</p>',
      }),
    ).rejects.toThrow('Resend API key is not configured');
    expect(send).not.toHaveBeenCalled();
  });

  it('throws when Resend returns an error payload', async () => {
    send.mockResolvedValue({ data: null, error: { message: 'domain is not verified' } });
    const service = createService('re_test_key');

    await expect(
      service.sendEmail({
        to: 'user@example.com',
        subject: 'x',
        text: 'x',
        html: '<p>x</p>',
      }),
    ).rejects.toThrow('domain is not verified');
  });
});
