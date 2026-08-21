export const vehicleKeys = {
  all: ['vehicles'] as const,
  mine: (includeArchived?: boolean) => [...vehicleKeys.all, 'mine', includeArchived] as const,
  detail: (vehicleId: string) => [...vehicleKeys.all, 'detail', vehicleId] as const,
  public: (vehicleId: string) => [...vehicleKeys.all, 'public', vehicleId] as const,
};
