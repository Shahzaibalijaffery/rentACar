import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  ForgotPasswordRequest,
  LoginResponse,
  RegisterResponse,
  ResetPasswordRequest,
  UpdateProfileRequest,
  UserProfile,
  VerifyEmailRequest,
  VerifyEmailResponse,
} from '@rentacar/shared';
import { apiRequest } from '@/api/client';
import { apiUploadFile } from '@/api/upload';
import { authKeys } from '@/api/keys/auth.keys';
import { notificationKeys } from '@/api/keys/notification.keys';
import { getRefreshToken } from '@/services/secure-storage';
import {
  clearStoredSession,
  persistSession,
  restoreSessionFromStorage as restoreStoredSession,
} from '@/services/session-service';
import { useAuthStore } from '@/stores/auth-store';
import { stopAndroidPush } from '@/features/notifications/android-push';

type RegisterInput = {
  email: string;
  password: string;
  fullName: string;
  cnic: string;
  phone: string;
};

type LoginInput = {
  email: string;
  password: string;
};

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
      await persistSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      queryClient.setQueryData(authKeys.profile(), data.user);
    },
  });
}

export function useVerifyEmailMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: VerifyEmailRequest) =>
      apiRequest<VerifyEmailResponse>('/auth/verify-email', {
        method: 'POST',
        body: input,
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

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (input: ForgotPasswordRequest) =>
      apiRequest<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: input,
        auth: false,
      }),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (input: ResetPasswordRequest) =>
      apiRequest<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: input,
        auth: false,
      }),
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (input: ChangePasswordRequest) =>
      apiRequest<ChangePasswordResponse>('/auth/change-password', {
        method: 'POST',
        body: input,
      }),
    onSuccess: async (data) => {
      await persistSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
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
      await stopAndroidPush();
      await clearStoredSession();
      queryClient.removeQueries({ queryKey: authKeys.all });
      queryClient.removeQueries({ queryKey: notificationKeys.all });
    },
  });
}

export async function restoreSessionFromStorage(): Promise<boolean> {
  return restoreStoredSession();
}
