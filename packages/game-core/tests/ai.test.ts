import { describe, expect, test } from 'vitest';
import { computeAIMove, createGameSession } from '../src/engine';

function unoccupiedEdgesForZone(session: ReturnType<typeof createGameSession>, zoneIndex = 0): number[] {
  const zone = session.board.zones[zoneIndex];
  return zone.edgeIds.filter((edgeId) => !session.state.occupiedEdges.has(edgeId));
}

describe('game-core ai', () => {
  test('medium captures a zone when capture is available', () => {
    const session = createGameSession({ preset: 'mini', aiLevel: 'medium' });
    const zoneEdges = session.board.zones[0].edgeIds;

    session.state.currentPlayer = 'o';
    session.state.occupiedEdges.add(zoneEdges[0]);
    session.state.occupiedEdges.add(zoneEdges[1]);
    session.state.occupiedEdges.add(zoneEdges[2]);

    const aiMove = computeAIMove(session);

    expect(aiMove).toBe(zoneEdges[3]);
  });

  test('hard avoids creating an immediate capture for the opponent when safe edges exist', () => {
    const session = createGameSession({ preset: 'mini', aiLevel: 'hard' });
    const zoneEdges = session.board.zones[0].edgeIds;

    session.state.currentPlayer = 'o';
    session.state.occupiedEdges.add(zoneEdges[0]);
    session.state.occupiedEdges.add(zoneEdges[1]);

    const riskyMoves = new Set([zoneEdges[2], zoneEdges[3]]);
    const safeMoves = session.board.edges
      .map((edge) => edge.id)
      .filter((edgeId) => !session.state.occupiedEdges.has(edgeId) && !riskyMoves.has(edgeId));

    expect(safeMoves.length).toBeGreaterThan(0);

    const aiMove = computeAIMove(session);

    expect(aiMove).toBeDefined();
    expect(riskyMoves.has(aiMove as number)).toBe(false);
  });

  test('hard takes available chain captures when retaining the turn', () => {
    const session = createGameSession({ preset: 'mini', aiLevel: 'hard' });
    const firstZone = session.board.zones[0];
    const secondZone = session.board.zones[1];

    session.state.currentPlayer = 'o';

    for (const edgeId of firstZone.edgeIds.slice(0, 3)) {
      session.state.occupiedEdges.add(edgeId);
    }

    const sharedEdge = firstZone.edgeIds.find((edgeId) => secondZone.edgeIds.includes(edgeId));
    expect(sharedEdge).toBeDefined();

    for (const edgeId of secondZone.edgeIds) {
      if (edgeId !== sharedEdge) {
        session.state.occupiedEdges.add(edgeId);
      }
    }

    const aiMove = computeAIMove(session);

    expect(aiMove).toBe(sharedEdge);

    const remainingInFirstZone = unoccupiedEdgesForZone(session, 0);
    expect(remainingInFirstZone).toContain(sharedEdge);
  });
});
