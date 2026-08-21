import { useMutation } from '@tanstack/react-query';
import type {
  AgreementParticipant,
  LookupUserByCnicRequest,
  UserProfileSearchResult,
} from '@rentacar/shared';
import { apiRequest } from '@/api/client';
import { userKeys } from '@/api/keys/user.keys';

export function useLookupUserByCnicMutation() {
  return useMutation({
    mutationKey: userKeys.lookupByCnic(),
    mutationFn: (input: LookupUserByCnicRequest) =>
      apiRequest<AgreementParticipant>('/users/lookup-by-cnic', {
        method: 'POST',
        body: input,
      }),
  });
}

export function useSearchUserByCnicMutation() {
  return useMutation({
    mutationKey: userKeys.searchByCnic(),
    mutationFn: (input: LookupUserByCnicRequest) =>
      apiRequest<UserProfileSearchResult>('/users/search-by-cnic', {
        method: 'POST',
        body: input,
      }),
  });
}
