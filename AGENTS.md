# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Enclose is a "Dots and Boxes" style strategy game focused on iOS:
- **Native iOS app** — SwiftUI (`Enclose/`)
- **Shared game logic** — TypeScript package (`packages/game-core`)
- **AI trainer** — Python Q-learning trainer (`ai-trainer/`)

## Build & Development Commands

```bash
# Install dependencies (from root)
npm install

# Build shared game-core package
npm run build

# Typecheck shared game-core package
npm run typecheck

# Run game-core tests
npm --workspace @enclose/game-core run test

# Train AI and update weights
npm run train:ai
```

### iOS App
Open `Enclose.xcodeproj` in Xcode. Build target is `Enclose`.

## Architecture

### Package Structure
- `packages/game-core/` — shared game logic
  - `types.ts` — core types: `Player`, `Zone`, `BoardLayout`, `GameState`, `GameSession`
  - `board.ts` — board generation from presets (mini/standard/large)
  - `engine.ts` — game engine: `createGameSession()`, `playEdge()`, `winner()`
  - `ai.ts` — AI move selection with 3 difficulty levels
  - `state.ts` — state management utilities

### Game Logic Flow
1. Create session via `createGameSession({ preset, aiLevel })`
2. Play moves via `playEdge(session, edgeId)` → returns `{ session, played, captured }`
3. Captures grant extra turns (player doesn't switch)
4. Game ends when all edges are occupied

### AI Difficulty Levels
- **Easy**: 22% random moves, otherwise greedy captures + safe moves
- **Medium**: heuristic scoring (captures, safety, board position)
- **Hard**: minimax with alpha-beta pruning and transposition tables

### iOS App Structure
- `Enclose/Game/` — game logic
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
