# API AI Quality Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Strengthen API-driven AI tactical quality (especially handover avoidance and capture chaining) while keeping runtime responsive for Telegram Mini App.

**Architecture:** Improve the shared minimax/heuristic policy in `game-core` and mirror the same logic in API engine to preserve parity with web fallback. Introduce tactical pressure metrics and quiescence-like depth extension only in sharp positions.

**Tech Stack:** TypeScript, NestJS API, shared game-core engine, Vitest for game-core tests.

### Task 1: Extend tactical metrics

**Files:**
- Modify: `/Users/sarap005931/Desktop/Enclose/packages/game-core/src/ai.ts`
- Modify: `/Users/sarap005931/Desktop/Enclose/apps/api/src/ai/ai.engine.ts`

**Steps:**
1. Add richer move metrics (capture chain potential, opponent immediate captures after handover).
2. Add lightweight opponent-pressure estimation for one-ply tactical response.
3. Ensure helper functions are deterministic and side-effect free.

### Task 2: Improve medium policy

**Files:**
- Modify: `/Users/sarap005931/Desktop/Enclose/packages/game-core/src/ai.ts`
- Modify: `/Users/sarap005931/Desktop/Enclose/apps/api/src/ai/ai.engine.ts`

**Steps:**
1. Update medium score formula to include new tactical penalties/rewards.
2. Keep behavior distinct from hard: no full minimax, but stronger than greedy-only.

### Task 3: Improve hard search

**Files:**
- Modify: `/Users/sarap005931/Desktop/Enclose/packages/game-core/src/ai.ts`
- Modify: `/Users/sarap005931/Desktop/Enclose/apps/api/src/ai/ai.engine.ts`

**Steps:**
1. Add quiescence extension when depth reached and captures are still forced.
2. Improve move ordering using tactical metrics to strengthen pruning.
3. Keep transposition table and compatible hash strategy.

### Task 4: Improve evaluation

**Files:**
- Modify: `/Users/sarap005931/Desktop/Enclose/packages/game-core/src/ai.ts`
- Modify: `/Users/sarap005931/Desktop/Enclose/apps/api/src/ai/ai.engine.ts`

**Steps:**
1. Add mobility/safe-move and handover-risk components.
2. Retune coefficients conservatively to avoid overfitting to one board size.

### Task 5: Verification and regression coverage

**Files:**
- Modify: `/Users/sarap005931/Desktop/Enclose/packages/game-core/tests/ai.test.ts`

**Steps:**
1. Add test for medium avoiding obvious handover in a synthetic state.
2. Add test for hard preferring chain continuation when extra-turn line exists.
3. Keep existing capture/trap tests passing.

### Task 6: Lightweight checks

**Commands:**
- `npm --workspace @enclose/game-core run typecheck`
- `npm --workspace @enclose/api run typecheck`
- `npm --workspace @enclose/web run typecheck`

Expected:
- all three commands pass without TS errors.
