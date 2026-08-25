import { perspectiveForNotification } from './notification-navigation';

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
