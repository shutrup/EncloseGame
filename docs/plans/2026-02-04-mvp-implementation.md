# Diamond Zones MVP Implementation Plan (No Tests)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the 19-zone diamond board with deterministic turn logic, zone capture, scoring, and a minimal SwiftUI UI.

**Architecture:** The board is derived from a fixed list of cell centers forming a diamond. Nodes and edges are generated deterministically from those cells. Each zone is a cell with four edges. The game engine validates moves, detects completed zones, awards extra turns, and determines the winner.

**Tech Stack:** SwiftUI (Canvas/Path). No automated tests by request.

---

### Task 1: Add core game types

**Files:**
- Create: `Enclose/Game/Types.swift`
- Create: `Enclose/Game/GameState.swift`
- Create: `Enclose/Game/GameEngine.swift`

**Step 1: Create Types**

Create `Enclose/Game/Types.swift`:

```swift
import Foundation
import CoreGraphics

enum Player: String {
    case x
    case o

    var next: Player { self == .x ? .o : .x }
}

enum ZoneOwner: Equatable {
    case none
    case player(Player)
}

struct Node: Hashable {
    let id: Int
    let position: CGPoint
}

struct Edge: Hashable {
    let id: Int
    let a: Int
    let b: Int
}

struct Zone {
    let id: Int
    let nodeIds: [Int]
    let edgeIds: [Int]
    var owner: ZoneOwner
}
```

**Step 2: Create GameState**

Create `Enclose/Game/GameState.swift`:

```swift
import Foundation

struct GameState {
    var currentPlayer: Player = .x
    var occupiedEdges: Set<Int> = []
    var zones: [Zone]

    var scoreX: Int { zones.filter { $0.owner == .player(.x) }.count }
    var scoreO: Int { zones.filter { $0.owner == .player(.o) }.count }

    var isGameOver: Bool { zones.allSatisfy { $0.owner != .none } }
}
```

**Step 3: Create GameEngine**

Create `Enclose/Game/GameEngine.swift`:

```swift
import Foundation
import Combine

final class GameEngine: ObservableObject {
    @Published private(set) var state: GameState
    let board: BoardLayout

    init(board: BoardLayout = .diamond19) {
        self.board = board
        self.state = GameState(zones: board.zones)
    }
}
```

**Step 4: Commit**

```bash
git add Enclose/Game/Types.swift Enclose/Game/GameState.swift Enclose/Game/GameEngine.swift

git commit -m "feat: add core game types"
```

---

### Task 2: Add unit test target (minimal, required by Xcode scheme)

**Files:**
- Modify: `Enclose.xcodeproj/project.pbxproj`
- Create: `EncloseTests/EncloseTests.swift`

**Step 1: Add test target in project**

Add a unit test target named `EncloseTests` in `Enclose.xcodeproj/project.pbxproj` and create:

```swift
import XCTest

final class EncloseTests: XCTestCase {
    func testPlaceholder() {
        XCTAssertTrue(true)
    }
}
```

**Step 2: Commit**

```bash
git add Enclose.xcodeproj/project.pbxproj EncloseTests/EncloseTests.swift

git commit -m "chore: add unit test target"
```

---

### Task 3: Implement deterministic diamond board layout

**Files:**
- Create: `Enclose/Game/BoardLayout.swift`
- Modify: `Enclose/Game/GameEngine.swift`

**Step 1: Create BoardLayout**

Create `Enclose/Game/BoardLayout.swift`:

```swift
import Foundation
import CoreGraphics

struct BoardLayout {
    let nodes: [Node]
    let edges: [Edge]
    let zones: [Zone]

    static let diamond19: BoardLayout = {
        let cellSize: CGFloat = 1.0
        let half: CGFloat = cellSize / 2.0

        // 5 rows: 1, 4, 9, 4, 1 (total 19)
        let rows: [(y: CGFloat, xs: [CGFloat])] = [
            (2, [0]),
            (1, [-1.5, -0.5, 0.5, 1.5]),
            (0, [-4, -3, -2, -1, 0, 1, 2, 3, 4]),
            (-1, [-1.5, -0.5, 0.5, 1.5]),
            (-2, [0])
        ]

        struct Corner: Hashable {
            let x: CGFloat
            let y: CGFloat
        }

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
        for row in rows {
            for x in row.xs {
                let topLeft = nodeId(x: x - half, y: row.y + half)
                let topRight = nodeId(x: x + half, y: row.y + half)
                let bottomLeft = nodeId(x: x - half, y: row.y - half)
                let bottomRight = nodeId(x: x + half, y: row.y - half)

                let e1 = edgeId(a: topLeft, b: topRight)
                let e2 = edgeId(a: topRight, b: bottomRight)
                let e3 = edgeId(a: bottomRight, b: bottomLeft)
                let e4 = edgeId(a: bottomLeft, b: topLeft)

                let zone = Zone(
                    id: zoneId,
                    nodeIds: [topLeft, topRight, bottomRight, bottomLeft],
                    edgeIds: [e1, e2, e3, e4],
                    owner: .none
                )
                zones.append(zone)
                zoneId += 1
            }
        }

        return BoardLayout(nodes: nodes, edges: edges, zones: zones)
    }()
}
```

**Step 2: Ensure GameEngine uses board zones**

`Enclose/Game/GameEngine.swift` already initializes with `BoardLayout.diamond19`.

**Step 3: Commit**

```bash
git add Enclose/Game/BoardLayout.swift Enclose/Game/GameEngine.swift

git commit -m "feat: add deterministic diamond board layout"
```

