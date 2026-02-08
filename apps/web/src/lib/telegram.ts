export interface TelegramWebAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramWebAppInitDataUnsafe {
  user?: TelegramWebAppUser;
  query_id?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: TelegramWebAppInitDataUnsafe;
  colorScheme: 'light' | 'dark';
  viewportHeight: number;
  isExpanded: boolean;
  ready(): void;
  expand(): void;
  close(): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
  HapticFeedback?: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  BackButton?: {
    show(): void;
    hide(): void;
    onClick(cb: () => void): void;
    offClick(cb: () => void): void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp;
}

export function initTelegramWebApp(): TelegramWebApp | undefined {
  const app = getTelegramWebApp();
  if (!app) {
    return undefined;
  }

  app.ready();
  app.expand();
  return app;
}

// Haptic feedback helpers
export function hapticImpact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'rigid'): void {
  getTelegramWebApp()?.HapticFeedback?.impactOccurred(style);
}

export function hapticSelection(): void {
  getTelegramWebApp()?.HapticFeedback?.selectionChanged();
}

export function hapticNotification(type: 'success' | 'warning' | 'error'): void {
  getTelegramWebApp()?.HapticFeedback?.notificationOccurred(type);
}

