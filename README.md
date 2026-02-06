# Enclose: iOS + Telegram Mini App Monorepo

This repository now contains:

- Existing iOS app (SwiftUI) in `/Enclose`
- Telegram Mini App frontend (React + Vite + Tailwind + Zustand + Framer Motion) in `/apps/web`
- Backend scaffold (NestJS + Prisma + PostgreSQL) in `/apps/api`
- Shared game logic package (TypeScript port of board/engine/AI) in `/packages/game-core`

## Stack (fixed)

- UI: React 18
- Types: TypeScript
- Bundler: Vite
- Styles: Tailwind CSS
- State: Zustand
- Motion: Framer Motion
- API: NestJS
- ORM: Prisma
- DB: PostgreSQL
- Deploy: Railway

## Monorepo layout

- `/apps/web` Telegram Mini App client
- `/apps/api` Nest API + Prisma schema
- `/packages/game-core` shared gameplay core (rules + AI)
- `/Enclose` existing iOS app (kept intact)

## Local setup

1. Install dependencies from repo root:

```bash
npm install
```

2. Start web app:

```bash
npm run dev:web
```

3. Start API:

```bash
npm run dev:api
```

4. Optional: run both in two terminals.

## Environment

### Web (`apps/web/.env.example`)

- `VITE_API_BASE_URL`
- `VITE_TELEGRAM_BOT_USERNAME`

### API (`apps/api/.env.example`)

- `PORT`
- `DATABASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBAPP_URL`

## Telegram Mini App wiring

1. Create Telegram bot via BotFather.
2. Set Mini App URL in bot settings (HTTPS only).
3. Point to deployed frontend URL.
4. Pass `initData` to API `/telegram/validate` for server-side verification workflow.

## Prisma

From repo root:

```bash
npm --workspace @enclose/api run prisma:generate
npm --workspace @enclose/api run prisma:migrate
```

## Railway deployment

Recommended: two services in one Railway project.

- Service A (`web`): root directory `apps/web`
- Service B (`api`): root directory `apps/api`

Each service includes its own `railway.toml` template.

## Notes

- Existing iOS app is not removed.
- Game rules and AI are centralized in `@enclose/game-core` for parity across platforms.
