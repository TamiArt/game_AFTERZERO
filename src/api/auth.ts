export interface BackendSession {
  accessToken: string;
  expiresIn: number;
  player: {
    id: string;
    telegramId: string;
    firstName: string;
    username: string | null;
  };
  world: {
    id: string;
    name: string;
    level: number;
    xp: number;
    resources: {
      wood: number;
      stone: number;
      metal: number;
      energy: number;
    };
  };
}

const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export function isBackendConfigured(): boolean {
  return Boolean(apiUrl);
}

export async function authenticateTelegram(
  initData: string,
  signal?: AbortSignal,
): Promise<BackendSession> {
  if (!apiUrl) {
    throw new Error('Backend API is not configured');
  }

  const response = await fetch(`${apiUrl}/auth/telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
    signal,
  });

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? 'Telegram authentication was rejected'
        : 'Authentication service is unavailable',
    );
  }

  const session = (await response.json()) as BackendSession;
  if (signal?.aborted) {
    throw new DOMException('Authentication was cancelled', 'AbortError');
  }
  sessionStorage.setItem('afterzero.accessToken', session.accessToken);
  return session;
}
