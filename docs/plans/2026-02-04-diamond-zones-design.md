# Diamond Zones MVP Design

Date: 2026-02-04

## Summary

We will build a small, shippable MVP of a two-player strategy line-drawing game inspired by Dots and Boxes but not a clone. The board is a symmetric diamond arena (no protruding “tabs”), with 19 predefined zones. Players alternate drawing a single line between adjacent nodes. Completing a zone captures it and grants an extra turn. The winner is the player who captures the most zones. This MVP targets iOS only with SwiftUI and a vector-rendered board. The design prioritizes fast games, premium minimal visual style, and deterministic logic that supports future expansions (larger boards, alternate layouts, AI, online).

## 1. MVP Game Concept

### Game name candidates

- Prism Lines
- Apex Grid
- Vector Vault
- Facet Duel
- Crownfield

### Core design pillars

- Minimum form, maximum meaning: every line affects the tactical state.
- Premium geometry: clean diamond arena, thin lines, soft fills.
- Short sessions, deep choices: 5-6 minute matches with real branching.
- Symmetry = fairness: both players face identical positional constraints.

### Target session length

5-6 minutes for a 19-zone arena.

### Player fantasy

You are an architect of a crystalline arena. Each line is a precise cut. You control tempo by forcing or preventing closures, and you aim to set up multi-zone capture chains. The game feels calm, deliberate, and slightly cerebral rather than playful or childlike.

## 2. Simple but Complete Rules

- Players alternate turns. On your turn, draw exactly one line between two adjacent nodes.
- If your line completes a zone, you capture it and place your symbol (X or O) inside that zone.
- Capturing any zone grants an extra turn.
- The game ends when all zones are captured. The player with more zones wins.

The rules are learnable in under 10 seconds and support strategic depth through timing, sacrifices, and chain capture planning. They are deterministic and suitable for future online play.

## 3. Board Design

### Shape

A symmetric diamond arena with no protruding tabs. The outer silhouette is a clean rhombus, with internal subdivision into 19 zones.

### Size for MVP

19 zones.

### Why it is strategically interesting

- The diamond shape creates uneven “pressure bands” from edge to center.
- The center is more connected, enabling longer chains and tempo control.
- Edges create risky tradeoffs: short-term captures versus giving away central chains.

### Determinism

The board is fixed for MVP. We will hardcode nodes, edges, and zones as constant lists. This avoids procedural complexity while enabling future swaps of the layout.

### Visual treatment

- Lines are thin (2-3 px) with a refined, minimal aesthetic.
- Zones fill with a soft, semi-transparent color by owner.
- X/O are separate tokens outside the board for clarity and a premium look.

## 4. Absolute Minimum Feature Set

### Core

- Local multiplayer (same device)
- Turn system (one line per turn)
- Zone detection and capture
- Scoring and win condition
- Game reset

### Polish (minimal)

- Subtle line draw animation (100-150 ms)
- Zone fill fade-in (200-250 ms)
- Tactile feedback for valid moves
- Clean UI for score and current player

### Strict exclusions

- Accounts
- Online multiplayer
- Skins
- Meta progression
- Chat
- Currencies

## 5. Technical Architecture

### Game state model

- GameState
  - currentPlayer
  - edges: Set<EdgeId>
  - zones: [Zone] with owner: none | X | O
  - scoreX / scoreO
  - turnHistory (future undo/replay)

### Board representation

- Node: id + 2D position
- Edge: nodeA + nodeB
- Zone: list of EdgeId forming a closed contour

All lists are hardcoded for the 19-zone arena.

### Turn engine

1. Player selects an edge.
2. Validate edge exists and is not already occupied.
3. Add edge to occupied set.
4. Check each zone: if all edges occupied and owner is none, capture it.
5. If at least one capture, same player moves again; otherwise switch player.
6. End game when all zones are captured.

### Zone detection

Deterministic: each zone has a list of EdgeId. A zone is complete when all its edges are in the occupied set.

### Rendering

Use SwiftUI Canvas/Path to draw lines and zone fills from node coordinates. No physics engines. Rendering is deterministic and resolution-independent.

### Invalid moves prevention

- UI disables taps on occupied edges.
- Logic ignores any attempt to claim an occupied edge.

## 6. Tech Stack

### A. Ultra-fast MVP (selected)

- iOS only
- SwiftUI + Canvas/Path
- No external dependencies

### B. Scalable foundation (deferred)

- Flutter with CustomPainter

MVP choice is A for speed, polish, and premium iOS feel.

## 7. Monetization (Deferred)

No monetization in MVP. Revisit in v2.

## 8. Scope Guardrails

### Common overbuilds to avoid

- Board editor
- Overly complex animations
- Undo/replay
- AI opponent
- Multiple themes

### What to cut aggressively now

- Online features
- Ranking or tournaments
- Customization systems

### What can wait for v2

- Board size selection
- Multiple arena layouts
- Local AI opponent
- Undo/replay

## 9. Execution Plan (4-6 weeks)

1. Week 1
   - Define node, edge, and zone data for 19-zone diamond.
   - Render board and edge selection prototype.
2. Week 2
   - Implement turn engine and validation.
   - Implement zone detection and scoring.
3. Week 3
   - Add zone capture visuals and animations.
   - Add end-game and reset flow.
4. Week 4
   - Polish UI, haptics, and balance.
   - Basic correctness tests.
5. Weeks 5-6
   - Buffer for UX tuning, icon, and final tweaks.

## Decisions Locked

- Board shape: symmetric diamond, no protruding tabs.
- Zone count: 19 for MVP.
- Platform: iOS only, SwiftUI + Canvas/Path.
- Monetization: deferred.

## Open Items

- Finalize exact node/edge/zone coordinates for the 19-zone layout.
- Define the precise color palette for X/O zone fills.
