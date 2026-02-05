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

## Task 7: Board Size Presets
 
 **Status:** Done
 
 **Features:**
 - Mini (13x), Standard (25x), Large (41x) presets
 - Settings picker with size indication
 - Game engine support for dynamic board generation
 - Auto-reset on change (via AppStorage)
 
 ---
 
## Task 8: Localization
 
 **Status:** Done
 
 **Features:**
 - Full EN/RU support
 - Localizable.strings files
 - UI updated to use localized keys
 
 ---
 
 ## Current Next Step (if continuing)
 
 - Maintenance / Polish

## 6. Phase 3: Interactive Onboarding
**Status:** Done
**Features:**
- `TutorialManager` state machine.
- Interactive overlay in `GameView`.
- Step-by-step guidance strings (RU/EN).

## 7. Phase 4: UI Polish & Design System
**Status:** Done
**Features:**
- **Dark Theme:** Unified `AppTheme` (Black background, dark surface cards).
- **Floating TabBar:** Replaced native tab bar with custom floating capsule.
- **Rules Redesign:** Detailed visual cards for better readability.
- **Splash Screen:** Premium "self-drawing square" animation.

## 8. Integration Fixes
- **Audio:** Added `.wav` support to `SoundManager` (user provided wav files).
- **Project Structure:** Registered missing Launch Screen and Tutorial files.

## 9. Bug Fixes
- **Tutorial:** Added missing `titleKey` to `TutorialStep` and corresponding localization keys.

## 10. UI Consistency Fix
- **Theme:** Forced Light Mode globally in `EncloseApp` to prevent mixed UI states.

## 11. Final Polish Refinements
- **Theme:** Reverted to Adaptive Theme (Light/Dark support) using `UIColor.systemBackground` etc.
- **UI:** Removed Interactive Tutorial as requested.
- **UI:** Moved "New Game" menu to Toolbar (top right) for cleaner layout.
- **Audio:** Configured `AVAudioSession` category to `.ambient` to fix playback issues.

## 12. Audio Control
- **Settings:** Added "Sound" toggle to Settings menu.
- **Engine:** `SoundManager` now respects the user preference.
