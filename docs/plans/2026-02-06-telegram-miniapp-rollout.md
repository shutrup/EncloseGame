# Telegram Mini App Rollout Notes

## Target topology

- `web` service: serves React Mini App
- `api` service: NestJS backend + Prisma
- `postgres` service: managed PostgreSQL

## Rollout steps

1. Deploy API first and verify `GET /health`.
2. Connect API to PostgreSQL and run Prisma migrate/generate.
3. Deploy web service and configure `VITE_API_BASE_URL`.
4. Link Telegram bot Mini App URL to deployed web domain.
5. Smoke test in Telegram app (iOS + Android + desktop).

## Smoke checklist

- Setup screen opens inside Telegram without layout shift.
- PvP game flow completes and scoring is correct.
- Single-player AI makes legal moves.
- Game-over state and restart behave correctly.
- API health is stable and reachable from web.

## Post-MVP hardening

- Implement real Telegram hash validation in API.
- Persist completed matches in database.
- Add auth/session binding to Telegram user.
- Add telemetry and error reporting.
