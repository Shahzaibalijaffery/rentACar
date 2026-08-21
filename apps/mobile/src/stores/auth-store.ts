import { create } from 'zustand';

type AuthState = {
  accessToken: string | null;
  isHydrated: boolean;
  setAccessToken: (token: string | null) => void;
  setHydrated: (value: boolean) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isHydrated: false,
  setAccessToken: (token) => set({ accessToken: token }),
  setHydrated: (value) => set({ isHydrated: value }),
  clearSession: () => set({ accessToken: null }),
}));

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}
