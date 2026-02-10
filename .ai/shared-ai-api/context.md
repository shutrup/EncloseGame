# Context

- `apps/web` currently computes AI move on the client (`computeAIMove` in `gameStore.ts`).
- `apps/api` currently has modules: `health`, `telegram`, `prisma`; no AI endpoint yet.
- User wants web flow to be shared/common (centralized), not separate per client.
- Fast pragmatic path: add AI endpoint in API and route web AI turns through backend.
- Keep client fallback to local compute to avoid hard failure when API is unreachable.
