import { cloneState, getScores } from './state';
import { nextPlayer, type AILevel, type BoardLayout, type GameState } from './types';

export function bestMove(board: BoardLayout, state: GameState, level: AILevel): number | undefined {
  const available = board.edges.map((edge) => edge.id).filter((edgeId) => !state.occupiedEdges.has(edgeId));
  if (available.length === 0) {
    return undefined;
  }

  const edgeZones = buildEdgeZoneMap(board);

  switch (level) {
    case 'easy': {
      if (Math.random() < 0.22) {
        return randomFrom(available);
      }

      const capture = findCapturingEdge(state, available);
      if (capture !== undefined) {
        return capture;
      }

      const safe = findSafeEdges(board, state, available, edgeZones);
      return randomFrom(safe) ?? randomFrom(available);
    }

    case 'medium':
      return solveHeuristic(board, state, available, edgeZones);

    case 'hard':
      return solveMinimax(board, state, available, edgeZones);

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

function findCapturingEdge(state: GameState, available: number[]): number | undefined {
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

function findSafeEdges(
  board: BoardLayout,
  state: GameState,
  available: number[],
  edgeZones: Map<number, number[]>
): number[] {
  return available.filter((edgeId) => isSafe(edgeId, board, state, edgeZones));
}

function isSafe(edgeId: number, board: BoardLayout, state: GameState, edgeZones: Map<number, number[]>): boolean {
  const affectedZones = affectedZonesForEdge(edgeId, board, edgeZones);
  for (const zone of affectedZones) {
    const occupied = zone.edgeIds.filter((zoneEdge) => state.occupiedEdges.has(zoneEdge)).length;
    if (occupied === 2) {
      return false;
    }
  }
  return true;
}

function solveHeuristic(board: BoardLayout, state: GameState, available: number[], edgeZones: Map<number, number[]>): number {
  const moves = sortMoves(available, board, state, edgeZones);
  let best = moves[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const edgeId of moves) {
    const metrics = getMoveMetrics(edgeId, board, state, edgeZones);
    let score = 0;
    score += metrics.captures * 160;
    score += metrics.createsSecond * 8;
    score -= metrics.createsThird * 125;
    score += isSafe(edgeId, board, state, edgeZones) ? 22 : 0;
    score -= metrics.givesCaptures * 130;
    score += centerWeight(edgeId, board) * 6;

    if (score > bestScore) {
      bestScore = score;
      best = edgeId;
    }
  }

  return best;
}

function solveMinimax(board: BoardLayout, state: GameState, available: number[], edgeZones: Map<number, number[]>): number {
  const emptyCount = available.length;
  const maxDepth = emptyCount <= 8 ? 13 : emptyCount <= 14 ? 10 : emptyCount <= 20 ? 7 : 5;

  let bestScore = Number.NEGATIVE_INFINITY;
  let bestMove = available[0];
  let alpha = Number.NEGATIVE_INFINITY;
  const beta = Number.POSITIVE_INFINITY;

  const sortedMoves = sortMoves(available, board, state, edgeZones);
  const cache = new Map<string, number>();

  for (const move of sortedMoves) {
    const { state: nextState, extraTurn } = simulate(move, state, board);

    const score = extraTurn
      ? minimax(nextState, maxDepth, alpha, beta, true, board, edgeZones, cache)
      : minimax(nextState, maxDepth - 1, alpha, beta, false, board, edgeZones, cache);

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
  board: BoardLayout,
  edgeZones: Map<number, number[]>,
  cache: Map<string, number>
): number {
  if (depth <= 0 || state.occupiedEdges.size === board.edges.length) {
    return evaluate(state, board, edgeZones);
  }

  const stateKey = cacheKey(state, depth, maximizingPlayer);
  const cached = cache.get(stateKey);
  if (cached !== undefined) {
    return cached;
  }

  const available = board.edges.map((edge) => edge.id).filter((edgeId) => !state.occupiedEdges.has(edgeId));
  if (available.length === 0) {
    return evaluate(state, board, edgeZones);
  }

  const moves = sortMoves(available, board, state, edgeZones);
  let alpha = alphaInput;
  let beta = betaInput;

  if (maximizingPlayer) {
    let maxEval = Number.NEGATIVE_INFINITY;

    for (const move of moves) {
      const { state: nextState, extraTurn } = simulate(move, state, board);

      const evalScore = extraTurn
        ? minimax(nextState, depth, alpha, beta, true, board, edgeZones, cache)
        : minimax(nextState, depth - 1, alpha, beta, false, board, edgeZones, cache);

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) {
        break;
      }
    }

    cache.set(stateKey, maxEval);
    return maxEval;
  }

  let minEval = Number.POSITIVE_INFINITY;
  for (const move of moves) {
    const { state: nextState, extraTurn } = simulate(move, state, board);

    const evalScore = extraTurn
      ? minimax(nextState, depth, alpha, beta, false, board, edgeZones, cache)
      : minimax(nextState, depth - 1, alpha, beta, true, board, edgeZones, cache);

    minEval = Math.min(minEval, evalScore);
    beta = Math.min(beta, evalScore);
    if (beta <= alpha) {
      break;
    }
  }

  cache.set(stateKey, minEval);
  return minEval;
}

function evaluate(state: GameState, board: BoardLayout, edgeZones: Map<number, number[]>): number {
  const scores = getScores(state);
  const scoreDiff = (scores.o - scores.x) * 100;

  let nearCaptures = 0;
  let unstableZones = 0;
  for (const zone of state.zones) {
    if (zone.owner !== 'none') {
      continue;
    }

    const occupied = zone.edgeIds.filter((edgeId) => state.occupiedEdges.has(edgeId)).length;
    if (occupied === 3) {
      nearCaptures += 1;
    } else if (occupied === 2) {
      unstableZones += 1;
    }
  }

  const turnFactor = state.currentPlayer === 'o' ? 1 : -1;

  const available = board.edges.map((edge) => edge.id).filter((edgeId) => !state.occupiedEdges.has(edgeId));
  let opponentCaptureThreat = 0;
  for (const edgeId of available) {
    const metrics = getMoveMetrics(edgeId, board, state, edgeZones);
    opponentCaptureThreat += metrics.captures;
  }

  return scoreDiff + nearCaptures * 24 * turnFactor - unstableZones * 7 - opponentCaptureThreat * 16;
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

function sortMoves(moves: number[], board: BoardLayout, state: GameState, edgeZones: Map<number, number[]>): number[] {
  return [...moves].sort((a, b) => moveScore(b, board, state, edgeZones) - moveScore(a, board, state, edgeZones));
}

function moveScore(edgeId: number, board: BoardLayout, state: GameState, edgeZones: Map<number, number[]>): number {
  const metrics = getMoveMetrics(edgeId, board, state, edgeZones);
  let score = 0;
  score += metrics.captures * 100;
  score += isSafe(edgeId, board, state, edgeZones) ? 40 : 0;
  score -= metrics.createsThird * 50;
  score -= metrics.givesCaptures * 70;
  score += metrics.createsSecond * 4;
  return score + centerWeight(edgeId, board) * 3;
}

function getMoveMetrics(edgeId: number, board: BoardLayout, state: GameState, edgeZones: Map<number, number[]>): {
  captures: number;
  createsThird: number;
  createsSecond: number;
  givesCaptures: number;
} {
  let captures = 0;
  let createsThird = 0;
  let createsSecond = 0;

  for (const zone of affectedZonesForEdge(edgeId, board, edgeZones)) {
    if (zone.owner !== 'none') {
      continue;
    }

    const occupied = zone.edgeIds.filter((zoneEdgeId) => state.occupiedEdges.has(zoneEdgeId)).length;
    if (occupied === 3) {
      captures += 1;
    } else if (occupied === 2) {
      createsThird += 1;
    } else if (occupied === 1) {
      createsSecond += 1;
    }
  }

  const simulated = simulate(edgeId, state, board).state;
  const available = board.edges.map((edge) => edge.id).filter((candidate) => !simulated.occupiedEdges.has(candidate));
  let givesCaptures = 0;

  for (const candidate of available) {
    for (const zone of affectedZonesForEdge(candidate, board, edgeZones)) {
      if (zone.owner !== 'none') {
        continue;
      }

      const occupied = zone.edgeIds.filter((zoneEdgeId) => simulated.occupiedEdges.has(zoneEdgeId)).length;
      if (occupied === 3) {
        givesCaptures += 1;
      }
    }
  }

  return { captures, createsThird, createsSecond, givesCaptures };
}

function centerWeight(edgeId: number, board: BoardLayout): number {
  const edge = board.edges.find((candidate) => candidate.id === edgeId);
  if (!edge) {
    return 0;
  }

  const a = board.nodes[edge.a];
  const b = board.nodes[edge.b];
  const centerX = (a.position.x + b.position.x) / 2;
  const centerY = (a.position.y + b.position.y) / 2;

  const dist = Math.sqrt(centerX * centerX + centerY * centerY);
  return Math.max(0, 1 - dist / 10);
}

function affectedZonesForEdge(edgeId: number, board: BoardLayout, edgeZones: Map<number, number[]>) {
  const zoneIndexes = edgeZones.get(edgeId) ?? [];
  return zoneIndexes.map((zoneIndex) => board.zones[zoneIndex]);
}

function buildEdgeZoneMap(board: BoardLayout): Map<number, number[]> {
  const edgeZones = new Map<number, number[]>();

  for (let zoneIndex = 0; zoneIndex < board.zones.length; zoneIndex += 1) {
    const zone = board.zones[zoneIndex];
    for (const edgeId of zone.edgeIds) {
      const affected = edgeZones.get(edgeId);
      if (affected) {
        affected.push(zoneIndex);
      } else {
        edgeZones.set(edgeId, [zoneIndex]);
      }
    }
  }

  return edgeZones;
}

function cacheKey(state: GameState, depth: number, maximizingPlayer: boolean): string {
  const edges = [...state.occupiedEdges].sort((a, b) => a - b).join(',');
  return `${depth}:${maximizingPlayer ? '1' : '0'}:${state.currentPlayer}:${edges}`;
}
