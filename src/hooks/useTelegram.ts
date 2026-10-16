import { useEffect, useState } from 'react';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

interface TelegramWebApp {
  initData?: string;
  initDataUnsafe?: { user?: TelegramUser };
  colorScheme?: 'dark' | 'light';
  ready: () => void;
  expand: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  disableVerticalSwipes?: () => void;
  onEvent?: (eventType: string, eventHandler: () => void) => void;
  offEvent?: (eventType: string, eventHandler: () => void) => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

interface UseTelegramResult {
  user: TelegramUser | null;
  initData: string;
  isReady: boolean;
  isInTelegram: boolean;
  colorScheme: 'dark' | 'light';
}

const APP_BACKGROUND = '#020814';

export function useTelegram(): UseTelegramResult {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isInTelegram, setIsInTelegram] = useState(false);
  const [colorScheme, setColorScheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      setIsInTelegram(true);
      tg.ready();
      tg.expand();
      tg.disableVerticalSwipes?.();
      tg.setHeaderColor?.(APP_BACKGROUND);
      tg.setBackgroundColor?.(APP_BACKGROUND);
      tg.setBottomBarColor?.(APP_BACKGROUND);

      setInitData(tg.initData ?? '');
      setUser(tg.initDataUnsafe?.user ?? null);
      setColorScheme(tg.colorScheme === 'light' ? 'light' : 'dark');

      const updateTheme = () => {
        setColorScheme(tg.colorScheme === 'light' ? 'light' : 'dark');
      };
      tg.onEvent?.('themeChanged', updateTheme);

      const updateViewport = () => {
        const stableHeight = getComputedStyle(document.documentElement)
          .getPropertyValue('--tg-viewport-stable-height')
          .trim();
        if (stableHeight) {
          document.documentElement.style.setProperty(
            '--afterzero-viewport-height',
            stableHeight,
          );
        }
      };
      tg.onEvent?.('viewportChanged', updateViewport);
      updateViewport();

      setIsReady(true);
      return () => {
        tg.offEvent?.('themeChanged', updateTheme);
        tg.offEvent?.('viewportChanged', updateViewport);
      };
    }

    setIsReady(true);
  }, []);

  return { user, initData, isReady, isInTelegram, colorScheme };
}
