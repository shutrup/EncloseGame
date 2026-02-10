import { cloneState, getScores } from './state';
import { nextPlayer, type AILevel, type BoardLayout, type GameState } from './types';

export function bestMove(board: BoardLayout, state: GameState, level: AILevel): number | undefined {
  const available = board.edges.map((edge) => edge.id).filter((edgeId) => !state.occupiedEdges.has(edgeId));
  if (available.length === 0) {
    return undefined;
  }

  switch (level) {
    case 'easy': {
      if (Math.random() < 0.22) {
        return randomFrom(available);
      }

      const capture = findCapturingEdge(state, available);
      if (capture !== undefined) {
        return capture;
      }

      const safe = findSafeEdges(board, state, available);
      return randomFrom(safe) ?? randomFrom(available);
    }

    case 'medium':
      return solveHeuristic(board, state, available);

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

function findSafeEdges(board: BoardLayout, state: GameState, available: number[]): number[] {
  return available.filter((edgeId) => isSafe(edgeId, board, state));
}

function isSafe(edgeId: number, board: BoardLayout, state: GameState): boolean {
  const affectedZones = affectedZonesForEdge(edgeId, board);
  for (const zone of affectedZones) {
    const occupied = zone.edgeIds.filter((zoneEdge) => state.occupiedEdges.has(zoneEdge)).length;
    if (occupied === 2) {
      return false;
    }
  }
  return true;
}

function solveHeuristic(board: BoardLayout, state: GameState, available: number[]): number {
  const moves = sortMoves(available, board, state);
  let best = moves[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const edgeId of moves) {
    const metrics = getMoveMetrics(edgeId, board, state);
    let score = 0;
    score += metrics.captures * 160;
    score += metrics.createsSecond * 8;
    score -= metrics.createsThird * 125;
    score -= metrics.opponentThreats * 180;
    score += metrics.chainCaptures * 70;
    score += isSafe(edgeId, board, state) ? 22 : 0;
    score += centerWeight(edgeId, board) * 6;

    if (score > bestScore) {
      bestScore = score;
      best = edgeId;
    }
  }

  return best;
}

function solveMinimax(board: BoardLayout, state: GameState, available: number[]): number {
  const emptyCount = available.length;
  const maxDepth = emptyCount <= 12 ? 9 : emptyCount <= 20 ? 5 : 3;
  const transpositionTable = new Map<string, number>();

  let bestScore = Number.NEGATIVE_INFINITY;
  let bestMove = available[0];
  let alpha = Number.NEGATIVE_INFINITY;
  const beta = Number.POSITIVE_INFINITY;

  const sortedMoves = sortMoves(available, board, state);

  for (const move of sortedMoves) {
    const { state: nextState, extraTurn } = simulate(move, state, board);

    const score = extraTurn
      ? minimax(nextState, maxDepth, alpha, beta, true, board, transpositionTable)
      : minimax(nextState, maxDepth - 1, alpha, beta, false, board, transpositionTable);

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
  transpositionTable: Map<string, number>
): number {
  if (depth <= 0 || state.occupiedEdges.size === board.edges.length) {
    return evaluate(state);
  }

  const cacheKey = getStateKey(state, depth, maximizingPlayer);
  const cached = transpositionTable.get(cacheKey);
  if (cached !== undefined) {
    return cached;
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
        ? minimax(nextState, depth, alpha, beta, true, board, transpositionTable)
        : minimax(nextState, depth - 1, alpha, beta, false, board, transpositionTable);

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) {
        break;
      }
    }

    transpositionTable.set(cacheKey, maxEval);
    return maxEval;
  }

  let minEval = Number.POSITIVE_INFINITY;
  for (const move of moves) {
    const { state: nextState, extraTurn } = simulate(move, state, board);

    const evalScore = extraTurn
      ? minimax(nextState, depth, alpha, beta, false, board, transpositionTable)
      : minimax(nextState, depth - 1, alpha, beta, true, board, transpositionTable);

    minEval = Math.min(minEval, evalScore);
    beta = Math.min(beta, evalScore);
    if (beta <= alpha) {
      break;
    }
  }

  transpositionTable.set(cacheKey, minEval);
  return minEval;
}

function getStateKey(state: GameState, depth: number, maximizingPlayer: boolean): string {
  const occupied = [...state.occupiedEdges].sort((a, b) => a - b).join(',');
  const owners = state.zones.map((zone) => zone.owner[0]).join('');
  return `${state.currentPlayer}|${depth}|${maximizingPlayer ? 'max' : 'min'}|${occupied}|${owners}`;
}

function evaluate(state: GameState): number {
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
  return scoreDiff + nearCaptures * 24 * turnFactor - unstableZones * 7;
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
  const metrics = getMoveMetrics(edgeId, board, state);
  let score = 0;
  score += metrics.captures * 100;
  score += isSafe(edgeId, board, state) ? 40 : 0;
  score -= metrics.createsThird * 50;
  score += metrics.createsSecond * 4;
  return score + centerWeight(edgeId, board) * 3;
}

function captures(edgeId: number, board: BoardLayout, state: GameState): boolean {
  for (const zone of affectedZonesForEdge(edgeId, board)) {
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

function getMoveMetrics(edgeId: number, board: BoardLayout, state: GameState): {
  captures: number;
  createsThird: number;
  createsSecond: number;
  opponentThreats: number;
  chainCaptures: number;
} {
  let captures = 0;
  let createsThird = 0;
  let createsSecond = 0;

  for (const zone of affectedZonesForEdge(edgeId, board)) {
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

  const simulation = simulate(edgeId, state, board);
  const capturableZones = countCapturableZones(simulation.state);

  const opponentThreats = simulation.state.currentPlayer !== state.currentPlayer ? capturableZones : 0;
  const chainCaptures = simulation.state.currentPlayer === state.currentPlayer ? capturableZones : 0;

  return { captures, createsThird, createsSecond, opponentThreats, chainCaptures };
}

function countCapturableZones(state: GameState): number {
  let capturable = 0;

  for (const zone of state.zones) {
    if (zone.owner !== 'none') {
      continue;
    }

    const occupied = zone.edgeIds.filter((edgeId) => state.occupiedEdges.has(edgeId)).length;
    if (occupied === 3) {
      capturable += 1;
    }
  }

  return capturable;
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

function affectedZonesForEdge(edgeId: number, board: BoardLayout) {
  return board.zones.filter((zone) => zone.edgeIds.includes(edgeId));
}
