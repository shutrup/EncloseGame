import { createBoardFromPreset } from './board';
import { bestMove } from './ai';
import { cloneState, createInitialState, getScores, isGameOver } from './state';
import { nextPlayer, type AILevel, type BoardPreset, type GameSession, type GameState, type Player, type Zone } from './types';

export interface PlayResult {
  session: GameSession;
  played: boolean;
  captured: boolean;
}

export function createGameSession(options?: {
  preset?: BoardPreset;
  aiLevel?: AILevel;
}): GameSession {
  const preset = options?.preset ?? 'standard';
  const board = createBoardFromPreset(preset);

  return {
    board,
    preset,
    aiLevel: options?.aiLevel,
    state: createInitialState(board.zones)
  };
}

export function resetSession(
  session: GameSession,
  options?: {
    preset?: BoardPreset;
    aiLevel?: AILevel;
  }
): GameSession {
  const preset = options?.preset ?? session.preset;
  const aiLevel = options?.aiLevel ?? session.aiLevel;
  return createGameSession({ preset, aiLevel });
}

export function setAiLevel(session: GameSession, level?: AILevel): GameSession {
  return {
    ...session,
    aiLevel: level
  };
}

export function availableEdges(session: GameSession): number[] {
  return session.board.edges.map((edge) => edge.id).filter((edgeId) => !session.state.occupiedEdges.has(edgeId));
}

export function playEdge(session: GameSession, edgeId: number): PlayResult {
  if (!session.board.edges.some((edge) => edge.id === edgeId)) {
    return { session, played: false, captured: false };
  }

  if (session.state.occupiedEdges.has(edgeId)) {
    return { session, played: false, captured: false };
  }

  const state = cloneState(session.state);
  const mover = state.currentPlayer;

  state.occupiedEdges.add(edgeId);

  let captured = false;
  for (let i = 0; i < state.zones.length; i += 1) {
    if (state.zones[i].owner !== 'none') {
      continue;
    }

    const allOccupied = state.zones[i].edgeIds.every((zoneEdgeId) => state.occupiedEdges.has(zoneEdgeId));
    if (allOccupied) {
      state.zones[i].owner = mover;
      captured = true;
    }
  }

  if (!captured) {
    state.currentPlayer = nextPlayer(state.currentPlayer);
  }

  return {
    played: true,
    captured,
    session: {
      ...session,
      state,
      lastMove: {
        edgeId,
        player: mover
      }
    }
  };
}

export function getCurrentScores(session: GameSession): { x: number; o: number } {
  return getScores(session.state);
}

export function isSessionOver(session: GameSession): boolean {
  return isGameOver(session.state);
}

export function computeAIMove(session: GameSession, level?: AILevel): number | undefined {
  const aiLevel = level ?? session.aiLevel;
  if (!aiLevel) {
    return undefined;
  }

  if (session.state.currentPlayer !== 'o' || isSessionOver(session)) {
    return undefined;
  }

  return bestMove(session.board, session.state, aiLevel);
}

export function winner(session: GameSession): Player | 'draw' | null {
  if (!isSessionOver(session)) {
    return null;
  }

  const scores = getCurrentScores(session);
  if (scores.x === scores.o) {
    return 'draw';
  }

  return scores.x > scores.o ? 'x' : 'o';
}

export function scoreMargin(session: GameSession): number {
  const scores = getCurrentScores(session);
  return Math.abs(scores.x - scores.o);
}

export function simulateMove(state: GameState, zones: Zone[], edgeId: number): {
  state: GameState;
  captured: boolean;
} {
  const next = cloneState(state);
  const mover = next.currentPlayer;
  next.occupiedEdges.add(edgeId);

  let captured = false;

  for (let i = 0; i < zones.length; i += 1) {
    const zoneId = zones[i].id;
    const stateZone = next.zones[zoneId];
    if (!stateZone || stateZone.owner !== 'none') {
      continue;
    }

    if (stateZone.edgeIds.every((zoneEdgeId) => next.occupiedEdges.has(zoneEdgeId))) {
      stateZone.owner = mover;
      captured = true;
    }
  }

  if (!captured) {
    next.currentPlayer = nextPlayer(next.currentPlayer);
  }

  return { state: next, captured };
}
