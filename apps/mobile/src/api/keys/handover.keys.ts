export const handoverKeys = {
  all: ['handovers'] as const,
  detail: (id: string) => [...handoverKeys.all, 'detail', id] as const,
  pickupByRental: (rentalId: string) => [...handoverKeys.all, 'pickup', rentalId] as const,
};
