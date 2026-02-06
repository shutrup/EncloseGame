# Enclose UI Polish Audit (2026-02-06)

## Goals
- Improve information density without clutter.
- Keep the board visually dominant and readable on dark backgrounds.
- Eliminate text truncation and weak hierarchy in setup/game screens.

## Completed In This Iteration
- [x] Setup segmented labels no longer overflow.
- [x] Added board contrast card/background for better readability.
- [x] Reduced excessive vertical emptiness on game screen by replacing spacer-heavy layout.
- [x] Added compact game progress strip (edges, zones, mode) to use space meaningfully.
- [x] Refined setup screen into section cards with concise selected-options summary.

## Next Priority Improvements

### P1: Gameplay Readability
- Add subtle "last move" highlight pulse on most recently drawn edge.
- Add optional "capturable cell" hint for beginners (toggle in Settings).
- Improve color separation for X/O in low-contrast accessibility contexts.

### P1: Motion & Feedback
- Introduce short transition between setup -> game (card morph/fade).
- Add micro-feedback for turn switch (badge pulse + gentle haptic gate by setting).
- Add win state celebratory sequence tied to captured majority, not only modal.

### P2: Information Architecture
- Add optional compact header mode for smaller phones.
- Add session mini-stats (moves this match, capture streak max).
- Clarify AI difficulty description inside new game sheet.

### P2: Visual Language
- Unify corner radius system (12/18/26) via constants.
- Normalize shadows and border alpha across cards/chips.
- Add subtle background texture/gradient layer for depth consistency.

### P3: Navigation & Discoverability
- Add quick access to Rules from game screen (help icon).
- Add onboarding re-entry from setup summary card.
- Consider replacing splash with faster branded launch state.

## Constraints
- Avoid heavy effects that impact battery/thermal behavior.
- Keep all changes localized in RU/EN resources.
- Preserve one-handed ergonomics for top controls and bottom CTA.
