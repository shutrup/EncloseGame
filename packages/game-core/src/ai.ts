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
    const pressure = opponentPressure(edgeId, board, state);
    let score = 0;
    score += metrics.captures * 160;
    score += metrics.createsSecond * 8;
    score -= metrics.createsThird * 125;
    score -= pressure.immediateCaptures * 95;
    score -= pressure.openThirds * 18;
    score += pressure.safeReplyCount * 4;
    score += isSafe(edgeId, board, state) ? 22 : 0;
    score += centerWeight(edgeId, board) * 6;

    if (score > bestScore) {
      bestScore = score;
      best = edgeId;
    }
  }

  return best;
}


function opponentPressure(
  edgeId: number,
  board: BoardLayout,
  state: GameState
): { immediateCaptures: number; openThirds: number; safeReplyCount: number } {
  const { state: nextState } = simulate(edgeId, state, board);
  const replies = board.edges.map((edge) => edge.id).filter((replyEdge) => !nextState.occupiedEdges.has(replyEdge));

  let immediateCaptures = 0;
  let openThirds = 0;
  let safeReplyCount = 0;

  for (const reply of replies) {
    const metrics = getMoveMetrics(reply, board, nextState);
    immediateCaptures += metrics.captures;
    openThirds += metrics.createsThird;
    if (isSafe(reply, board, nextState)) {
      safeReplyCount += 1;
    }
  }

  return { immediateCaptures, openThirds, safeReplyCount };
}

function solveMinimax(board: BoardLayout, state: GameState, available: number[]): number {
  const emptyCount = available.length;
  const maxDepth = emptyCount <= 12 ? 9 : emptyCount <= 20 ? 5 : 3;

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
    return evaluate(state, board);
  }

  const available = board.edges.map((edge) => edge.id).filter((edgeId) => !state.occupiedEdges.has(edgeId));
  if (available.length === 0) {
    return evaluate(state, board);
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

function evaluate(state: GameState, board: BoardLayout): number {
  const scores = getScores(state);
  const scoreDiff = (scores.o - scores.x) * 100;

  let nearCaptures = 0;
  let unstableZones = 0;
  let controlledZones = 0;
  for (const zone of state.zones) {
    if (zone.owner !== 'none') {
      continue;
    }

    const occupied = zone.edgeIds.filter((edgeId) => state.occupiedEdges.has(edgeId)).length;
    if (occupied === 3) {
      nearCaptures += 1;
    } else if (occupied === 2) {
      unstableZones += 1;
    } else if (occupied <= 1) {
      controlledZones += 1;
    }
  }

  const safeMoves = countSafeMoves(state, board);
  const turnFactor = state.currentPlayer === 'o' ? 1 : -1;
  return scoreDiff + nearCaptures * 24 * turnFactor - unstableZones * 9 + controlledZones * 2 + safeMoves * 5 * turnFactor;
}

function countSafeMoves(state: GameState, board: BoardLayout): number {
  let safe = 0;
  for (const edge of board.edges) {
    if (state.occupiedEdges.has(edge.id)) {
      continue;
    }

    if (isSafe(edge.id, board, state)) {
      safe += 1;
    }
  }

  return safe;
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

  return { captures, createsThird, createsSecond };
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
