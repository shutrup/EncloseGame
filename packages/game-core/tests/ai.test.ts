import { describe, expect, test } from 'vitest';
import { bestMove, createGameSession, type GameState } from '../src';

function cloneStateWithEdges(sessionState: GameState, edgeIds: number[]): GameState {
  return {
    currentPlayer: 'o',
    occupiedEdges: new Set(edgeIds),
    zones: sessionState.zones.map((zone) => ({ ...zone }))
  };
}

describe('ai move selection', () => {
  test('hard AI closes a box when capture is available', () => {
    const session = createGameSession({ preset: 'mini' });
    const zone = session.board.zones[0];
    const occupied = zone.edgeIds.slice(0, 3);
    const state = cloneStateWithEdges(session.state, occupied);

    const move = bestMove(session.board, state, 'hard');

    expect(move).toBe(zone.edgeIds[3]);
  });

  test('hard AI avoids creating a third edge when safe moves exist', () => {
    const session = createGameSession({ preset: 'mini' });
    const zone = session.board.zones.find((candidate) => candidate.edgeIds.length === 4);
    expect(zone).toBeDefined();

    const occupied = zone!.edgeIds.slice(0, 2);
    const state = cloneStateWithEdges(session.state, occupied);

    const move = bestMove(session.board, state, 'hard');
    expect(move).toBeDefined();

    const dangerousMoves = zone!.edgeIds.slice(2);
    // In this synthetic position, there are many untouched edges that keep every zone at 0-1 occupied edges.
    // Improved hard AI should avoid opening this box and choose one of those safe alternatives.
    expect(dangerousMoves).not.toContain(move);
  });
});
