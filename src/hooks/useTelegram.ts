import { useEffect, useState } from 'react';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

interface UseTelegramResult {
  user: TelegramUser | null;
  initData: string;
  isReady: boolean;
  isInTelegram: boolean;
  colorScheme: 'dark' | 'light';
}

export function useTelegram(): UseTelegramResult {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      setInitData(tg.initData ?? '');
      const u = tg.initDataUnsafe?.user;
      if (u) setUser(u);
    }
    setIsReady(true);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tg = (window as any).Telegram?.WebApp;

  return {
    user,
    initData,
    isReady,
    isInTelegram: !!tg,
    colorScheme: tg?.colorScheme ?? 'dark',
  };
}
