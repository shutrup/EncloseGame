# Inputs

## User goal
- Make web AI 'shared/common' rather than separate logic client-side.
- Use task-think workflow.

## Implementation decision
- Create server endpoint in `apps/api` that computes AI move via shared `packages/game-core`.
- Switch web flow to call API endpoint for AI move (with local fallback to current computeAIMove to preserve UX if API unavailable).

## Constraints
- Focus on web now.
- Keep existing gameplay state model.
- Avoid heavy local test runs.
