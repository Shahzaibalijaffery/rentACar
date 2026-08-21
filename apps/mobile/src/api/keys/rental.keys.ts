import type { RentalLifecycleFilter } from '@rentacar/shared';

export const rentalKeys = {
  all: ['rentals'] as const,
  mine: (lifecycle: RentalLifecycleFilter = 'all') =>
    [...rentalKeys.all, 'mine', lifecycle] as const,
  incoming: (lifecycle: RentalLifecycleFilter = 'all') =>
    [...rentalKeys.all, 'incoming', lifecycle] as const,
  detail: (id: string) => [...rentalKeys.all, 'detail', id] as const,
};

function rentalsListPath(base: string, lifecycle: RentalLifecycleFilter): string {
  if (lifecycle === 'all') {
    return base;
  }
  return `${base}?lifecycle=${lifecycle}`;
}

export function rentalsMinePath(lifecycle: RentalLifecycleFilter = 'all'): string {
  return rentalsListPath('/rentals/mine', lifecycle);
}

export function rentalsIncomingPath(lifecycle: RentalLifecycleFilter = 'all'): string {
  return rentalsListPath('/rentals/incoming', lifecycle);
}
