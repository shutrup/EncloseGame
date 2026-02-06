import type { GameState, Player, Zone, ZoneOwner } from './types';

export function createInitialState(zones: Zone[]): GameState {
  return {
    currentPlayer: 'x',
    occupiedEdges: new Set<number>(),
    zones: zones.map((zone) => ({
      ...zone,
      nodeIds: [...zone.nodeIds],
      edgeIds: [...zone.edgeIds]
    }))
  };
}

export function cloneState(state: GameState): GameState {
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

export function scoreForPlayer(state: GameState, player: Player): number {
  return state.zones.filter((zone) => zone.owner === player).length;
}

export function getScores(state: GameState): { x: number; o: number } {
  return {
    x: scoreForPlayer(state, 'x'),
    o: scoreForPlayer(state, 'o')
  };
}

export function isGameOver(state: GameState): boolean {
  return state.zones.every((zone) => zone.owner !== 'none');
}

export function nearCaptureEdgeIds(state: GameState): number[] {
  const hinted = new Set<number>();

  for (const zone of state.zones) {
    if (zone.owner !== 'none') {
      continue;
    }

    const occupiedCount = zone.edgeIds.filter((edgeId) => state.occupiedEdges.has(edgeId)).length;
    if (occupiedCount !== 3) {
      continue;
    }

    for (const edgeId of zone.edgeIds) {
      if (!state.occupiedEdges.has(edgeId)) {
        hinted.add(edgeId);
      }
    }
  }

  return Array.from(hinted).sort((a, b) => a - b);
}
