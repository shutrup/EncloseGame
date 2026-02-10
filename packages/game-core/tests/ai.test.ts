import { describe, expect, test } from 'vitest';
import { computeAIMove, createGameSession } from '../src/engine';
import type { BoardLayout } from '../src/types';

function markOccupied(session: ReturnType<typeof createGameSession>, edgeIds: number[], currentPlayer: 'x' | 'o' = 'o') {
  for (const edgeId of edgeIds) {
    session.state.occupiedEdges.add(edgeId);
  }
  session.state.currentPlayer = currentPlayer;
}

function findSharedEdgePair(board: BoardLayout): { edgeId: number; zoneAId: number; zoneBId: number } {
  const edgeZones = new Map<number, number[]>();

  for (const zone of board.zones) {
    for (const edgeId of zone.edgeIds) {
      const zones = edgeZones.get(edgeId);
      if (zones) {
        zones.push(zone.id);
      } else {
        edgeZones.set(edgeId, [zone.id]);
      }
    }
  }

  for (const [edgeId, zones] of edgeZones) {
    if (zones.length === 2) {
      return { edgeId, zoneAId: zones[0], zoneBId: zones[1] };
    }
  }

  throw new Error('Expected at least one shared edge between two zones');
}

describe('game-core ai', () => {
  test('medium and hard complete a capture when available', () => {
    const medium = createGameSession({ preset: 'mini', aiLevel: 'medium' });
    const hard = createGameSession({ preset: 'mini', aiLevel: 'hard' });

    const targetZone = medium.board.zones[0];
    const [a, b, c, d] = targetZone.edgeIds;

    markOccupied(medium, [a, b, c]);
    markOccupied(hard, [a, b, c]);

    expect(computeAIMove(medium, 'medium')).toBe(d);
    expect(computeAIMove(hard, 'hard')).toBe(d);
  });

  test('hard avoids obvious third-edge trap when safe options exist', () => {
    const session = createGameSession({ preset: 'mini', aiLevel: 'hard' });
    const riskyZone = session.board.zones[0];
    const [a, b, c, d] = riskyZone.edgeIds;

    // Two edges already occupied -> c and d would create a third edge (risky move).
    markOccupied(session, [a, b]);

    const move = computeAIMove(session, 'hard');
    expect(move).toBeDefined();
    expect([c, d]).not.toContain(move);
  });

  test('medium avoids obvious third-edge trap when safe options exist', () => {
    const session = createGameSession({ preset: 'mini', aiLevel: 'medium' });
    const riskyZone = session.board.zones[0];
    const [a, b, c, d] = riskyZone.edgeIds;

    markOccupied(session, [a, b]);

    const move = computeAIMove(session, 'medium');
    expect(move).toBeDefined();
    expect([c, d]).not.toContain(move);
  });

  test('medium and hard prioritize shared edge that captures two zones', () => {
    const medium = createGameSession({ preset: 'mini', aiLevel: 'medium' });
    const hard = createGameSession({ preset: 'mini', aiLevel: 'hard' });

    const pair = findSharedEdgePair(medium.board);
    const zoneA = medium.board.zones[pair.zoneAId];
    const zoneB = medium.board.zones[pair.zoneBId];

    const setupEdges = Array.from(
      new Set([
        ...zoneA.edgeIds.filter((edgeId) => edgeId !== pair.edgeId),
        ...zoneB.edgeIds.filter((edgeId) => edgeId !== pair.edgeId)
      ])
    );

    markOccupied(medium, setupEdges);
    markOccupied(hard, setupEdges);

    expect(computeAIMove(medium, 'medium')).toBe(pair.edgeId);
    expect(computeAIMove(hard, 'hard')).toBe(pair.edgeId);
  });
});
