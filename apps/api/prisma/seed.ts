import {
  AgreementStatus,
  HandoverStatus,
  HandoverType,
  PrismaClient,
  RentalStatus,
  UserStatus,
  VehicleAvailability,
  VehicleStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { encodeGeohash, toGeoJsonPoint } from '../src/common/utils/location.util';

const prisma = new PrismaClient();

const SEED_VERSION = '2026-03-20-phase7';
const SEED_PASSWORD = 'Password123!';
const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

const SEED_EMAILS = [
  'owner1@seed.rentacar.local',
  'owner2@seed.rentacar.local',
  'renter1@seed.rentacar.local',
  'renter2@seed.rentacar.local',
] as const;

type SeedUserKey = 'owner1' | 'owner2' | 'renter1' | 'renter2';

const SEED_USERS: Record<
  SeedUserKey,
  { email: string; fullName: string; cnic: string; role: 'owner' | 'renter' }
> = {
  owner1: {
    email: 'owner1@seed.rentacar.local',
    fullName: 'Ahmed Khan',
    cnic: '35201-1234567-1',
    role: 'owner',
  },
  owner2: {
    email: 'owner2@seed.rentacar.local',
    fullName: 'Sara Malik',
    cnic: '35201-2345678-2',
    role: 'owner',
  },
  renter1: {
    email: 'renter1@seed.rentacar.local',
    fullName: 'Ali Hassan',
    cnic: '35202-3456789-3',
    role: 'renter',
  },
  renter2: {
    email: 'renter2@seed.rentacar.local',
    fullName: 'Fatima Noor',
    cnic: '35202-4567890-4',
    role: 'renter',
  },
};

const R2_PUBLIC_BASE_URL =
  process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '') ??
  'https://pub-a8fc968b7b3242a1afd4d43bf56607ac.r2.dev';

function handoverPhotoUrl(storageKey: string): string {
  return `${R2_PUBLIC_BASE_URL}/${storageKey}`;
}

async function wipeSeedData(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { email: { in: [...SEED_EMAILS] } },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);
  if (userIds.length === 0) {
    return;
  }

  const rentals = await prisma.rental.findMany({
    where: { OR: [{ ownerId: { in: userIds } }, { renterId: { in: userIds } }] },
    select: { id: true },
  });
  const rentalIds = rentals.map((rental) => rental.id);

  const handovers = await prisma.handover.findMany({
    where: { rentalId: { in: rentalIds } },
    select: { id: true },
  });
  const handoverIds = handovers.map((handover) => handover.id);

  const agreements = await prisma.rentalAgreement.findMany({
    where: { rentalId: { in: rentalIds } },
    select: { id: true },
  });
  const agreementIds = agreements.map((agreement) => agreement.id);

  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: { in: userIds } },
    select: { id: true },
  });
  const vehicleIds = vehicles.map((vehicle) => vehicle.id);

  await prisma.handoverAuditEntry.deleteMany({ where: { handoverId: { in: handoverIds } } });
  await prisma.handoverApproval.deleteMany({ where: { handoverId: { in: handoverIds } } });
  await prisma.handoverPhoto.deleteMany({ where: { handoverId: { in: handoverIds } } });
  await prisma.handover.deleteMany({ where: { id: { in: handoverIds } } });
  await prisma.agreementAuditEntry.deleteMany({ where: { agreementId: { in: agreementIds } } });
  await prisma.rentalAgreement.deleteMany({ where: { id: { in: agreementIds } } });
  await prisma.rental.deleteMany({ where: { id: { in: rentalIds } } });
  await prisma.vehiclePhoto.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
  await prisma.vehicle.deleteMany({ where: { id: { in: vehicleIds } } });
  await prisma.emailVerificationToken.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });

  console.log(`Removed previous seed data (${userIds.length} users).`);
}

async function createSeedUsers(passwordHash: string): Promise<Record<SeedUserKey, { id: string }>> {
  const now = new Date();
  const entries = await Promise.all(
    (Object.entries(SEED_USERS) as [SeedUserKey, (typeof SEED_USERS)[SeedUserKey]][]).map(
      async ([key, user]) => {
        const created = await prisma.user.create({
          data: {
            email: user.email,
            emailVerifiedAt: now,
            passwordHash,
            fullName: user.fullName,
            cnic: user.cnic,
            status: UserStatus.ACTIVE,
          },
          select: { id: true },
        });
        return [key, created] as const;
      },
    ),
  );

  return Object.fromEntries(entries) as Record<SeedUserKey, { id: string }>;
}

