export const ratingKeys = {
  all: ['ratings'] as const,
  rental: (rentalId: string) => [...ratingKeys.all, 'rental', rentalId] as const,
  vehicle: (vehicleId: string) => [...ratingKeys.all, 'vehicle', vehicleId] as const,
  renter: (userId: string) => [...ratingKeys.all, 'renter', userId] as const,
};
