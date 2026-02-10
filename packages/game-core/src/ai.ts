import { getBoardBounds } from './board';
import { cloneState, getScores } from './state';
import { nextPlayer, type AILevel, type BoardLayout, type Edge, type GameState, type Zone } from './types';

interface AiContext {
  board: BoardLayout;
  edgeZones: Map<number, Zone[]>;
  edgeById: Map<number, Edge>;
  centerCache: Map<number, number>;
  centerX: number;
  centerY: number;
  maxDist: number;
}

interface MoveMetrics {
  captures: number;
  createsThird: number;
  createsSecond: number;
  givesCaptures: number;
  chainCaptures: number;
}

interface ReplyPressure {
  immediateCaptures: number;
  openThirds: number;
  safeReplies: number;
}

const HARD_TIE_THRESHOLD = 0.0001;

export function bestMove(board: BoardLayout, state: GameState, level: AILevel): number | undefined {
  const available = availableEdges(state, board);
  if (available.length === 0) {
    return undefined;
  }

  const context = buildContext(board);

  switch (level) {
    case 'easy': {
      if (Math.random() < 0.22) {
        return randomFrom(available);
      }

      const capture = findCapturingEdge(state, available, context);
      if (capture !== undefined) {
        return capture;
      }

      const safe = findSafeEdges(state, available, context);
      return randomFrom(safe) ?? randomFrom(available);
    }

    case 'medium':
      return solveHeuristic(state, available, context);

    case 'hard':
      return solveMinimax(state, available, context);

    default:
      return randomFrom(available);
  }
}

function buildContext(board: BoardLayout): AiContext {
  const edgeZones = new Map<number, Zone[]>();
  for (const zone of board.zones) {
    for (const edgeId of zone.edgeIds) {
      const zones = edgeZones.get(edgeId);
      if (zones) {
        zones.push(zone);
      } else {
        edgeZones.set(edgeId, [zone]);
      }
    }
  }

  const edgeById = new Map<number, Edge>();
  for (const edge of board.edges) {
    edgeById.set(edge.id, edge);
  }

  const bounds = getBoardBounds(board);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const maxDist = Math.max(
    0.0001,
    Math.hypot(bounds.maxX - centerX, bounds.maxY - centerY)
  );

  return {
    board,
    edgeZones,
    edgeById,
    centerCache: new Map<number, number>(),
    centerX,
    centerY,
    maxDist
  };
}

function randomFrom(values: number[]): number | undefined {
  if (values.length === 0) {
    return undefined;
  }
  return values[Math.floor(Math.random() * values.length)];
}

function availableEdges(state: GameState, board: BoardLayout): number[] {
  return board.edges.map((edge) => edge.id).filter((edgeId) => !state.occupiedEdges.has(edgeId));
}

function findCapturingEdge(state: GameState, available: number[], context: AiContext): number | undefined {
  for (const edgeId of available) {
    const metrics = getLocalMoveMetrics(edgeId, state, context);
    if (metrics.captures > 0) {
      return edgeId;
    }
  }

  return undefined;
}

function findSafeEdges(state: GameState, available: number[], context: AiContext): number[] {
  return available.filter((edgeId) => isSafe(edgeId, state, context));
}

function isSafe(edgeId: number, state: GameState, context: AiContext): boolean {
  const affectedZones = affectedZonesForEdge(edgeId, context);
  for (const zone of affectedZones) {
    const occupied = zone.edgeIds.filter((zoneEdge) => state.occupiedEdges.has(zoneEdge)).length;
    if (occupied === 2) {
      return false;
    }
  }
  return true;
}

function solveHeuristic(state: GameState, available: number[], context: AiContext): number {
  const moves = sortMoves(available, state, context);
  let best = moves[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const edgeId of moves) {
    const metrics = getMoveMetrics(edgeId, state, context);
    const pressure = estimateReplyPressure(edgeId, state, context);

    let score = 0;
    score += metrics.captures * 180;
    score += metrics.chainCaptures * 75;
    score += metrics.createsSecond * 7;
    score -= metrics.createsThird * 145;
    score -= metrics.givesCaptures * 190;
    score -= pressure.immediateCaptures * 95;
    score -= pressure.openThirds * 16;
    score -= pressure.safeReplies * 2;
    score += isSafe(edgeId, state, context) ? 24 : 0;
    score += centerWeight(edgeId, context) * 8;

    if (score > bestScore) {
      bestScore = score;
      best = edgeId;
    }
  }

  return best;
}

