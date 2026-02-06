# Enclose Telegram Mini App Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fully migrate Enclose gameplay to a Telegram Mini App web stack and add a production-ready backend scaffold.

**Architecture:** Keep the existing iOS app intact while introducing a monorepo with `apps/web` (React/Vite/Tailwind/Zustand/Framer Motion), `apps/api` (NestJS + Prisma), and `packages/game-core` (TypeScript port of game rules + AI). Web app consumes shared `game-core` and Telegram WebApp APIs; API provides health/auth/session endpoints and DB schema foundations.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, Framer Motion, NestJS, Prisma, PostgreSQL, Railway

---

### Task 1: Monorepo Foundation

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `apps/web/*`
- Create: `apps/api/*`
- Create: `packages/game-core/*`

**Step 1: Add root workspace config**
- Configure npm workspaces for `apps/*` and `packages/*`.
- Add root scripts for dev/build/lint/typecheck.

**Step 2: Add shared TypeScript base config**
- Add strict TypeScript defaults and module resolution policy.

**Step 3: Scaffold web and API package manifests**
- Add dependencies and scripts for each target.

**Step 4: Commit foundation**
- `git add` root/workspace files
- `git commit -m "Scaffold monorepo for Telegram web and backend migration"`

### Task 2: Shared Game Core Port

**Files:**
- Create: `packages/game-core/src/types.ts`
- Create: `packages/game-core/src/board.ts`
- Create: `packages/game-core/src/state.ts`
- Create: `packages/game-core/src/ai.ts`
- Create: `packages/game-core/src/engine.ts`
- Create: `packages/game-core/src/index.ts`

**Step 1: Port board + model structures from Swift**
- Recreate `Player`, `ZoneOwner`, `Node`, `Edge`, `Zone`, `BoardPreset`.

**Step 2: Port game engine behavior**
- Implement `play`, `reset`, score derivation, game-over checks, last-move tracking.

**Step 3: Port AI levels**
- Implement easy/medium heuristics and minimax hard mode.

**Step 4: Add minimal unit tests (no heavy runner execution required now)**
- Add a few deterministic tests for capture and turn switching.

**Step 5: Commit shared core**
- `git add packages/game-core`
- `git commit -m "Port Enclose game core and AI to TypeScript package"`

### Task 3: Web Telegram Mini App

**Files:**
- Create/Modify: `apps/web/src/*`
- Create: `apps/web/index.html`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.cjs`
- Create: `apps/web/vite.config.ts`

**Step 1: Build app shell + theme**
- Add global styles and mobile-first layout with dark visual language.

**Step 2: Build game setup screen**
- Add size/mode/difficulty options and transition into game screen.

**Step 3: Build game screen**
- Render board edges/zones with SVG.
- Wire turns, scoring, AI move scheduling, new game flow.

**Step 4: Add Zustand store + Framer Motion polish**
- Centralize state and transitions.

**Step 5: Add Telegram WebApp integration**
- `ready`, `expand`, theme sync, optional haptic/back button hooks.

**Step 6: Commit web app**
- `git add apps/web`
- `git commit -m "Implement playable Enclose Telegram Mini App frontend"`

### Task 4: NestJS + Prisma API Scaffold

**Files:**
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/health/*`
- Create: `apps/api/src/telegram/*`
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/.env.example`

**Step 1: Bootstrap API modules**
- Health endpoint and Telegram auth verification skeleton.

**Step 2: Add Prisma schema**
- Define `User`, `Session`, `Match` baseline entities.

**Step 3: Add Railway-friendly run scripts**
- Ensure production start command and env expectations are explicit.

**Step 4: Commit API scaffold**
- `git add apps/api`
- `git commit -m "Add NestJS Prisma backend scaffold for Telegram mini app"`

### Task 5: Docs, Deploy, and Integration Notes

**Files:**
- Create: `README.md`
- Create: `docs/plans/2026-02-06-telegram-miniapp-rollout.md`
- Create: `apps/web/.env.example`
- Create: `railway.json` (or equivalent config)

**Step 1: Document setup and local run workflow**
- Explain Telegram bot setup, Mini App URL binding, and env vars.

**Step 2: Document deploy path on Railway**
- Separate services for web/api and required variables.

**Step 3: Final commit**
- `git add README.md docs apps/web/.env.example railway.json`
- `git commit -m "Document Telegram migration setup and Railway deployment flow"`
