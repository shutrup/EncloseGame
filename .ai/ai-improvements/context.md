# Context: Current AI State (Enclose)

## Scope Reviewed
- Web/shared core AI:
  - `/Users/sarap005931/Desktop/Enclose/packages/game-core/src/ai.ts`
  - `/Users/sarap005931/Desktop/Enclose/packages/game-core/src/ai-learning.ts`
  - `/Users/sarap005931/Desktop/Enclose/packages/game-core/src/engine.ts`
- Web integration:
  - `/Users/sarap005931/Desktop/Enclose/apps/web/src/store/gameStore.ts`
  - `/Users/sarap005931/Desktop/Enclose/apps/web/src/game/SetupScreen.tsx`
- iOS AI:
  - `/Users/sarap005931/Desktop/Enclose/Enclose/Game/AI.swift`
  - `/Users/sarap005931/Desktop/Enclose/Enclose/Game/GameEngine.swift`

## What Exists Now

### 1) Difficulty structure
- Shared/web supports: `easy`, `medium`, `hard`, `learning`.
- iOS supports: `easy`, `medium`, `hard` (no learning mode in Swift UI path).

### 2) Core decision logic (web/shared + iOS, mostly same ideas)
- `easy`:
  - Take immediate capture (if a box has 3 edges).
  - Else choose random safe edge.
  - Else random available edge.
- `medium`:
  - Same as easy with minor behavior difference (safe-first random).
- `hard`:
  - Minimax + alpha-beta pruning.
  - Dynamic search depth by remaining edges:
    - <=12: depth 8
    - <=20: depth 4
    - else: depth 2
  - Move ordering: capture > safe > other.
- Evaluation function:
  - `(scoreO - scoreX) * 100` only.

### 3) Learning mode (web/shared only)
- `ai-learning.ts` defines a linear Q approximator with handcrafted features.
- But in practice, `ai.ts` creates a new `LearningAgent()` on each move and only calls `getBestMove`.
- `update()` and persistent weight changes are never invoked from gameplay.
- Result: "learning" mode is static heuristic with epsilon randomness, not true online learning.

### 4) Runtime integration
- Web uses `computeAIMove()` from shared core via Zustand store and a timer delay.
- iOS runs AI in `GameEngine.makeAIMove()` with a 0.6s delayed background compute.
- No transposition table / no cached search states.

## Main Weak Points

1. **No chain/endgame strategy model**
- Dots-and-boxes quality depends heavily on chain management (sacrifice, control parity, long-chain timing).
- Current heuristic only captures immediate local effects (capture/safe), so strategic endgame quality is limited.

2. **Hard mode evaluation is too shallow**
- Evaluation ignores:
  - number of 3-edge boxes given to opponent,
  - chain lengths,
  - parity/control,
  - forced capture sequences.
- This causes strong tactical mistakes outside immediate horizon.

3. **Learning mode is effectively not learning**
- Agent state is recreated each move.
- No replay buffer, no episode loop, no persistence.
- Weights appear pre-filled but not trained in current app flow.

4. **Inconsistent AI feature set between platforms**
- Swift and TS implementations diverge over time.
- iOS has no `learning` level and separate solver code.

5. **Performance architecture is basic**
- Minimax has ordering and pruning, but no transposition table (state hashing), no iterative deepening/time budget.

## Constraints / Risks
- Full perfect-play solver for larger boards is expensive.
- Need to avoid UI jank in Telegram WebApp and iOS while strengthening AI.
- Platform parity should be preserved from one source of truth where possible.