function estimateReplyPressure(edgeId: number, state: GameState, context: AiContext): ReplyPressure {
  const { state: nextState } = simulate(edgeId, state, context);

  // We kept the turn, so opponent pressure is irrelevant for this move.
  if (nextState.currentPlayer === state.currentPlayer) {
    return { immediateCaptures: 0, openThirds: 0, safeReplies: 0 };
  }

  const replies = availableEdges(nextState, context.board);
  let immediateCaptures = 0;
  let openThirds = 0;
  let safeReplies = 0;

  for (const replyEdge of replies) {
    const metrics = getLocalMoveMetrics(replyEdge, nextState, context);
    immediateCaptures += metrics.captures;
    openThirds += metrics.createsThird;
    if (isSafe(replyEdge, nextState, context)) {
      safeReplies += 1;
    }
  }

  return { immediateCaptures, openThirds, safeReplies };
}

function solveMinimax(state: GameState, available: number[], context: AiContext): number {
  const emptyCount = available.length;
  const maxDepth = emptyCount <= 10 ? 11 : emptyCount <= 18 ? 7 : 5;
  const quiescenceBudget = emptyCount <= 14 ? 2 : 1;
  const transposition = new Map<string, number>();

  let bestScore = Number.NEGATIVE_INFINITY;
  let bestMoves: number[] = [available[0]];
  let alpha = Number.NEGATIVE_INFINITY;
  const beta = Number.POSITIVE_INFINITY;

  const sortedMoves = sortMoves(available, state, context);

  for (const move of sortedMoves) {
    const { state: nextState, extraTurn } = simulate(move, state, context);

    const score = extraTurn
      ? minimax(nextState, maxDepth, alpha, beta, true, context, transposition, quiescenceBudget)
      : minimax(nextState, maxDepth - 1, alpha, beta, false, context, transposition, quiescenceBudget);

    if (score > bestScore + HARD_TIE_THRESHOLD) {
      bestScore = score;
      bestMoves = [move];
    } else if (Math.abs(score - bestScore) <= HARD_TIE_THRESHOLD) {
      bestMoves.push(move);
    }

    alpha = Math.max(alpha, score);
  }

  return randomFrom(bestMoves) ?? bestMoves[0];
}

function minimax(
  state: GameState,
  depth: number,
  alphaInput: number,
  betaInput: number,
  maximizingPlayer: boolean,
  context: AiContext,
  transposition: Map<string, number>,
  quiescenceLeft: number
): number {
  if (state.occupiedEdges.size === context.board.edges.length) {
    return evaluate(state, context);
  }

  let effectiveDepth = depth;
  let effectiveQuiescence = quiescenceLeft;

  if (effectiveDepth <= 0) {
    if (effectiveQuiescence > 0 && countCapturableZones(state) > 0) {
      // Extend tactical lines where forced captures are still available.
      effectiveDepth = 1;
      effectiveQuiescence -= 1;
    } else {
      return evaluate(state, context);
    }
  }

  const key = hashState(state, effectiveDepth, maximizingPlayer, effectiveQuiescence);
  const cached = transposition.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const available = availableEdges(state, context.board);
  if (available.length === 0) {
    return evaluate(state, context);
  }

  const moves = sortMoves(available, state, context);
  let alpha = alphaInput;
  let beta = betaInput;

  if (maximizingPlayer) {
    let maxEval = Number.NEGATIVE_INFINITY;

    for (const move of moves) {
      const { state: nextState, extraTurn } = simulate(move, state, context);

      const evalScore = extraTurn
        ? minimax(nextState, effectiveDepth, alpha, beta, true, context, transposition, effectiveQuiescence)
        : minimax(nextState, effectiveDepth - 1, alpha, beta, false, context, transposition, effectiveQuiescence);

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) {
        break;
      }
    }

    transposition.set(key, maxEval);
    return maxEval;
  }

  let minEval = Number.POSITIVE_INFINITY;
  for (const move of moves) {
    const { state: nextState, extraTurn } = simulate(move, state, context);

    const evalScore = extraTurn
      ? minimax(nextState, effectiveDepth, alpha, beta, false, context, transposition, effectiveQuiescence)
      : minimax(nextState, effectiveDepth - 1, alpha, beta, true, context, transposition, effectiveQuiescence);

    minEval = Math.min(minEval, evalScore);
    beta = Math.min(beta, evalScore);
    if (beta <= alpha) {
      break;
    }
  }

  transposition.set(key, minEval);
  return minEval;
}

function evaluate(state: GameState, context: AiContext): number {
  const scores = getScores(state);
  const scoreDiff = (scores.o - scores.x) * 100;

  let nearCaptures = 0;
  let unstableZones = 0;
  let stableZones = 0;

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
      stableZones += 1;
    }
  }

  const safeMoves = countSafeMoves(state, context);
  const handoverRisks = countHandoverRiskMoves(state, context);
  const available = context.board.edges.length - state.occupiedEdges.size;
  const turnFactor = state.currentPlayer === 'o' ? 1 : -1;

  return (
    scoreDiff +
    nearCaptures * 30 * turnFactor -
    unstableZones * 11 +
    stableZones * 1.2 +
    safeMoves * 4 * turnFactor -
    handoverRisks * 5 * turnFactor +
    available * 0.15
  );
}

