# Diamond Zones MVP Implementation Plan (Updated)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a clean iOS MVP of the diamond‑board line game with deterministic logic, 25‑zone symmetric board, premium white UI, settings for haptics/animations/tutorial, and polished interactions.

**Architecture:** Fixed board layout with precomputed nodes/edges/zones. Game engine validates moves, captures zones, grants extra turns, and ends game. Rendering uses SwiftUI Canvas/Path with tap/drag hit detection. Settings are stored via AppStorage.

**Tech Stack:** SwiftUI (Canvas/Path), UIKit haptics. No automated tests by request.

---

## Task 1: Core game types and engine

**Status:** Done

**Files:**
- `Enclose/Game/Types.swift`
- `Enclose/Game/GameState.swift`
- `Enclose/Game/GameEngine.swift`

**Behavior:**
- Current player switching
- Occupied edges tracking
- Zone capture + extra turn
- `reset()`

---

## Task 2: Deterministic symmetric board (25 zones)

**Status:** Done

**Board shape:** `1-3-5-7-5-3-1` (no side single protrusions)

**Files:**
- `Enclose/Game/BoardLayout.swift` (uses `diamond25`)
- `Enclose/Game/GameEngine.swift` default init uses `diamond25`

---

## Task 3: Rendering + interaction

**Status:** Done

**Files:**
- `Enclose/UI/BoardView.swift`

**Features:**
- Lines + nodes drawing
- X/O inside zones (no fill)
- Hover highlight for available line
- Hit detection with expanded radius
- Line “pop” animation
- Haptics on move + separate haptic on capture

---

## Task 4: Core UI

**Status:** Done

**Files:**
- `Enclose/ContentView.swift`

**Features:**
- White background
- Score pills
- Turn indicator
- New Game button

---

## Task 5: Game over modal (premium style)

**Status:** Done

**Features:**
- Winner/Draw title
- Score line
- Play Again button
- Soft shadow + gradient card

---

## Task 6: Settings + tutorial

**Status:** Done

**Features:**
- Settings button (⚙️)
- AppStorage toggles: Haptics, Animations
- Tutorial moved to Settings (Show Tutorial)
- Onboarding overlay hidden by default; shown on demand

---

## Remaining Optional Enhancements

1. **Icon + Launch Screen**
   - Define app icon style
   - Simple launch screen (board silhouette)

2. **Board size selector (future)**
   - Small / Medium / Large presets

3. **Localization (future)**
   - RU/EN strings

---

## Current Next Step (if continuing)

- Decide on icon/launch screen direction OR
- Start board size presets

