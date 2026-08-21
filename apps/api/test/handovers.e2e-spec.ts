import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { EmailService } from '../src/common/email/email.service';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/common/database/prisma.service';
import { DiscoveryBootstrapService } from '../src/modules/discovery/discovery-bootstrap.service';

describe('Handovers (e2e)', () => {
  let app: INestApplication<App>;

  const mockPrisma = {
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $runCommandRaw: jest.fn().mockResolvedValue({ ok: 1 }),
    $transaction: jest.fn(),
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
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
      updateMany: jest.fn(),
    },
    rentalAgreement: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    agreementAuditEntry: { create: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    handover: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
    },
    handoverPhoto: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    handoverApproval: { findUnique: jest.fn(), create: jest.fn() },
    handoverAuditEntry: { create: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
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

  it('rejects unauthenticated pickup handover creation', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/rentals/507f1f77bcf86cd799439011/handovers/pickup')
      .expect(401);
  });

  it('rejects unauthenticated handover detail access', async () => {
    await request(app.getHttpServer()).get('/api/v1/handovers/507f1f77bcf86cd799439011').expect(401);
  });

  it('rejects unauthenticated handover approval', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/handovers/507f1f77bcf86cd799439011/approve')
      .expect(401);
  });
});
