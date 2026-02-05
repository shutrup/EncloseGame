# Board Size Presets Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Mini/Standard/Large board presets selectable in Settings, persisted via AppStorage, and applied on game reset.

**Architecture:** Introduce a `BoardPreset` enum that maps to row-count arrays and builds `BoardLayout` deterministically. `GameEngine` stores the current preset and can reset with a new preset. UI uses a segmented picker in Settings and resets the engine on change.

**Tech Stack:** SwiftUI, XCTest, AppStorage.

---

### Task 1: Add failing tests for board presets + engine reset

**Files:**
- Modify: `EncloseTests/EncloseTests.swift`

**Step 1: Write the failing tests**

```swift
import XCTest
@testable import Enclose

final class EncloseTests: XCTestCase {
    func testBoardPresetRows() {
        XCTAssertEqual(BoardPreset.mini.rows, [1, 3, 5, 3, 1])
        XCTAssertEqual(BoardPreset.standard.rows, [1, 3, 5, 7, 5, 3, 1])
        XCTAssertEqual(BoardPreset.large.rows, [1, 3, 5, 7, 9, 7, 5, 3, 1])
    }

    func testEngineUsesPresetZoneCount() {
        let mini = GameEngine(preset: .mini)
        let standard = GameEngine(preset: .standard)
        let large = GameEngine(preset: .large)

        XCTAssertEqual(mini.board.zones.count, 13)
        XCTAssertEqual(standard.board.zones.count, 25)
        XCTAssertEqual(large.board.zones.count, 41)
    }
}
```

**Step 2: Run tests to verify they fail**

Run:
```bash
xcodebuild -scheme Enclose -destination 'platform=iOS Simulator,name=iPhone 17 Pro' test
```

Expected: FAIL with errors that `BoardPreset` / `GameEngine(preset:)` are missing.

---

### Task 2: Implement BoardPreset + layout factory

**Files:**
- Modify: `Enclose/Game/BoardLayout.swift`

**Step 1: Implement BoardPreset and factory**

```swift
enum BoardPreset: String, CaseIterable, Identifiable {
    case mini
    case standard
    case large

    var id: String { rawValue }

    var rows: [Int] {
        switch self {
        case .mini: return [1, 3, 5, 3, 1]
        case .standard: return [1, 3, 5, 7, 5, 3, 1]
        case .large: return [1, 3, 5, 7, 9, 7, 5, 3, 1]
        }
    }
}

extension BoardLayout {
    static func from(rows: [Int]) -> BoardLayout {
        let cellSize: CGFloat = 2.0
        let half: CGFloat = cellSize / 2.0
        let yStart = (rows.count - 1) / 2
        let step: CGFloat = 2.0
        let rowDefs: [(y: CGFloat, xs: [CGFloat])] = rows.enumerated().map { index, count in
            let y = CGFloat(yStart - index) * step
            let start = -CGFloat(count - 1) / 2.0
            let xs = (0..<count).map { (start + CGFloat($0)) * step }
            return (y, xs)
        }

        struct Corner: Hashable { let x: CGFloat; let y: CGFloat }
        var nodeMap: [Corner: Int] = [:]
        var nodes: [Node] = []
        var edges: [Edge] = []
        var edgeMap: [Set<Int>: Int] = [:]
        var zones: [Zone] = []

        func nodeId(x: CGFloat, y: CGFloat) -> Int {
            let key = Corner(x: x, y: y)
            if let existing = nodeMap[key] { return existing }
            let id = nodes.count
            nodeMap[key] = id
            nodes.append(Node(id: id, position: CGPoint(x: x, y: y)))
            return id
        }

        func edgeId(a: Int, b: Int) -> Int {
            let key: Set<Int> = [a, b]
            if let existing = edgeMap[key] { return existing }
            let id = edges.count
            edgeMap[key] = id
            edges.append(Edge(id: id, a: min(a, b), b: max(a, b)))
            return id
        }

        var zoneId = 0
        for row in rowDefs {
            for x in row.xs {
                let topLeft = nodeId(x: x - half, y: row.y + half)
                let topRight = nodeId(x: x + half, y: row.y + half)
                let bottomLeft = nodeId(x: x - half, y: row.y - half)
                let bottomRight = nodeId(x: x + half, y: row.y - half)

                let e1 = edgeId(a: topLeft, b: topRight)
                let e2 = edgeId(a: topRight, b: bottomRight)
                let e3 = edgeId(a: bottomRight, b: bottomLeft)
                let e4 = edgeId(a: bottomLeft, b: topLeft)

                zones.append(Zone(
                    id: zoneId,
                    nodeIds: [topLeft, topRight, bottomRight, bottomLeft],
                    edgeIds: [e1, e2, e3, e4],
                    owner: .none
                ))
                zoneId += 1
            }
        }

        return BoardLayout(nodes: nodes, edges: edges, zones: zones)
    }

    static let diamond25 = BoardLayout.from(rows: BoardPreset.standard.rows)
}
```

