import type { AppMode } from '@rentacar/shared';
import { create } from 'zustand';

type AppModeState = {
  activeMode: AppMode;
  setActiveMode: (mode: AppMode) => void;
  resetMode: () => void;
};

const DEFAULT_MODE: AppMode = 'renter';

export const useAppModeStore = create<AppModeState>((set) => ({
  activeMode: DEFAULT_MODE,
  setActiveMode: (mode) => set({ activeMode: mode }),
  resetMode: () => set({ activeMode: DEFAULT_MODE }),
}));

export function getActiveAppMode(): AppMode {
  return useAppModeStore.getState().activeMode;
}

export function resetAppMode(): void {
  useAppModeStore.getState().resetMode();
}
