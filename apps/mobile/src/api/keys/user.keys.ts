export const userKeys = {
  all: ['users'] as const,
  lookupByCnic: () => [...userKeys.all, 'lookup-by-cnic'] as const,
  searchByCnic: () => [...userKeys.all, 'search-by-cnic'] as const,
};
