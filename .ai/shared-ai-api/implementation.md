# Implementation

## Added API endpoint
- `POST /ai/move` in `apps/api/src/ai/ai.controller.ts`.
- New module wired in `apps/api/src/app.module.ts`.

## Added server AI engine
- `apps/api/src/ai/ai.engine.ts`
- Supports levels: easy / medium / hard.
- Uses heuristic + minimax with transposition cache.

## Added payload types and validation
- `apps/api/src/ai/ai.types.ts`
- `apps/api/src/ai/ai.service.ts` validates payload shape and level.

## Web integration
- `apps/web/src/lib/aiApi.ts` sends session snapshot to `/ai/move`.
- `apps/web/src/store/gameStore.ts` now uses API-first AI move and local fallback (`computeAIMove`) if API request fails.

## Verification
- `npm --workspace @enclose/api run typecheck` ✅
- `npm --workspace @enclose/web run typecheck` ✅
