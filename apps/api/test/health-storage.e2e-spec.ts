import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/database/prisma.service';
import { DiscoveryBootstrapService } from '../src/modules/discovery/discovery-bootstrap.service';
import { HealthService } from '../src/modules/health/health.service';

describe('Health storage probe (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        onModuleInit: jest.fn(),
        onModuleDestroy: jest.fn(),
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        $runCommandRaw: jest.fn().mockResolvedValue({ ok: 1 }),
      })
      .overrideProvider(DiscoveryBootstrapService)
      .useValue({ onModuleInit: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(HealthService)
      .useValue({
        getStorageDriver: jest.fn().mockReturnValue('r2'),
        checkDatabase: jest.fn().mockResolvedValue('connected'),
        probeStorage: jest.fn().mockResolvedValue({
          driver: 'r2',
          status: 'ok',
          steps: { upload: true, publicAccess: true },
          sampleUrl: 'https://cdn.example.com/_health-checks/probe-test.txt',
          message: 'Storage upload and public access are working.',
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/health/storage returns probe result', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health/storage')
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: {
            data: {
              driver: string;
              status: string;
              steps: { upload: boolean; publicAccess: boolean };
            };
          };
        }) => {
          expect(body.data.driver).toBe('r2');
          expect(body.data.status).toBe('ok');
          expect(body.data.steps.upload).toBe(true);
          expect(body.data.steps.publicAccess).toBe(true);
        },
      );
  });
});
