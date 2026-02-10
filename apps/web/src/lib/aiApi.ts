import type { AILevel, GameSession } from '@enclose/game-core';

interface AiMovePayload {
  board: GameSession['board'];
  state: {
    currentPlayer: GameSession['state']['currentPlayer'];
    occupiedEdges: number[];
    zones: GameSession['state']['zones'];
  };
  level: AILevel;
}

interface AiMoveResponse {
  move: number | null;
}

function getApiBaseUrl(): string {
  const env = import.meta.env as Record<string, string | undefined>;
  const base = env.VITE_API_BASE_URL?.trim();
  if (!base) {
    return '';
  }
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function serializePayload(session: GameSession, level: AILevel): AiMovePayload {
  return {
    board: session.board,
    state: {
      currentPlayer: session.state.currentPlayer,
      occupiedEdges: Array.from(session.state.occupiedEdges),
      zones: session.state.zones
    },
    level
  };
}

export async function requestAIMove(session: GameSession, level: AILevel): Promise<number | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);

  try {
    const response = await fetch(`${getApiBaseUrl()}/ai/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(serializePayload(session, level)),
      signal: controller.signal
    });

    if (!response.ok) {
      return undefined;
    }

    const data = (await response.json()) as AiMoveResponse;
    if (typeof data.move === 'number') {
      return data.move;
    }

    return undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}
