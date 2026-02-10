# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Enclose is a "Dots and Boxes" style strategy game implemented as a multi-platform monorepo:
- **Telegram Mini App** — React web app (`apps/web`)
- **NestJS API** — Backend with PostgreSQL/Prisma (`apps/api`)
- **Native iOS app** — SwiftUI (`Enclose/`)
- **Shared game logic** — TypeScript package (`packages/game-core`)
- **AI trainer** — Python Q-learning trainer (`ai-trainer/`)

## Build & Development Commands

```bash
# Install dependencies (from root)
npm install

# Web app development
npm run dev:web

# API development (requires DATABASE_URL in .env)
npm run dev:api

# Build all packages
npm run build

# Typecheck all packages
npm run typecheck

# Run game-core tests
npm --workspace @enclose/game-core run test

# Train AI and update weights
npm run train:ai
```

### iOS App
Open `Enclose.xcodeproj` in Xcode. Build target is `Enclose`.

### API Database
```bash
npm --workspace @enclose/api run prisma:generate  # Generate client
npm --workspace @enclose/api run prisma:migrate   # Run migrations
```

## Architecture

### Package Structure
- `packages/game-core/` — **Shared game logic** used by both web and API
  - `types.ts` — Core types: `Player`, `Zone`, `BoardLayout`, `GameState`, `GameSession`
  - `board.ts` — Board generation from presets (mini/standard/large)
  - `engine.ts` — Game engine: `createGameSession()`, `playEdge()`, `winner()`
  - `ai.ts` — AI move selection with 3 difficulty levels
  - `state.ts` — State management utilities

### Game Logic Flow
1. Create session via `createGameSession({ preset, aiLevel })`
2. Play moves via `playEdge(session, edgeId)` → returns `{ session, played, captured }`
3. Captures grant extra turns (player doesn't switch)
4. Game ends when all edges are occupied

### AI Difficulty Levels
- **Easy**: 22% random moves, otherwise greedy captures + safe moves
- **Medium**: Heuristic scoring (captures, safety, board position)
- **Hard**: Minimax with alpha-beta pruning and transposition tables

### Web App State
`apps/web/src/store/gameStore.ts` uses Zustand with screens: `home` → `setup` → `game` → `settings`

### API Modules
- `ai/` — AI move computation endpoint
- `telegram/` — Telegram webhook handling
- `prisma/` — Database service
- `health/` — Health check endpoint

### iOS App Structure
- `Enclose/Game/` — Game logic (mirrors game-core)
- `Enclose/UI/` — SwiftUI views
- Settings stored in UserDefaults

## Key Conventions

### TypeScript
- Immutable game state — functions return new state objects
- Player `'x'` is always human (first), `'o'` is opponent/AI
- Zone IDs match array indices in `BoardLayout.zones`

### Board Presets
```
mini:     [1, 3, 5, 3, 1]       — 13 dots hexagonal
standard: [1, 3, 5, 7, 5, 3, 1] — 25 dots hexagonal
large:    [1, 3, 5, 7, 9, 7, 5, 3, 1] — 41 dots hexagonal
```

### AI Weights
Trained weights are stored in `packages/game-core/src/data/weights.json`. The `npm run train:ai` command runs Python training and copies results to game-core.
