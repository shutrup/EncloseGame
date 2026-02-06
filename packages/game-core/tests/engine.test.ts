import { describe, expect, test } from 'vitest';
import { createGameSession, playEdge, getCurrentScores, isSessionOver } from '../src/engine';

function edgesForFirstZone() {
  const session = createGameSession({ preset: 'mini' });
  return session.board.zones[0]?.edgeIds ?? [];
}

describe('game-core engine', () => {
  test('switches turn when no zone is captured', () => {
    const session = createGameSession({ preset: 'mini' });
    const edgeId = session.board.edges[0]?.id;
    expect(edgeId).toBeDefined();

    const result = playEdge(session, edgeId as number);

    expect(result.played).toBe(true);
    expect(result.captured).toBe(false);
    expect(result.session.state.currentPlayer).toBe('o');
  });

  test('captures a zone when fourth edge is played', () => {
    const session = createGameSession({ preset: 'mini' });
    const firstZoneEdges = edgesForFirstZone();

    let next = session;
    next = playEdge(next, firstZoneEdges[0]).session;
    next = playEdge(next, firstZoneEdges[1]).session;
    next = playEdge(next, firstZoneEdges[2]).session;

    const result = playEdge(next, firstZoneEdges[3]);

    expect(result.captured).toBe(true);
    expect(result.session.state.zones[0]?.owner).toBeTypeOf('string');
    const scores = getCurrentScores(result.session);
    expect(scores.x + scores.o).toBe(1);
  });

  test('reports game over after all edges are occupied', () => {
    let session = createGameSession({ preset: 'mini' });
    for (const edge of session.board.edges) {
      const result = playEdge(session, edge.id);
      session = result.session;
    }

    expect(isSessionOver(session)).toBe(true);
  });
});
