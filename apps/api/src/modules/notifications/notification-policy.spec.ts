import {
  planAgreementNotification,
  planHandoverNotification,
  planRentalNotification,
} from './notification-policy';

describe('notification policy', () => {
  it('notifies the owner about a new rental request', () => {
    expect(
      planRentalNotification('RENTAL_CREATED', {
        rentalId: 'r1',
        renterId: 'renter',
        ownerId: 'owner',
        vehicleId: 'v1',
        status: 'PENDING',
        actorId: 'renter',
      }),
    ).toMatchObject({
      recipientIds: ['owner'],
      persistType: 'RENTAL_CREATED',
    });
  });

  it('notifies the renter when the owner accepts', () => {
    expect(
      planRentalNotification('RENTAL_ACCEPTED', {
        rentalId: 'r1',
        renterId: 'renter',
        ownerId: 'owner',
        vehicleId: 'v1',
        status: 'ACCEPTED',
        actorId: 'owner',
      }),
    ).toMatchObject({
      recipientIds: ['renter'],
      persistType: 'RENTAL_ACCEPTED',
    });
  });

  it('does not notify the person who cancelled', () => {
    expect(
      planRentalNotification('RENTAL_CANCELLED', {
        rentalId: 'r1',
        renterId: 'renter',
        ownerId: 'owner',
        vehicleId: 'v1',
        status: 'CANCELLED',
        actorId: 'renter',
      }).recipientIds,
    ).toEqual(['owner']);
  });

  it('asks the renter to approve a new agreement', () => {
    expect(
      planAgreementNotification('AGREEMENT_CREATED', {
        agreementId: 'a1',
        rentalId: 'r1',
        ownerId: 'owner',
        renterId: 'renter',
        vehicleId: 'v1',
        status: 'PENDING_APPROVAL',
      }),
    ).toMatchObject({
      recipientIds: ['renter'],
      persistType: 'AGREEMENT_CREATED',
    });
  });

  it('asks the renter to approve pickup photos', () => {
    expect(
      planHandoverNotification('HANDOVER_SUBMITTED', {
        handoverId: 'h1',
        rentalId: 'r1',
        ownerId: 'owner',
        renterId: 'renter',
        vehicleId: 'v1',
        status: 'RENTER_APPROVAL_REQUIRED',
      }),
    ).toMatchObject({
      recipientIds: ['renter'],
      persistType: 'HANDOVER_PHOTOS_READY',
    });
  });

  it('syncs photo uploads without creating an inbox item', () => {
    const plan = planHandoverNotification('HANDOVER_PHOTO_UPLOADED', {
      handoverId: 'h1',
      rentalId: 'r1',
      ownerId: 'owner',
      renterId: 'renter',
      vehicleId: 'v1',
      status: 'OWNER_PHOTOS_REQUIRED',
    });
    expect(plan.persistType).toBeNull();
    expect(plan.realtimeType).toBe('STATE_SYNC');
  });
});
