import { perspectiveForNotification, targetForNotification } from './notification-navigation';

describe('perspectiveForNotification', () => {
  it('opens owner-facing rental requests as the owner', () => {
    expect(perspectiveForNotification('RENTAL_CREATED', 'renter')).toBe('owner');
  });

  it('opens accepted requests as the renter', () => {
    expect(perspectiveForNotification('RENTAL_ACCEPTED', 'owner')).toBe('renter');
  });

  it('falls back for events that both parties receive', () => {
    expect(perspectiveForNotification('RENTAL_CANCELLED', 'owner')).toBe('owner');
  });
});

describe('targetForNotification', () => {
  it('opens the inbox when the event has no rental', () => {
    expect(
      targetForNotification({ type: 'RENTAL_CREATED', rentalId: null }, 'owner'),
    ).toEqual({ screen: 'Notifications', params: undefined });
  });

  it('opens agreement detail for agreement events', () => {
    expect(
      targetForNotification(
        {
          type: 'AGREEMENT_CREATED',
          rentalId: 'r1',
          agreementId: 'a1',
        },
        'owner',
      ),
    ).toEqual({
      screen: 'AgreementDetail',
      params: { agreementId: 'a1', rentalId: 'r1', perspective: 'renter' },
    });
  });
});