---

### Task 4: Implement move validation and zone capture

**Files:**
- Modify: `Enclose/Game/GameEngine.swift`

**Step 1: Add play logic**

Modify `Enclose/Game/GameEngine.swift`:

```swift
@discardableResult
func play(edgeId: Int) -> Bool {
    guard board.edges.contains(where: { $0.id == edgeId }) else { return false }
    guard !state.occupiedEdges.contains(edgeId) else { return false }

    state.occupiedEdges.insert(edgeId)

    var capturedAny = false
    for i in state.zones.indices {
        if state.zones[i].owner == .none {
            let edges = Set(state.zones[i].edgeIds)
            if edges.isSubset(of: state.occupiedEdges) {
                state.zones[i].owner = .player(state.currentPlayer)
                capturedAny = true
            }
        }
    }

    if !capturedAny {
        state.currentPlayer = state.currentPlayer.next
    }

    return true
}
```

**Step 2: Add reset**

```swift
func reset() {
    state = GameState(zones: board.zones)
}
```

**Step 3: Commit**

```bash
git add Enclose/Game/GameEngine.swift

git commit -m "feat: add move validation and zone capture"
```

---

### Task 5: Render board and enable edge tapping

**Files:**
- Create: `Enclose/UI/BoardView.swift`
- Modify: `Enclose/ContentView.swift`

**Step 1: Add BoardView**

Create `Enclose/UI/BoardView.swift`:

```swift
import SwiftUI

struct BoardView: View {
    @ObservedObject var engine: GameEngine

    var body: some View {
        GeometryReader { proxy in
            let size = min(proxy.size.width, proxy.size.height)
            let center = CGPoint(x: proxy.size.width / 2, y: proxy.size.height / 2)

            Canvas { context, _ in
                for edge in engine.board.edges {
                    let a = engine.board.nodes[edge.a].position
                    let b = engine.board.nodes[edge.b].position

                    let path = Path { p in
                        p.move(to: project(a, center: center, size: size))
                        p.addLine(to: project(b, center: center, size: size))
                    }

                    let isActive = engine.state.occupiedEdges.contains(edge.id)
                    context.stroke(path, with: .color(isActive ? .black : .gray.opacity(0.3)), lineWidth: isActive ? 3 : 2)
                }

                for zone in engine.state.zones {
                    guard case let .player(player) = zone.owner else { continue }
                    let color: Color = player == .x ? .blue : .red

                    let points = zone.nodeIds.map { engine.board.nodes[$0].position }
                    let path = Path { p in
                        guard let first = points.first else { return }
                        p.move(to: project(first, center: center, size: size))
                        for pt in points.dropFirst() {
                            p.addLine(to: project(pt, center: center, size: size))
                        }
                        p.closeSubpath()
                    }

                    context.fill(path, with: .color(color.opacity(0.25)))
                }
            }
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onEnded { value in
                        if let edgeId = nearestEdge(to: value.location, in: proxy.size) {
                            _ = engine.play(edgeId: edgeId)
                        }
                    }
            )
        }
    }

    private func project(_ point: CGPoint, center: CGPoint, size: CGFloat) -> CGPoint {
        let scale: CGFloat = size / 12.0
        return CGPoint(x: center.x + point.x * scale, y: center.y - point.y * scale)
    }

    private func nearestEdge(to location: CGPoint, in size: CGSize) -> Int? {
        let center = CGPoint(x: size.width / 2, y: size.height / 2)
        let scale: CGFloat = min(size.width, size.height) / 12.0

        var best: (id: Int, dist: CGFloat)?
        for edge in engine.board.edges {
            let a = engine.board.nodes[edge.a].position
            let b = engine.board.nodes[edge.b].position
            let midpoint = CGPoint(x: (a.x + b.x) / 2, y: (a.y + b.y) / 2)
            let screen = CGPoint(x: center.x + midpoint.x * scale, y: center.y - midpoint.y * scale)
            let d = hypot(screen.x - location.x, screen.y - location.y)
            if d < (best?.dist ?? .greatestFiniteMagnitude) {
                best = (edge.id, d)
            }
        }
        return best?.dist ?? .greatestFiniteMagnitude < 20 ? best?.id : nil
    }
}
```

**Step 2: Wire into ContentView**

Modify `Enclose/ContentView.swift`:

```swift
import SwiftUI

struct ContentView: View {
    @StateObject private var engine = GameEngine()

    var body: some View {
        VStack(spacing: 16) {
            HStack {
                Text("X: \(engine.state.scoreX)")
                Spacer()
                Text("O: \(engine.state.scoreO)")
            }
            .font(.headline)

            BoardView(engine: engine)
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            Button("New Game") {
                engine.reset()
            }
        }
        .padding()
    }
}
```

**Step 3: Commit**

```bash
git add Enclose/UI/BoardView.swift Enclose/ContentView.swift

git commit -m "feat: render board and allow edge taps"
```

---

### Task 6: Add turn indicator and light polish

**Files:**
- Modify: `Enclose/ContentView.swift`

**Step 1: Add turn label**

Add above the board:

```swift
Text(engine.state.currentPlayer == .x ? "X Turn" : "O Turn")
    .font(.subheadline)
    .padding(.bottom, 4)
```

**Step 2: Subtle background**

Add a light neutral background to the root view.

**Step 3: Commit**

```bash
git add Enclose/ContentView.swift

git commit -m "feat: add turn indicator"
```

---

Plan complete and saved to `docs/plans/2026-02-04-mvp-implementation.md`.