async function createVehicle(input: {
  ownerId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  latitude: number;
  longitude: number;
  areaLabel: string;
  availability?: VehicleAvailability;
  photoSeed: string;
}): Promise<{ id: string }> {
  const latitude = input.latitude;
  const longitude = input.longitude;

  const vehicle = await prisma.vehicle.create({
    data: {
      ownerId: input.ownerId,
      make: input.make,
      model: input.model,
      year: input.year,
      color: input.color,
      availability: input.availability ?? VehicleAvailability.AVAILABLE,
      status: VehicleStatus.ACTIVE,
      latitude,
      longitude,
      location: toGeoJsonPoint(latitude, longitude),
      geohash: encodeGeohash(latitude, longitude),
      areaLabel: input.areaLabel,
      photos: {
        create: [
          {
            storageKey: `seed/vehicles/${input.photoSeed}-1.jpg`,
            url: `https://picsum.photos/seed/${input.photoSeed}-1/800/600`,
            mimeType: 'image/jpeg',
            sizeBytes: 120_000,
            sortOrder: 0,
          },
          {
            storageKey: `seed/vehicles/${input.photoSeed}-2.jpg`,
            url: `https://picsum.photos/seed/${input.photoSeed}-2/800/600`,
            mimeType: 'image/jpeg',
            sizeBytes: 118_000,
            sortOrder: 1,
          },
        ],
      },
    },
    select: { id: true },
  });

  return vehicle;
}

async function createApprovedAgreement(input: {
  rentalId: string;
  ownerId: string;
  renterId: string;
  vehicleId: string;
  ownerCnic: string;
  renterCnic: string;
  terms: string;
  startDate: Date;
  endDate: Date;
}): Promise<{ id: string }> {
  const approvedAt = new Date('2026-02-10T10:00:00.000Z');

  const agreement = await prisma.rentalAgreement.create({
    data: {
      rentalId: input.rentalId,
      ownerId: input.ownerId,
      renterId: input.renterId,
      vehicleId: input.vehicleId,
      status: AgreementStatus.APPROVED,
      terms: input.terms,
      startDate: input.startDate,
      endDate: input.endDate,
      ownerApprovedAt: approvedAt,
      renterApprovedAt: approvedAt,
      approvedTerms: input.terms,
      approvedStartDate: input.startDate,
      approvedEndDate: input.endDate,
      ownerCnicSnapshot: input.ownerCnic,
      renterCnicSnapshot: input.renterCnic,
      audit: {
        create: [
          { actorId: input.ownerId, action: 'AGREEMENT_CREATED' },
          { actorId: input.ownerId, action: 'AGREEMENT_OWNER_APPROVED' },
          { actorId: input.renterId, action: 'AGREEMENT_RENTER_APPROVED' },
        ],
      },
    },
    select: { id: true },
  });

  return agreement;
}

async function createPendingAgreement(input: {
  rentalId: string;
  ownerId: string;
  renterId: string;
  vehicleId: string;
  terms: string;
  startDate: Date;
  endDate: Date;
}): Promise<{ id: string }> {
  return prisma.rentalAgreement.create({
    data: {
      rentalId: input.rentalId,
      ownerId: input.ownerId,
      renterId: input.renterId,
      vehicleId: input.vehicleId,
      status: AgreementStatus.PENDING_APPROVAL,
      terms: input.terms,
      startDate: input.startDate,
      endDate: input.endDate,
      ownerApprovedAt: new Date('2026-02-15T09:00:00.000Z'),
      audit: {
        create: [
          { actorId: input.ownerId, action: 'AGREEMENT_CREATED' },
          { actorId: input.ownerId, action: 'AGREEMENT_OWNER_APPROVED' },
        ],
      },
    },
    select: { id: true },
  });
}

