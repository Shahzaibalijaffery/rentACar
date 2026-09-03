import { create } from 'zustand';

export type AppAlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type AppAlertConfig = {
  id: number;
  title: string;
  message?: string;
  buttons: AppAlertButton[];
};

type AppAlertState = {
  current: AppAlertConfig | null;
};

let nextId = 0;

export const useAppAlertStore = create<AppAlertState>(() => ({
  current: null,
}));

export function showAppAlert(
  title: string,
  message?: string,
  buttons?: AppAlertButton[],
): void {
  nextId += 1;
  useAppAlertStore.setState({
    current: {
      id: nextId,
      title,
      message,
      buttons: buttons?.length ? buttons : [{ text: 'OK' }],
    },
  });
}

export function dismissAppAlert(): void {
  useAppAlertStore.setState({ current: null });
}
