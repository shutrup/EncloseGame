# Plan: AI Improvement Roadmap

## Goal
Make AI feel "smart and fair" on all board sizes while keeping move time smooth in Telegram WebApp and iOS.

## Priority 0 (Fast wins, high impact)

### P0.1 Unify AI behavior source
- Keep core decision logic in `packages/game-core` as primary source.
- Minimize divergence in Swift by either:
  - calling shared logic (long-term), or
  - mirroring exact algorithm + tests against shared fixtures (short-term).

### P0.2 Distinct difficulty personalities
- `easy`: mostly safe/random, occasional tactical mistakes by design.
- `medium`: greedy + avoid obvious traps.
- `hard`: strategic chain-aware play.

### P0.3 Improve hard evaluation without heavy refactor
Add weighted terms to evaluation (in addition to score margin):
- immediate captures,
- created 3-edge boxes for opponent (strong penalty),
- chain potential,
- parity/control signal.

Expected outcome: visibly stronger decisions in mid/endgame.

## Priority 1 (Core strength)

### P1.1 Chain-aware model
Implement chain extraction on current state:
- identify open chains and their lengths,
- estimate who controls final long chains,
- include chain parity in move score.

### P1.2 Tactical quiescence extension
At leaf nodes:
- if captures are forced/available, extend search until tactical sequence stabilizes.

This reduces horizon blunders with cheap extra depth only in tactical positions.

### P1.3 Transposition table
- Hash state (occupiedEdges + currentPlayer + zone owners compact signature).
- Cache evaluated nodes with depth and bounds.

Expected outcome: deeper effective search at same CPU budget.

## Priority 2 (Learning mode made real)

### P2.1 Make learning persistent
- Keep a long-lived `LearningAgent` instance per match/session.
- Call `update()` on transitions.
- Save/load weights (`localStorage` for web; file/user defaults for iOS if needed).

### P2.2 Controlled self-play training script
- Add offline training utility in `packages/game-core` (Node script).
- Self-play thousands of episodes and export versioned weights JSON.

### P2.3 Hybrid policy
- `learning` move score = blend(learned Q, tactical safety constraints).
- Prevent obvious blunders regardless of noisy weights.

## Priority 3 (Product quality)

### P3.1 Difficulty calibration harness
- Generate benchmark positions (opening/mid/endgame).
- Measure:
  - win rate vs lower level,
  - average move latency,
  - blunder rate (gives immediate capture chain).

### P3.2 Deterministic seeds + reproducible AI tests
- Fixed RNG seeds for tests.
- Snapshot expected moves for canonical board states.

### P3.3 Time-budgeted search
- Use iterative deepening and stop at time cap (e.g., 30-80ms web, 50-120ms iOS).

## Suggested Implementation Sequence
1. Upgrade hard evaluation (P0.3).
2. Add chain extraction + quiescence (P1.1, P1.2).
3. Add transposition table (P1.3).
4. Stabilize difficulty curves (P0.2).
5. Implement true learning loop + persistence (P2.x).
6. Add benchmark harness and deterministic tests (P3.x).

## Done Criteria
- Hard beats Medium with clear margin on standard board.
- Medium beats Easy consistently.
- Move latency remains smooth on Telegram/iOS UI.
- Learning mode demonstrably changes behavior after training sessions.
