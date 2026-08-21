import { useAppModeStore, resetAppMode } from './app-mode-store';

describe('app-mode-store', () => {
  beforeEach(() => {
    resetAppMode();
  });

  it('defaults to renter mode', () => {
    expect(useAppModeStore.getState().activeMode).toBe('renter');
  });

  it('switches between renter and owner mode', () => {
    useAppModeStore.getState().setActiveMode('owner');
    expect(useAppModeStore.getState().activeMode).toBe('owner');

    useAppModeStore.getState().setActiveMode('renter');
    expect(useAppModeStore.getState().activeMode).toBe('renter');
  });

  it('resets to renter mode on logout cleanup', () => {
    useAppModeStore.getState().setActiveMode('owner');
    resetAppMode();
    expect(useAppModeStore.getState().activeMode).toBe('renter');
  });
});
