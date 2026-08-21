export const agreementKeys = {
  all: ['agreements'] as const,
  detail: (id: string) => [...agreementKeys.all, 'detail', id] as const,
  byRental: (rentalId: string) => [...agreementKeys.all, 'rental', rentalId] as const,
};
