import { ConfigService } from '@nestjs/config';
import { R2StorageService } from './r2-storage.service';

describe('R2StorageService', () => {
  it('initializes R2 client settings from config', () => {
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          r2AccountId: 'account-id',
          r2AccessKeyId: 'access-key',
          r2SecretAccessKey: 'secret-key',
          r2BucketName: 'rentacar',
          r2PublicBaseUrl: 'https://cdn.example.com',
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    const service = new R2StorageService(configService);

    expect(service).toBeDefined();
    expect(configService.get).toHaveBeenCalledWith('r2BucketName', { infer: true });
  });
});
