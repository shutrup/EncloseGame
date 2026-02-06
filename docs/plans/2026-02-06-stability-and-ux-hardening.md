# Stability and UX Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate race conditions and UX regressions, restore reliable tests, and ensure build+test health for Enclose.

**Architecture:** Apply targeted fixes in `GameEngine` and `SoundManager` to remove stale async side effects and enforce sane defaults. Simplify navigation hierarchy to native SwiftUI patterns, localize remaining hardcoded UI strings, and restore a functional unit-test target using file-system synchronized test sources.

**Tech Stack:** SwiftUI, Foundation, XCTest, xcodebuild.

---

### Task 1: Stabilize AI turn scheduling and cancellation

**Files:**
- Modify: `Enclose/Game/GameEngine.swift`

**Step 1:** Add explicit AI scheduling state and generation invalidation.
**Step 2:** Invalidate pending AI work on `reset` and when disabling AI.
**Step 3:** Guard delayed AI callback with generation checks so old tasks cannot mutate new games.
**Step 4:** Preserve chain-capture behavior for AI while avoiding duplicate schedules.

**Verification:**
- `xcodebuild -project Enclose.xcodeproj -scheme Enclose -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.1' build`

---

### Task 2: Fix sound default behavior

**Files:**
- Modify: `Enclose/EncloseApp.swift`
- Modify: `Enclose/Game/SoundManager.swift`

**Step 1:** Register app defaults for user settings at app startup.
**Step 2:** Update sound-read logic to treat missing key as enabled.

**Verification:**
- Build succeeds and no compile warnings/errors in modified files.

---

### Task 3: Improve SwiftUI navigation and localization consistency

**Files:**
- Modify: `Enclose/UI/RulesView.swift`
- Modify: `Enclose/UI/SettingsView.swift`
- Modify: `Enclose/UI/GameSetupView.swift`
- Modify: `Enclose/UI/HomeView.swift`
- Modify: `Enclose/UI/GameView.swift`
- Modify: `Enclose/UI/BoardView.swift`
- Modify: `Enclose/Resources/en.lproj/Localizable.strings`
- Modify: `Enclose/Resources/ru.lproj/Localizable.strings`

**Step 1:** Remove nested `NavigationStack` wrappers from pushed screens.
**Step 2:** Replace hardcoded visible UI copy with localized keys.
**Step 3:** Remove dead/unused view state and obvious cleanup-only leftovers.

**Verification:**
- `xcodebuild ... build` passes.
- Manual grep check finds no remaining obvious non-brand hardcoded strings.

---

### Task 4: Restore unit-test execution

**Files:**
- Create: `EncloseTests/EncloseTests.swift`
- Modify: `Enclose.xcodeproj/project.pbxproj`

**Step 1:** Add synchronized `EncloseTests` group for test target in project file.
**Step 2:** Add minimal but meaningful tests for board presets and core move validity.
**Step 3:** Ensure `xcodebuild test` runs and passes.

**Verification:**
- `xcodebuild -project Enclose.xcodeproj -scheme Enclose -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.1' test`

---

### Task 5: Final verification sweep

**Files:**
- Modify if needed based on verification

**Step 1:** Run full build and test commands.
**Step 2:** Capture outcomes and remaining risks (if any).

**Verification Commands:**
- `xcodebuild -project Enclose.xcodeproj -scheme Enclose -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.1' build`
- `xcodebuild -project Enclose.xcodeproj -scheme Enclose -destination 'platform=iOS Simulator,name=iPhone 17 Pro,OS=26.1' test`
