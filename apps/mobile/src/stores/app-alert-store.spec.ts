import { dismissAppAlert, showAppAlert, useAppAlertStore } from './app-alert-store';

describe('showAppAlert', () => {
  afterEach(() => {
    dismissAppAlert();
  });

  it('stores title, message, and default OK button', () => {
    showAppAlert('Saved', 'Your profile was updated.');
    const current = useAppAlertStore.getState().current;
    expect(current?.title).toBe('Saved');
    expect(current?.message).toBe('Your profile was updated.');
    expect(current?.buttons).toEqual([{ text: 'OK' }]);
  });

  it('keeps custom buttons', () => {
    showAppAlert('Remove photo', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive' },
    ]);
    const current = useAppAlertStore.getState().current;
    expect(current?.buttons).toHaveLength(2);
    expect(current?.buttons[1]?.style).toBe('destructive');
  });
});
