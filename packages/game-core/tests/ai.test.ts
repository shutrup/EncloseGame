import { describe, expect, test } from 'vitest';
import { computeAIMove, createGameSession } from '../src/engine';

function markOccupied(session: ReturnType<typeof createGameSession>, edgeIds: number[], currentPlayer: 'x' | 'o' = 'o') {
  for (const edgeId of edgeIds) {
    session.state.occupiedEdges.add(edgeId);
  }
  session.state.currentPlayer = currentPlayer;
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
});