**Step 2: Run tests to verify they still fail (until engine update)**

Run:
```bash
xcodebuild -scheme Enclose -destination 'platform=iOS Simulator,name=iPhone 17 Pro' test
```

Expected: FAIL with missing `GameEngine(preset:)`.

---

### Task 3: Update GameEngine to accept presets

**Files:**
- Modify: `Enclose/Game/GameEngine.swift`

**Step 1: Add preset state + init/reset**

```swift
final class GameEngine: ObservableObject {
    @Published private(set) var board: BoardLayout
    @Published private(set) var state: GameState
    private(set) var preset: BoardPreset

    init(preset: BoardPreset = .standard) {
        self.preset = preset
        self.board = BoardLayout.from(rows: preset.rows)
        self.state = GameState(zones: board.zones, edges: board.edges)
    }

    func reset(preset: BoardPreset? = nil) {
        if let preset { self.preset = preset }
        board = BoardLayout.from(rows: self.preset.rows)
        state = GameState(zones: board.zones, edges: board.edges)
    }
}
```

**Step 2: Run tests to verify they pass**

Run:
```bash
xcodebuild -scheme Enclose -destination 'platform=iOS Simulator,name=iPhone 17 Pro' test
```

Expected: PASS.

**Step 3: Commit**

```bash
git add EncloseTests/EncloseTests.swift Enclose/Game/BoardLayout.swift Enclose/Game/GameEngine.swift
git commit -m "feat: add board size presets and engine support"
```

---

### Task 4: Wire preset picker in Settings + reset on change

**Files:**
- Modify: `Enclose/ContentView.swift`

**Step 1: Add AppStorage + mapping**

```swift
@AppStorage("boardPreset") private var boardPresetRaw = BoardPreset.standard.rawValue

private var boardPreset: BoardPreset {
    get { BoardPreset(rawValue: boardPresetRaw) ?? .standard }
    set { boardPresetRaw = newValue.rawValue }
}
```

**Step 2: Reset engine when preset changes**

```swift
.onChange(of: boardPresetRaw) { _ in
    engine.reset(preset: boardPreset)
}
```

**Step 3: Add picker in SettingsView**

```swift
Section("Board") {
    Picker("Board Size", selection: $boardPresetRaw) {
        Text("Mini (13)").tag(BoardPreset.mini.rawValue)
        Text("Standard (25)").tag(BoardPreset.standard.rawValue)
        Text("Large (41)").tag(BoardPreset.large.rawValue)
    }
    .pickerStyle(.segmented)
}
```

**Step 4: Commit**

```bash
git add Enclose/ContentView.swift
git commit -m "feat: add board size picker in settings"
```

---

### Task 5: Update plan docs

**Files:**
- Modify: `docs/plans/2026-02-04-mvp-implementation.md`

**Step 1: Mark board presets as done + update next step**

**Step 2: Commit**

```bash
git add docs/plans/2026-02-04-mvp-implementation.md
git commit -m "docs: mark board presets done"
```

---

## Verification Summary

- Run: `xcodebuild -scheme Enclose -destination 'platform=iOS Simulator,name=iPhone 17 Pro' test`
- Expect: All tests pass
