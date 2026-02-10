import type { AILevel, BoardLayout, GameState, Zone } from './ai.types';

interface AiContext {
  board: BoardLayout;
  edgeZones: Map<number, Zone[]>;
  centerCache: Map<number, number>;
  centerX: number;
  centerY: number;
  maxDist: number;
}

interface MoveMetrics {
  captures: number;
  createsThird: number;
  createsSecond: number;
}

const HARD_TIE_THRESHOLD = 0.0001;

export function chooseBestMove(board: BoardLayout, state: GameState, level: AILevel): number | undefined {
  const available = board.edges.map((edge) => edge.id).filter((edgeId) => !state.occupiedEdges.has(edgeId));
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

  const xs = board.nodes.map((node) => node.position.x);
  const ys = board.nodes.map((node) => node.position.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const maxDist = Math.max(0.0001, Math.hypot(maxX - centerX, maxY - centerY));

  return {
    board,
    edgeZones,
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

function findCapturingEdge(state: GameState, available: number[], context: AiContext): number | undefined {
  for (const edgeId of available) {
    const metrics = getMoveMetrics(edgeId, state, context);
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
    let score = 0;
    score += metrics.captures * 170;
    score += metrics.createsSecond * 7;
    score -= metrics.createsThird * 135;
    score += isSafe(edgeId, state, context) ? 22 : 0;
    score += centerWeight(edgeId, context) * 8;

    if (score > bestScore) {
      bestScore = score;
      best = edgeId;
    }
  }

  return best;
}

function solveMinimax(state: GameState, available: number[], context: AiContext): number {
  const emptyCount = available.length;
  const maxDepth = emptyCount <= 10 ? 11 : emptyCount <= 18 ? 7 : 5;
  const transposition = new Map<string, number>();

  let bestScore = Number.NEGATIVE_INFINITY;
  let bestMoves: number[] = [available[0]];
  let alpha = Number.NEGATIVE_INFINITY;
  const beta = Number.POSITIVE_INFINITY;

  const sortedMoves = sortMoves(available, state, context);

  for (const move of sortedMoves) {
    const { state: nextState, extraTurn } = simulate(move, state, context);

    const score = extraTurn
      ? minimax(nextState, maxDepth, alpha, beta, true, context, transposition)
      : minimax(nextState, maxDepth - 1, alpha, beta, false, context, transposition);

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
  transposition: Map<string, number>
): number {
  if (depth <= 0 || state.occupiedEdges.size === context.board.edges.length) {
    return evaluate(state, context);
  }

  const key = hashState(state, depth, maximizingPlayer);
  const cached = transposition.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const available = context.board.edges.map((edge) => edge.id).filter((edgeId) => !state.occupiedEdges.has(edgeId));
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
        ? minimax(nextState, depth, alpha, beta, true, context, transposition)
        : minimax(nextState, depth - 1, alpha, beta, false, context, transposition);

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
      ? minimax(nextState, depth, alpha, beta, false, context, transposition)
      : minimax(nextState, depth - 1, alpha, beta, true, context, transposition);

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
  let scoreO = 0;
  let scoreX = 0;
  for (const zone of state.zones) {
    if (zone.owner === 'o') {
      scoreO += 1;
    } else if (zone.owner === 'x') {
      scoreX += 1;
    }
  }

  const scoreDiff = (scoreO - scoreX) * 100;

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

  const available = context.board.edges.length - state.occupiedEdges.size;
  const turnFactor = state.currentPlayer === 'o' ? 1 : -1;
  return scoreDiff + nearCaptures * 26 * turnFactor - unstableZones * 10 + stableZones * 1.5 + available * 0.2;
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
    nextState.currentPlayer = nextState.currentPlayer === 'x' ? 'o' : 'x';
  }

  return { state: nextState, extraTurn: captured };
}

function sortMoves(moves: number[], state: GameState, context: AiContext): number[] {
  return [...moves].sort((a, b) => moveScore(b, state, context) - moveScore(a, state, context));
}

function moveScore(edgeId: number, state: GameState, context: AiContext): number {
  const metrics = getMoveMetrics(edgeId, state, context);
  let score = 0;
  score += metrics.captures * 110;
  score += isSafe(edgeId, state, context) ? 40 : 0;
  score -= metrics.createsThird * 60;
  score += metrics.createsSecond * 5;
  return score + centerWeight(edgeId, context) * 5;
}

function getMoveMetrics(edgeId: number, state: GameState, context: AiContext): MoveMetrics {
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

function centerWeight(edgeId: number, context: AiContext): number {
  const cached = context.centerCache.get(edgeId);
  if (cached !== undefined) {
    return cached;
  }

  const edge = context.board.edges.find((candidate) => candidate.id === edgeId);
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

function hashState(state: GameState, depth: number, maximizingPlayer: boolean): string {
  const occupied = Array.from(state.occupiedEdges).sort((a, b) => a - b).join(',');
  const owners = state.zones.map((zone) => zone.owner[0]).join('');
  return `${state.currentPlayer}|${depth}|${maximizingPlayer ? '1' : '0'}|${occupied}|${owners}`;
}

function cloneState(state: GameState): GameState {
  return {
    currentPlayer: state.currentPlayer,
    occupiedEdges: new Set(state.occupiedEdges),
    zones: state.zones.map((zone) => ({
      ...zone,
      nodeIds: [...zone.nodeIds],
      edgeIds: [...zone.edgeIds]
    }))
  };
}