async function createApprovedPickupHandover(input: {
  rentalId: string;
  ownerId: string;
  renterId: string;
  vehicleId: string;
  submittedAt: Date;
}): Promise<{ id: string }> {
  const handover = await prisma.handover.create({
    data: {
      rentalId: input.rentalId,
      ownerId: input.ownerId,
      renterId: input.renterId,
      vehicleId: input.vehicleId,
      type: HandoverType.PICKUP,
      status: HandoverStatus.APPROVED,
      submittedAt: input.submittedAt,
      audit: {
        create: [
          { actorId: input.ownerId, action: 'HANDOVER_CREATED' },
          { actorId: input.ownerId, action: 'HANDOVER_PHOTOS_SUBMITTED' },
          { actorId: input.renterId, action: 'HANDOVER_RENTER_APPROVED' },
          { actorId: input.renterId, action: 'HANDOVER_COMPLETED' },
          { actorId: input.renterId, action: 'RENTAL_BECAME_ACTIVE' },
        ],
      },
      approvals: {
        create: {
          approvedById: input.renterId,
          role: 'RENTER',
        },
      },
    },
  });

  const photoIds: string[] = [];
  for (let index = 0; index < 3; index += 1) {
    const storageKey = `seed/handovers/${handover.id}/${index + 1}.jpg`;
    const photo = await prisma.handoverPhoto.create({
      data: {
        handoverId: handover.id,
        storageKey,
        url: handoverPhotoUrl(storageKey),
        mimeType: 'image/jpeg',
        sizeBytes: 95_000,
        sortOrder: index,
        uploadedById: input.ownerId,
      },
      select: { id: true },
    });
    photoIds.push(photo.id);
  }

  return { id: handover.id };
}

async function createSubmittedPickupHandover(input: {
  rentalId: string;
  ownerId: string;
  renterId: string;
  vehicleId: string;
  submittedAt: Date;
}): Promise<{ id: string }> {
  const handover = await prisma.handover.create({
    data: {
      rentalId: input.rentalId,
      ownerId: input.ownerId,
      renterId: input.renterId,
      vehicleId: input.vehicleId,
      type: HandoverType.PICKUP,
      status: HandoverStatus.RENTER_APPROVAL_REQUIRED,
      submittedAt: input.submittedAt,
      audit: {
        create: [
          { actorId: input.ownerId, action: 'HANDOVER_CREATED' },
          { actorId: input.ownerId, action: 'HANDOVER_PHOTOS_SUBMITTED' },
        ],
      },
    },
  });

  for (let index = 0; index < 3; index += 1) {
    const storageKey = `seed/handovers/${handover.id}/${index + 1}.jpg`;
    await prisma.handoverPhoto.create({
      data: {
        handoverId: handover.id,
        storageKey,
        url: handoverPhotoUrl(storageKey),
        mimeType: 'image/jpeg',
        sizeBytes: 95_000,
        sortOrder: index,
        uploadedById: input.ownerId,
      },
      select: { id: true },
    });
  }

  return { id: handover.id };
}

async function createDraftPickupHandover(input: {
  rentalId: string;
  ownerId: string;
  renterId: string;
  vehicleId: string;
}): Promise<{ id: string }> {
  return prisma.handover.create({
    data: {
      rentalId: input.rentalId,
      ownerId: input.ownerId,
      renterId: input.renterId,
      vehicleId: input.vehicleId,
      type: HandoverType.PICKUP,
      status: HandoverStatus.OWNER_PHOTOS_REQUIRED,
      audit: {
        create: [{ actorId: input.ownerId, action: 'HANDOVER_CREATED' }],
      },
    },
    select: { id: true },
  });
}

