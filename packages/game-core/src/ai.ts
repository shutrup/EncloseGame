import { cloneState, getScores } from './state';
import { nextPlayer, type AILevel, type BoardLayout, type GameState } from './types';

export function bestMove(board: BoardLayout, state: GameState, level: AILevel): number | undefined {
  const available = board.edges.map((edge) => edge.id).filter((edgeId) => !state.occupiedEdges.has(edgeId));
  if (available.length === 0) {
    return undefined;
  }

  switch (level) {
    case 'easy': {
      const capture = findCapturingEdge(board, state, available);
      if (capture !== undefined) {
        return capture;
      }
      const safe = findSafeEdges(board, state, available);
      return randomFrom(safe) ?? randomFrom(available);
    }

    case 'medium': {
      const capture = findCapturingEdge(board, state, available);
      if (capture !== undefined) {
        return capture;
      }
      const safe = findSafeEdges(board, state, available);
      if (safe.length > 0) {
        return randomFrom(safe);
      }
      return randomFrom(available);
    }

    case 'hard':
      return solveMinimax(board, state, available);

    default:
      return randomFrom(available);
  }
}

function randomFrom(values: number[]): number | undefined {
  if (values.length === 0) {
    return undefined;
  }
  return values[Math.floor(Math.random() * values.length)];
}

function findCapturingEdge(board: BoardLayout, state: GameState, available: number[]): number | undefined {
  for (const zone of state.zones) {
    if (zone.owner !== 'none') {
      continue;
    }

    const occupiedCount = zone.edgeIds.filter((edgeId) => state.occupiedEdges.has(edgeId)).length;
    if (occupiedCount !== 3) {
      continue;
    }

    const missing = zone.edgeIds.find((edgeId) => !state.occupiedEdges.has(edgeId));
    if (missing !== undefined && available.includes(missing)) {
      return missing;
    }
  }

  return undefined;
}

function findSafeEdges(board: BoardLayout, state: GameState, available: number[]): number[] {
  return available.filter((edgeId) => isSafe(edgeId, board, state));
}

function isSafe(edgeId: number, board: BoardLayout, state: GameState): boolean {
  const affectedZones = board.zones.filter((zone) => zone.edgeIds.includes(edgeId));
  for (const zone of affectedZones) {
    const occupied = zone.edgeIds.filter((zoneEdge) => state.occupiedEdges.has(zoneEdge)).length;
    if (occupied === 2) {
      return false;
    }
  }
  return true;
}

function solveMinimax(board: BoardLayout, state: GameState, available: number[]): number {
  const emptyCount = available.length;
  const maxDepth = emptyCount <= 12 ? 8 : emptyCount <= 20 ? 4 : 2;

  let bestScore = Number.NEGATIVE_INFINITY;
  let bestMove = available[0];
  let alpha = Number.NEGATIVE_INFINITY;
  const beta = Number.POSITIVE_INFINITY;

  const sortedMoves = sortMoves(available, board, state);

  for (const move of sortedMoves) {
    const { state: nextState, extraTurn } = simulate(move, state, board);

    const score = extraTurn
      ? minimax(nextState, maxDepth, alpha, beta, true, board)
      : minimax(nextState, maxDepth - 1, alpha, beta, false, board);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }

    alpha = Math.max(alpha, score);
  }

  return bestMove;
}

function minimax(
  state: GameState,
  depth: number,
  alphaInput: number,
  betaInput: number,
  maximizingPlayer: boolean,
  board: BoardLayout
): number {
  if (depth <= 0 || state.occupiedEdges.size === board.edges.length) {
    return evaluate(state);
  }

  const available = board.edges.map((edge) => edge.id).filter((edgeId) => !state.occupiedEdges.has(edgeId));
  if (available.length === 0) {
    return evaluate(state);
  }

  const moves = sortMoves(available, board, state);
  let alpha = alphaInput;
  let beta = betaInput;

  if (maximizingPlayer) {
    let maxEval = Number.NEGATIVE_INFINITY;

    for (const move of moves) {
      const { state: nextState, extraTurn } = simulate(move, state, board);

      const evalScore = extraTurn
        ? minimax(nextState, depth, alpha, beta, true, board)
        : minimax(nextState, depth - 1, alpha, beta, false, board);

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) {
        break;
      }
    }

    return maxEval;
  }

  let minEval = Number.POSITIVE_INFINITY;
  for (const move of moves) {
    const { state: nextState, extraTurn } = simulate(move, state, board);

    const evalScore = extraTurn
      ? minimax(nextState, depth, alpha, beta, false, board)
      : minimax(nextState, depth - 1, alpha, beta, true, board);

    minEval = Math.min(minEval, evalScore);
    beta = Math.min(beta, evalScore);
    if (beta <= alpha) {
      break;
    }
  }

  return minEval;
}

function evaluate(state: GameState): number {
  const scores = getScores(state);
  return (scores.o - scores.x) * 100;
}

function simulate(move: number, state: GameState, board: BoardLayout): { state: GameState; extraTurn: boolean } {
  const nextState = cloneState(state);
  nextState.occupiedEdges.add(move);

  let captured = false;

  for (let i = 0; i < nextState.zones.length; i += 1) {
    const zone = nextState.zones[i];
    if (zone.owner !== 'none') {
      continue;
    }

    if (!zone.edgeIds.includes(move)) {
      continue;
    }

    const allOccupied = zone.edgeIds.every((edgeId) => nextState.occupiedEdges.has(edgeId));
    if (allOccupied) {
      zone.owner = nextState.currentPlayer;
      captured = true;
    }
  }

  if (!captured) {
    nextState.currentPlayer = nextPlayer(nextState.currentPlayer);
  }

  return { state: nextState, extraTurn: captured };
}

function sortMoves(moves: number[], board: BoardLayout, state: GameState): number[] {
  return [...moves].sort((a, b) => moveScore(b, board, state) - moveScore(a, board, state));
}

function moveScore(edgeId: number, board: BoardLayout, state: GameState): number {
  if (captures(edgeId, board, state)) {
    return 100;
  }

  if (isSafe(edgeId, board, state)) {
    return 50;
  }

  return 0;
}

function captures(edgeId: number, board: BoardLayout, state: GameState): boolean {
  for (const zone of board.zones) {
    if (zone.owner !== 'none' || !zone.edgeIds.includes(edgeId)) {
      continue;
    }

    const occupied = zone.edgeIds.filter((zoneEdgeId) => state.occupiedEdges.has(zoneEdgeId)).length;
    if (occupied === 3) {
      return true;
    }
  }

  return false;
}
