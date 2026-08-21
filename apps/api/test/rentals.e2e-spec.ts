import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { EmailService } from '../src/common/email/email.service';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/common/database/prisma.service';
import { DiscoveryBootstrapService } from '../src/modules/discovery/discovery-bootstrap.service';

describe('Rentals (e2e)', () => {
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
    },
    vehiclePhoto: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    rental: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
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

  it('rejects unauthenticated rental creation', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/rentals')
      .send({ vehicleId: '507f1f77bcf86cd799439011' })
      .expect(401);
  });

  it('validates rental creation payload', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/rentals')
      .set('Authorization', 'Bearer invalid-token')
      .send({ vehicleId: 'not-a-valid-id' })
      .expect(401);
  });

  it('rejects unauthenticated rental detail access', async () => {
    await request(app.getHttpServer()).get('/api/v1/rentals/507f1f77bcf86cd799439011').expect(401);
  });

  it('rejects unauthenticated accept action', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/rentals/507f1f77bcf86cd799439011/accept')
      .expect(401);
  });

  it('rejects unauthenticated rental completion', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/rentals/507f1f77bcf86cd799439011/complete')
      .expect(401);
  });
});