function countSafeMoves(state: GameState, context: AiContext): number {
  let safe = 0;
  for (const edgeId of availableEdges(state, context.board)) {
    if (isSafe(edgeId, state, context)) {
      safe += 1;
    }
  }
  return safe;
}

function countHandoverRiskMoves(state: GameState, context: AiContext): number {
  let risks = 0;
  for (const edgeId of availableEdges(state, context.board)) {
    const metrics = getLocalMoveMetrics(edgeId, state, context);
    if (metrics.captures > 0) {
      continue;
    }

    if (metrics.createsThird > 0) {
      risks += metrics.createsThird;
    }
  }

  return risks;
}

function simulate(move: number, state: GameState, context: AiContext): { state: GameState; extraTurn: boolean } {
  const nextState = cloneState(state);
  nextState.occupiedEdges.add(move);

  let captured = false;

  for (const zone of affectedZonesForEdge(move, context)) {
    if (zone.owner !== 'none') {
      continue;
    }

    const nextZone = nextState.zones[zone.id];
    if (!nextZone || nextZone.owner !== 'none') {
      continue;
    }

    const allOccupied = nextZone.edgeIds.every((edgeId) => nextState.occupiedEdges.has(edgeId));
    if (allOccupied) {
      nextZone.owner = nextState.currentPlayer;
      captured = true;
    }
  }

  if (!captured) {
    nextState.currentPlayer = nextPlayer(nextState.currentPlayer);
  }

  return { state: nextState, extraTurn: captured };
}

function sortMoves(moves: number[], state: GameState, context: AiContext): number[] {
  return [...moves].sort((a, b) => moveScore(b, state, context) - moveScore(a, state, context));
}

function moveScore(edgeId: number, state: GameState, context: AiContext): number {
  const metrics = getMoveMetrics(edgeId, state, context);
  let score = 0;
  score += metrics.captures * 120;
  score += metrics.chainCaptures * 52;
  score += isSafe(edgeId, state, context) ? 35 : 0;
  score -= metrics.createsThird * 62;
  score -= metrics.givesCaptures * 82;
  score += metrics.createsSecond * 4;
  return score + centerWeight(edgeId, context) * 5;
}

function getMoveMetrics(edgeId: number, state: GameState, context: AiContext): MoveMetrics {
  const local = getLocalMoveMetrics(edgeId, state, context);
  const simulation = simulate(edgeId, state, context);
  const capturable = countCapturableZones(simulation.state);

  return {
    captures: local.captures,
    createsThird: local.createsThird,
    createsSecond: local.createsSecond,
    givesCaptures: simulation.state.currentPlayer !== state.currentPlayer ? capturable : 0,
    chainCaptures: simulation.state.currentPlayer === state.currentPlayer ? capturable : 0
  };
}

function getLocalMoveMetrics(edgeId: number, state: GameState, context: AiContext): Pick<MoveMetrics, 'captures' | 'createsThird' | 'createsSecond'> {
  let captures = 0;
  let createsThird = 0;
  let createsSecond = 0;

  for (const zone of affectedZonesForEdge(edgeId, context)) {
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

function centerWeight(edgeId: number, context: AiContext): number {
  const cached = context.centerCache.get(edgeId);
  if (cached !== undefined) {
    return cached;
  }

  const edge = context.edgeById.get(edgeId);
  if (!edge) {
    return 0;
  }

  const a = context.board.nodes[edge.a];
  const b = context.board.nodes[edge.b];
  const x = (a.position.x + b.position.x) / 2;
  const y = (a.position.y + b.position.y) / 2;

  const dist = Math.hypot(x - context.centerX, y - context.centerY);
  const weight = Math.max(0, 1 - dist / context.maxDist);
  context.centerCache.set(edgeId, weight);
  return weight;
}

function affectedZonesForEdge(edgeId: number, context: AiContext): Zone[] {
  return context.edgeZones.get(edgeId) ?? [];
}

function hashState(state: GameState, depth: number, maximizingPlayer: boolean, quiescenceLeft: number): string {
  const occupied = Array.from(state.occupiedEdges).sort((a, b) => a - b).join(',');
  const owners = state.zones.map((zone) => zone.owner[0]).join('');
  return `${state.currentPlayer}|${depth}|${quiescenceLeft}|${maximizingPlayer ? '1' : '0'}|${occupied}|${owners}`;
}
