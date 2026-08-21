import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { EmailService } from '../src/common/email/email.service';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/common/database/prisma.service';
import { DiscoveryBootstrapService } from '../src/modules/discovery/discovery-bootstrap.service';

describe('Users (e2e)', () => {
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
    rental: {
      findFirst: jest.fn(),
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

  it('rejects unauthenticated CNIC lookup', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/users/lookup-by-cnic')
      .send({ cnic: '35201-1234567-1' })
      .expect(401);
  });

  it('rejects unauthenticated CNIC search', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/users/search-by-cnic')
      .send({ cnic: '35201-1234567-1' })
      .expect(401);
  });

  it('validates CNIC lookup payload', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/users/lookup-by-cnic')
      .set('Authorization', 'Bearer fake-token')
      .send({ cnic: '' })
      .expect(401);
  });
});
