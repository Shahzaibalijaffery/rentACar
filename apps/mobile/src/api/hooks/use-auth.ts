import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  LoginResponse,
  RegisterResponse,
  UpdateProfileRequest,
  UserProfile,
  VerifyEmailResponse,
} from '@rentacar/shared';
import { apiRequest } from '@/api/client';
import { apiUploadFile } from '@/api/upload';
import { authKeys } from '@/api/keys/auth.keys';
import { getRefreshToken, saveRefreshToken } from '@/services/secure-storage';
import {
  clearStoredSession,
  restoreSessionFromStorage as restoreStoredSession,
} from '@/services/session-service';
import { useAuthStore } from '@/stores/auth-store';

type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  cnic: string;
};

type LoginInput = {
  email: string;
  password: string;
};

async function persistSession(tokens: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  useAuthStore.getState().setAccessToken(tokens.accessToken);
  await saveRefreshToken(tokens.refreshToken);
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      apiRequest<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: input,
        auth: false,
      }),
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: input,
        auth: false,
      }),
    onSuccess: async (data) => {
      await persistSession(data);
      queryClient.setQueryData(authKeys.profile(), data.user);
    },
  });
}

export function useVerifyEmailMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) =>
      apiRequest<VerifyEmailResponse>('/auth/verify-email', {
        method: 'POST',
        body: { token },
        auth: false,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.profile(), data.user);
    },
  });
}

export function useResendVerificationMutation() {
  return useMutation({
    mutationFn: (email: string) =>
      apiRequest<{ message: string }>('/auth/resend-verification', {
        method: 'POST',
        body: { email },
        auth: false,
      }),
  });
}

export function useProfileQuery(enabled = true) {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => apiRequest<UserProfile>('/users/me'),
    enabled: enabled && useAuthStore.getState().accessToken !== null,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileRequest) =>
      apiRequest<UserProfile>('/users/me', { method: 'PATCH', body: input }),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.profile(), data);
    },
  });
}

export function useUploadProfilePhotoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: { uri: string; type: string; name: string }) =>
      apiUploadFile<UserProfile>('/users/me/photo', file),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.profile(), data);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await apiRequest<{ message: string }>('/auth/logout', {
          method: 'POST',
          body: { refreshToken },
          auth: false,
        });
      }
    },
    onSettled: async () => {
      await clearStoredSession();
      queryClient.removeQueries({ queryKey: authKeys.all });
    },
  });
}

export async function restoreSessionFromStorage(): Promise<boolean> {
  return restoreStoredSession();
}
