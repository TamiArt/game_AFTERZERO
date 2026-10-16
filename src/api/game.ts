export interface GameSnapshot {
  world: {
    id: string;
    name: string;
    level: number;
    xp: number;
    xpNext: number;
    lastDailyDate: string;
    resources: {
      wood: number;
      stone: number;
      metal: number;
      energy: number;
    };
    buildings: Array<{
      id: string;
      type: string;
      tileC: number;
      tileR: number;
      startedAt: number;
      durationSec: number;
      endsAt: number | null;
    }>;
    collectCooldowns: Record<string, number>;
    woodCollects: number;
    stoneCollects: number;
    ruinsVisits: number;
    portalInteracts: number;
    totalBuilt: number;
    petCareCount: number;
    friendVisited: boolean;
    questProgress: Record<string, number>;
    claimedQuests: string[];
    foundItems: string[];
    pet: {
      name: string;
      species: string;
      level: number;
      xp: number;
      xpNext: number;
      hunger: number;
      mood: number;
      health: number;
      lastUpdated: number;
      discovered: boolean;
    };
  };
}

const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const TOKEN_KEY = 'afterzero.accessToken';

export class GameApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function hasBackendSession(): boolean {
  return Boolean(apiUrl && sessionStorage.getItem(TOKEN_KEY));
}

export function isGameBackendConfigured(): boolean {
  return Boolean(apiUrl);
}

async function gameRequest(
  path: string,
  options?: { body?: object; method?: 'GET' | 'POST' },
): Promise<GameSnapshot> {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!apiUrl || !token) throw new GameApiError('Backend session is unavailable', 401);

  const response = await fetch(`${apiUrl}/game${path}`, {
    method: options?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) {
    if (response.status === 401) sessionStorage.removeItem(TOKEN_KEY);
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new GameApiError(payload?.message ?? 'Game action failed', response.status);
  }
  return response.json() as Promise<GameSnapshot>;
}

function progressionRequest(
  path: string,
  body: object,
): Promise<GameSnapshot> {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!apiUrl || !token) throw new GameApiError('Backend session is unavailable', 401);
  return fetch(`${apiUrl}/progression${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }).then(async (response) => {
    if (!response.ok) {
      if (response.status === 401) sessionStorage.removeItem(TOKEN_KEY);
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      throw new GameApiError(
        payload?.message ?? 'Progression action failed',
        response.status,
      );
    }
    return response.json() as Promise<GameSnapshot>;
  });
}

function requestId(): string {
  return crypto.randomUUID();
}

export function getGameState(): Promise<GameSnapshot> {
  return gameRequest('/state');
}

export function collectResource(nodeId: string): Promise<GameSnapshot> {
  return gameRequest('/collect', {
    method: 'POST',
    body: { nodeId, requestId: requestId() },
  });
}

export function startServerBuilding(
  type: string,
  tileC: number,
  tileR: number,
): Promise<GameSnapshot> {
  return gameRequest('/buildings', {
    method: 'POST',
    body: { type, tileC, tileR, requestId: requestId() },
  });
}

export function completeServerBuilding(id: string): Promise<GameSnapshot> {
  return gameRequest(`/buildings/${id}/complete`, {
    method: 'POST',
    body: { requestId: requestId() },
  });
}

export function claimServerDaily(): Promise<GameSnapshot> {
  return gameRequest('/daily', {
    method: 'POST',
    body: { requestId: requestId() },
  });
}

export function claimServerProduction(): Promise<GameSnapshot> {
  return gameRequest('/production', {
    method: 'POST',
    body: { requestId: requestId() },
  });
}

export function claimServerQuest(questId: string): Promise<GameSnapshot> {
  return progressionRequest('/quests/claim', {
    questId,
    requestId: requestId(),
  });
}

export function exploreServerCollection(): Promise<GameSnapshot> {
  return progressionRequest('/collection/explore', {
    requestId: requestId(),
  });
}

export function serverWorldInteraction(
  action: 'ruins' | 'portal',
): Promise<GameSnapshot> {
  return progressionRequest('/world/interact', {
    action,
    requestId: requestId(),
  });
}

export function serverPetAction(
  action: 'feed' | 'play' | 'rest',
): Promise<GameSnapshot> {
  return progressionRequest('/pet/action', {
    action,
    requestId: requestId(),
  });
}