async function main(): Promise<void> {
  console.log('Seeding RentACar development data...\n');

  await wipeSeedData();

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);
  const users = await createSeedUsers(passwordHash);

  const corolla = await createVehicle({
    ownerId: users.owner1.id,
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
    color: 'White',
    latitude: 24.814,
    longitude: 67.03,
    areaLabel: 'Clifton, Karachi',
    photoSeed: 'corolla',
  });

  const civic = await createVehicle({
    ownerId: users.owner1.id,
    make: 'Honda',
    model: 'Civic',
    year: 2019,
    color: 'Silver',
    latitude: 24.795,
    longitude: 67.046,
    areaLabel: 'DHA Phase 6, Karachi',
    photoSeed: 'civic',
  });

  const city = await createVehicle({
    ownerId: users.owner1.id,
    make: 'Honda',
    model: 'City',
    year: 2021,
    color: 'Blue',
    latitude: 24.82,
    longitude: 67.025,
    areaLabel: 'Clifton Block 5, Karachi',
    photoSeed: 'city',
  });

  await createVehicle({
    ownerId: users.owner1.id,
    make: 'Suzuki',
    model: 'Alto',
    year: 2018,
    color: 'Red',
    latitude: 24.808,
    longitude: 67.035,
    areaLabel: 'Clifton, Karachi',
    availability: VehicleAvailability.UNAVAILABLE,
    photoSeed: 'alto',
  });

  const sportage = await createVehicle({
    ownerId: users.owner2.id,
    make: 'Kia',
    model: 'Sportage',
    year: 2021,
    color: 'Black',
    latitude: 24.858,
    longitude: 67.067,
    areaLabel: 'Bahria Town, Karachi',
    photoSeed: 'sportage',
  });

  const fortuner = await createVehicle({
    ownerId: users.owner2.id,
    make: 'Toyota',
    model: 'Fortuner',
    year: 2022,
    color: 'Pearl White',
    latitude: 24.852,
    longitude: 67.062,
    areaLabel: 'Bahria Town, Karachi',
    photoSeed: 'fortuner',
  });

  const yaris = await createVehicle({
    ownerId: users.owner2.id,
    make: 'Toyota',
    model: 'Yaris',
    year: 2020,
    color: 'Grey',
    latitude: 24.849,
    longitude: 67.058,
    areaLabel: 'Bahria Town, Karachi',
    photoSeed: 'yaris',
  });

  const wagonR = await createVehicle({
    ownerId: users.owner2.id,
    make: 'Suzuki',
    model: 'Wagon R',
    year: 2019,
    color: 'Green',
    latitude: 24.845,
    longitude: 67.055,
    areaLabel: 'Malir, Karachi',
    photoSeed: 'wagonr',
  });

  const rentalStart = new Date('2026-02-20T00:00:00.000Z');
  const rentalEnd = new Date('2026-02-25T00:00:00.000Z');
  const agreementTerms =
    'Standard peer-to-peer rental terms. Renter returns vehicle in similar condition. Pickup photos are historical handover evidence only.';

  // PENDING invitation
  await prisma.rental.create({
    data: {
      renterId: users.renter1.id,
      ownerId: users.owner1.id,
      vehicleId: corolla.id,
      status: RentalStatus.PENDING,
      startDate: rentalStart,
      endDate: rentalEnd,
    },
  });

  // ACCEPTED invitation
  await prisma.rental.create({
    data: {
      renterId: users.renter2.id,
      ownerId: users.owner1.id,
      vehicleId: civic.id,
      status: RentalStatus.ACCEPTED,
      startDate: rentalStart,
      endDate: rentalEnd,
    },
  });

  // AGREEMENT_PENDING
  const agreementPendingRental = await prisma.rental.create({
    data: {
      renterId: users.renter1.id,
      ownerId: users.owner2.id,
      vehicleId: sportage.id,
      status: RentalStatus.AGREEMENT_PENDING,
      startDate: rentalStart,
      endDate: rentalEnd,
    },
  });

  await createPendingAgreement({
    rentalId: agreementPendingRental.id,
    ownerId: users.owner2.id,
    renterId: users.renter1.id,
    vehicleId: sportage.id,
    terms: agreementTerms,
    startDate: rentalStart,
    endDate: rentalEnd,
  });

  // PICKUP_PENDING
  const pickupPendingRental = await prisma.rental.create({
    data: {
      renterId: users.renter2.id,
      ownerId: users.owner2.id,
      vehicleId: wagonR.id,
      status: RentalStatus.PICKUP_PENDING,
      startDate: rentalStart,
      endDate: rentalEnd,
    },
  });

  await createApprovedAgreement({
    rentalId: pickupPendingRental.id,
    ownerId: users.owner2.id,
    renterId: users.renter2.id,
    vehicleId: wagonR.id,
    ownerCnic: SEED_USERS.owner2.cnic,
    renterCnic: SEED_USERS.renter2.cnic,
    terms: agreementTerms,
    startDate: rentalStart,
    endDate: rentalEnd,
  });

  await createDraftPickupHandover({
    rentalId: pickupPendingRental.id,
    ownerId: users.owner2.id,
    renterId: users.renter2.id,
    vehicleId: wagonR.id,
  });

  // PICKUP_APPROVAL_PENDING
  const pickupApprovalRental = await prisma.rental.create({
    data: {
      renterId: users.renter2.id,
      ownerId: users.owner2.id,
      vehicleId: yaris.id,
      status: RentalStatus.PICKUP_APPROVAL_PENDING,
      startDate: rentalStart,
      endDate: rentalEnd,
    },
  });

  await createApprovedAgreement({
    rentalId: pickupApprovalRental.id,
    ownerId: users.owner2.id,
    renterId: users.renter2.id,
    vehicleId: yaris.id,
    ownerCnic: SEED_USERS.owner2.cnic,
    renterCnic: SEED_USERS.renter2.cnic,
    terms: agreementTerms,
    startDate: rentalStart,
    endDate: rentalEnd,
  });

  await createSubmittedPickupHandover({
    rentalId: pickupApprovalRental.id,
    ownerId: users.owner2.id,
    renterId: users.renter2.id,
    vehicleId: yaris.id,
    submittedAt: new Date('2026-02-18T14:30:00.000Z'),
  });

  // ACTIVE rental
  const activeRental = await prisma.rental.create({
    data: {
      renterId: users.renter1.id,
      ownerId: users.owner2.id,
      vehicleId: fortuner.id,
      status: RentalStatus.ACTIVE,
      startDate: new Date('2026-02-15T00:00:00.000Z'),
      endDate: new Date('2026-02-22T00:00:00.000Z'),
    },
  });

  await createApprovedAgreement({
    rentalId: activeRental.id,
    ownerId: users.owner2.id,
    renterId: users.renter1.id,
    vehicleId: fortuner.id,
    ownerCnic: SEED_USERS.owner2.cnic,
    renterCnic: SEED_USERS.renter1.cnic,
    terms: agreementTerms,
    startDate: new Date('2026-02-15T00:00:00.000Z'),
    endDate: new Date('2026-02-22T00:00:00.000Z'),
  });

  await createApprovedPickupHandover({
    rentalId: activeRental.id,
    ownerId: users.owner2.id,
    renterId: users.renter1.id,
    vehicleId: fortuner.id,
    submittedAt: new Date('2026-02-15T11:00:00.000Z'),
  });

  await prisma.vehicle.update({
    where: { id: fortuner.id },
    data: { activeRentalId: activeRental.id },
  });

  // COMPLETED rental
  const completedRental = await prisma.rental.create({
    data: {
      renterId: users.renter2.id,
      ownerId: users.owner1.id,
      vehicleId: city.id,
      status: RentalStatus.COMPLETED,
      startDate: new Date('2026-01-10T00:00:00.000Z'),
      endDate: new Date('2026-01-15T00:00:00.000Z'),
      completedAt: new Date('2026-01-15T18:00:00.000Z'),
      completedById: users.renter2.id,
    },
  });

  await createApprovedAgreement({
    rentalId: completedRental.id,
    ownerId: users.owner1.id,
    renterId: users.renter2.id,
    vehicleId: city.id,
    ownerCnic: SEED_USERS.owner1.cnic,
    renterCnic: SEED_USERS.renter2.cnic,
    terms: agreementTerms,
    startDate: new Date('2026-01-10T00:00:00.000Z'),
    endDate: new Date('2026-01-15T00:00:00.000Z'),
  });

  await createApprovedPickupHandover({
    rentalId: completedRental.id,
    ownerId: users.owner1.id,
    renterId: users.renter2.id,
    vehicleId: city.id,
    submittedAt: new Date('2026-01-10T10:00:00.000Z'),
  });

  await prisma.appMeta.upsert({
    where: { key: 'seed_version' },
    create: { key: 'seed_version', value: SEED_VERSION },
    update: { value: SEED_VERSION },
  });

  console.log('Seed complete.\n');
  console.log('Login credentials (password for all accounts):');
  console.log(`  ${SEED_PASSWORD}\n`);
  console.log('Accounts:');
  for (const user of Object.values(SEED_USERS)) {
    console.log(`  ${user.email} — ${user.fullName} (${user.role})`);
  }
  console.log('\nSeeded rentals:');
  console.log('  PENDING              — renter1 → owner1 Toyota Corolla');
  console.log('  ACCEPTED             — renter2 → owner1 Honda Civic');
  console.log('  AGREEMENT_PENDING    — renter1 → owner2 Kia Sportage');
  console.log('  PICKUP_PENDING       — renter2 → owner2 Suzuki Wagon R');
  console.log('  PICKUP_APPROVAL_PEND — renter2 → owner2 Toyota Yaris');
  console.log('  ACTIVE               — renter1 → owner2 Toyota Fortuner');
  console.log('  COMPLETED            — renter2 → owner1 Honda City');
  console.log('\nDiscovery: 7 vehicles around Karachi (1 manually unavailable, 1 actively rented).');
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
