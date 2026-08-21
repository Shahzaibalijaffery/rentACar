import { RentalStatus } from '@prisma/client';
import { assertRentalDetailIsSafe, toRentalDetailView, toRentalSummary } from './rental.mapper';
import type { RentalRecord } from './rentals.repository';

const rental = {
  id: 'rental-1',
  renterId: 'renter-1',
  ownerId: 'owner-1',
  vehicleId: 'vehicle-1',
  status: RentalStatus.PENDING,
  startDate: null,
  endDate: null,
  completedAt: null,
  completedById: null,
  createdAt: new Date('2026-01-02T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  vehicle: {
    id: 'vehicle-1',
    make: 'Honda',
    model: 'Civic',
    year: 2021,
    color: 'Black',
    areaLabel: 'DHA',
    photos: [],
  },
  renter: {
    id: 'renter-1',
    fullName: 'Test Renter',
    profilePhotoUrl: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    phone: '+923001111111',
  },
  owner: {
    id: 'owner-1',
    fullName: 'Test Owner',
    profilePhotoUrl: 'https://cdn.example/owner.jpg',
    createdAt: new Date('2025-06-01T00:00:00.000Z'),
    phone: '+923002222222',
  },
} as unknown as RentalRecord;

describe('rental mapper', () => {
  it('keeps list summaries free of phone, CNIC, and email', () => {
    const summary = toRentalSummary(rental);
    expect(JSON.stringify(summary.renter)).not.toMatch(/cnic|email|phone/i);
    expect(JSON.stringify(summary.owner)).not.toMatch(/cnic|email|phone/i);
  });

  it('exposes a limited request profile without contact before accept', () => {
    const detail = toRentalDetailView(rental, { agreementId: null, pickupHandoverId: null });
    expect(detail.renterProfile).toEqual({
      id: 'renter-1',
      fullName: 'Test Renter',
      profilePhotoUrl: null,
      memberSince: '2026-01-01T00:00:00.000Z',
    });
    expect(detail.contact).toBeNull();
    expect(() => assertRentalDetailIsSafe(detail)).not.toThrow();
  });

  it('shares phones only after the request is accepted', () => {
    const detail = toRentalDetailView(
      { ...rental, status: RentalStatus.ACCEPTED },
      { agreementId: 'agreement-1', pickupHandoverId: null },
    );
    expect(detail.contact).toEqual({
      ownerPhone: '+923002222222',
      renterPhone: '+923001111111',
    });
    expect(JSON.stringify(detail.renterProfile)).not.toMatch(/cnic|email|phone/i);
    expect(detail).not.toHaveProperty('messages');
    expect(detail).not.toHaveProperty('chatId');
    expect(() => assertRentalDetailIsSafe(detail)).not.toThrow();
  });
});
