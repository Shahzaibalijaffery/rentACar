import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { EmailService } from '../src/common/email/email.service';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/common/database/prisma.service';
import { DiscoveryBootstrapService } from '../src/modules/discovery/discovery-bootstrap.service';

import type { PaginatedResponse, VehicleDiscoveryItem } from '@rentacar/shared';

describe('Discovery (e2e)', () => {
  let app: INestApplication<App>;

  const mockPrisma = {
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $runCommandRaw: jest.fn().mockResolvedValue({ ok: 1 }),
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    emailVerificationToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    vehicle: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      aggregateRaw: jest.fn().mockResolvedValue([
        {
          data: [
            {
              _id: 'vehicle-1',
              make: 'Toyota',
              model: 'Corolla',
              year: 2020,
              color: 'White',
              availability: 'AVAILABLE',
              areaLabel: 'Clifton',
              distanceMeters: 900,
              photos: [],
              owner: {
                _id: 'owner-1',
                fullName: 'Owner One',
                profilePhotoUrl: null,
              },
            },
          ],
          meta: [{ total: 1 }],
        },
      ]),
    },
    vehiclePhoto: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(EmailService)
      .useValue({ sendEmail: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(DiscoveryBootstrapService)
      .useValue({ onModuleInit: jest.fn().mockResolvedValue(undefined) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('discovers nearby vehicles without authentication', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/discovery/vehicles')
      .query({ latitude: 24.86, longitude: 67.0, radiusKm: 10, page: 1, pageSize: 20 })
      .expect(200);

    const body = response.body as PaginatedResponse<VehicleDiscoveryItem>;

    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBe(1);
    expect(body.data[0]?.distanceLabel).toBe('900 m away');
    expect(body.data[0]).not.toHaveProperty('latitude');
    expect(body.data[0]).not.toHaveProperty('longitude');
    expect(body.data[0]?.owner).not.toHaveProperty('email');
    expect(body.data[0]?.owner).not.toHaveProperty('cnic');
  });

  it('validates discovery query parameters', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/discovery/vehicles')
      .query({ latitude: 'invalid', longitude: 67 })
      .expect(400);
  });

  it('returns empty paginated results', async () => {
    mockPrisma.vehicle.aggregateRaw.mockResolvedValueOnce([{ data: [], meta: [{ total: 0 }] }]);

    const response = await request(app.getHttpServer())
      .get('/api/v1/discovery/vehicles')
      .query({ latitude: 24.86, longitude: 67.0 })
      .expect(200);

    const body = response.body as PaginatedResponse<VehicleDiscoveryItem>;

    expect(body.data).toEqual([]);
    expect(body.meta.total).toBe(0);
  });
});
