import SwiftUI
import UIKit

struct BoardView: View {
    @ObservedObject var engine: GameEngine
    let hapticsEnabled: Bool
    let animationsEnabled: Bool
    
    @State private var hoveredEdgeId: Int?
    @State private var lastPlayedEdgeId: Int?
    @State private var lastCapturedZoneIds: Set<Int> = []
    
    @State private var particleTrigger: CGPoint?
    @State private var particleColor: Color = .blue

    // Adaptive Colors via AppTheme
    private let inactiveLine = AppTheme.inactiveGrid
    private let activeLine = AppTheme.activeLine
    private let nodeColor = AppTheme.inactiveGrid.opacity(0.5)
    private let haptic = UIImpactFeedbackGenerator(style: .rigid)

    var body: some View {
        GeometryReader { proxy in
            let size = min(proxy.size.width, proxy.size.height)
            let center = CGPoint(x: proxy.size.width / 2, y: proxy.size.height / 2)
            let metrics = BoardMetrics(proxy: proxy, engine: engine)

            ZStack {
                // Layer 1: Grid & Nodes (Static)
                gridLayer(center: center, scale: metrics.scale, bounds: metrics.bounds)
                
                // Layer 2: Occupied Edges (Center-Out Animation)
                edgesLayer(center: center, scale: metrics.scale, bounds: metrics.bounds)

                // Layer 3: Symbols (Pop Animation)
                symbolsLayer(center: center, scale: metrics.cell, scaleFactor: metrics.scale, bounds: metrics.bounds)

                // Layer 4: Gestures
                interactionLayer(proxy: proxy, center: center, scale: metrics.scale, bounds: metrics.bounds)
                    .allowsHitTesting(!engine.isProcessingMove) // BLOCK INPUT IF AI THINKING
                
                // Layer 5: Particles
                ParticleView(trigger: $particleTrigger, color: $particleColor)
                    .allowsHitTesting(false)
            }
            .animation(.spring(response: 0.4, dampingFraction: 0.6), value: engine.state.zones)
        }
    }
    
    // MARK: - Subviews
    
    private func gridLayer(center: CGPoint, scale: CGFloat, bounds: (minX: CGFloat, maxX: CGFloat, minY: CGFloat, maxY: CGFloat)) -> some View {
        Canvas { context, _ in
            for edge in engine.board.edges {
                let a = engine.board.nodes[edge.a].position
                let b = engine.board.nodes[edge.b].position
                let path = Path { p in
                    p.move(to: project(a, center: center, scale: scale, bounds: bounds))
                    p.addLine(to: project(b, center: center, scale: scale, bounds: bounds))
                }
                
                context.stroke(path, with: .color(inactiveLine), lineWidth: 2.5)
                
                if hoveredEdgeId == edge.id && !engine.state.occupiedEdges.contains(edge.id) {
                     context.stroke(path, with: .color(activeLine.opacity(0.5)), lineWidth: 3.5)
                }
            }

            for node in engine.board.nodes {
                let pt = project(node.position, center: center, scale: scale, bounds: bounds)
                let rect = CGRect(x: pt.x - 2.5, y: pt.y - 2.5, width: 5, height: 5)
                context.fill(Path(ellipseIn: rect), with: .color(nodeColor))
            }
        }
        .drawingGroup()
    }
    
    private func edgesLayer(center: CGPoint, scale: CGFloat, bounds: (minX: CGFloat, maxX: CGFloat, minY: CGFloat, maxY: CGFloat)) -> some View {
        ForEach(Array(engine.state.occupiedEdges), id: \.self) { edgeId in
            if let edge = engine.board.edges.first(where: { $0.id == edgeId }) {
                let p1 = project(engine.board.nodes[edge.a].position, center: center, scale: scale, bounds: bounds)
                let p2 = project(engine.board.nodes[edge.b].position, center: center, scale: scale, bounds: bounds)
                
                AnimatedEdge(p1: p1, p2: p2, color: AppTheme.activeLine, isAnimated: animationsEnabled)
            }
        }
    }
    
    private func symbolsLayer(center: CGPoint, scale: CGFloat, scaleFactor: CGFloat, bounds: (minX: CGFloat, maxX: CGFloat, minY: CGFloat, maxY: CGFloat)) -> some View {
        ForEach(engine.state.zones.filter { $0.owner != .none }) { zone in
            if case let .player(player) = zone.owner {
                let color: Color = player == .x ? AppTheme.playerX : AppTheme.playerO
                let symbolKey = player == .x ? "score.x" : "score.o"
                let symbol = NSLocalizedString(symbolKey, comment: "")
                let points = zone.nodeIds.map { engine.board.nodes[$0].position }
                
                let cx = points.map(\.x).reduce(0, +) / CGFloat(points.count)
                let cy = points.map(\.y).reduce(0, +) / CGFloat(points.count)
                let screen = project(CGPoint(x: cx, y: cy), center: center, scaleFactor, bounds: bounds)
                
                Text(symbol)
                    .font(.system(size: max(18, scale * 0.85), weight: .bold, design: .rounded))
                    .foregroundStyle(color)
                    .position(screen)
                    .transition(.scale(scale: 0.1).animation(.spring(response: 0.3, dampingFraction: 0.5)))
                    .id(zone.id)
            }
        }
    }
    
    private func interactionLayer(proxy: GeometryProxy, center: CGPoint, scale: CGFloat, bounds: (minX: CGFloat, maxX: CGFloat, minY: CGFloat, maxY: CGFloat)) -> some View {
        Color.clear
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { value in
                        if let edgeId = nearestEdge(to: value.location, in: proxy.size) {
                            if !engine.state.occupiedEdges.contains(edgeId) {
                                hoveredEdgeId = edgeId
                            } else {
                                hoveredEdgeId = nil
                            }
                        } else {
                            hoveredEdgeId = nil
                        }
                    }
                    .onEnded { value in
                        if let edgeId = nearestEdge(to: value.location, in: proxy.size) {
                            playMove(edgeId: edgeId, center: center, scale: scale, bounds: bounds)
                        }
                        hoveredEdgeId = nil
                    }
            )
    }
    
    // MARK: - Helpers
    
    private func playMove(edgeId: Int, center: CGPoint, scale: CGFloat, bounds: (minX: CGFloat, maxX: CGFloat, minY: CGFloat, maxY: CGFloat)) {
        let owners = engine.state.zones.map { $0.owner }
        let didPlay = engine.play(edgeId: edgeId)
        if didPlay {
            let capturedIds = capturedZoneIds(before: owners)
            
            if capturedIds.isEmpty {
                SoundManager.shared.play(.pop)
            } else {
                SoundManager.shared.play(.capture)
            }
            
            if hapticsEnabled {
                haptic.impactOccurred()
            }
            
            if !capturedIds.isEmpty && animationsEnabled {
                triggerParticles(capturedIds: capturedIds, center: center, scale: scale, bounds: bounds)
            }
        }
    }
    
    private func triggerParticles(capturedIds: Set<Int>, center: CGPoint, scale: CGFloat, bounds: (minX: CGFloat, maxX: CGFloat, minY: CGFloat, maxY: CGFloat)) {
        if let firstId = capturedIds.first, let zone = engine.state.zones.first(where: { $0.id == firstId }) {
            let points = zone.nodeIds.map { engine.board.nodes[$0].position }
            let cx = points.map(\.x).reduce(0, +) / CGFloat(points.count)
            let cy = points.map(\.y).reduce(0, +) / CGFloat(points.count)
            let screen = project(CGPoint(x: cx, y: cy), center: center, scale: scale, bounds: bounds)
            
            if case let .player(p) = zone.owner {
                 particleColor = (p == .x) ? AppTheme.playerX : AppTheme.playerO
            }
            particleTrigger = screen
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                particleTrigger = nil
            }
        }
    }

    private func project(_ point: CGPoint, center: CGPoint, _ scale: CGFloat, bounds: (minX: CGFloat, maxX: CGFloat, minY: CGFloat, maxY: CGFloat)) -> CGPoint {
        let midX = (bounds.minX + bounds.maxX) / 2.0
        let midY = (bounds.minY + bounds.maxY) / 2.0
        return CGPoint(
            x: center.x + (point.x - midX) * scale,
            y: center.y - (point.y - midY) * scale
        )
    }
    
    private func project(_ point: CGPoint, center: CGPoint, scale: CGFloat, bounds: (minX: CGFloat, maxX: CGFloat, minY: CGFloat, maxY: CGFloat)) -> CGPoint {
        return project(point, center: center, scale, bounds: bounds)
    }

    private func nearestEdge(to location: CGPoint, in size: CGSize) -> Int? {
        let center = CGPoint(x: size.width / 2, y: size.height / 2)
        let bounds = boardBounds()
        let spanX = bounds.maxX - bounds.minX
        let spanY = bounds.maxY - bounds.minY
        let scale = (min(size.width, size.height) / max(spanX, spanY)) * 0.95

        var best: (id: Int, dist: CGFloat)?
        for edge in engine.board.edges {
            let a = engine.board.nodes[edge.a].position
            let b = engine.board.nodes[edge.b].position
            let midpoint = CGPoint(x: (a.x + b.x) / 2, y: (a.y + b.y) / 2)
            let screen = project(midpoint, center: center, scale: scale, bounds: bounds)
            let d = hypot(screen.x - location.x, screen.y - location.y)
            if d < (best?.dist ?? .greatestFiniteMagnitude) {
                best = (edge.id, d)
            }
        }
        return best?.dist ?? .greatestFiniteMagnitude < 40 ? best?.id : nil
    }

    private func boardBounds() -> (minX: CGFloat, maxX: CGFloat, minY: CGFloat, maxY: CGFloat) {
        let xs = engine.board.nodes.map { $0.position.x }
        let ys = engine.board.nodes.map { $0.position.y }
        return (
            minX: xs.min() ?? 0,
            maxX: xs.max() ?? 0,
            minY: ys.min() ?? 0,
            maxY: ys.max() ?? 0
        )
    }

    private func capturedZoneIds(before: [ZoneOwner]) -> Set<Int> {
        var captured: Set<Int> = []
        for (index, zone) in engine.state.zones.enumerated() {
            if before[index] == .none && zone.owner != .none {
                captured.insert(zone.id)
            }
        }
        return captured
    }
}

// MARK: - Animated Components

struct AnimatedEdge: View {
    let p1: CGPoint
    let p2: CGPoint
    let color: Color
    let isAnimated: Bool
    
    @State private var progress: CGFloat = 0.0
    
    var body: some View {
        EdgeShape(p1: p1, p2: p2)
            .trim(from: 0.5 - (0.5 * progress), to: 0.5 + (0.5 * progress))
            .stroke(color, style: StrokeStyle(lineWidth: 4, lineCap: .round))
            .onAppear {
                if isAnimated {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        progress = 1.0
                    }
                } else {
                    progress = 1.0
                }
            }
    }
}

struct BoardMetrics {
    let bounds: (minX: CGFloat, maxX: CGFloat, minY: CGFloat, maxY: CGFloat)
    let scale: CGFloat
    let cell: CGFloat
    
    init(proxy: GeometryProxy, engine: GameEngine) {
        let size = min(proxy.size.width, proxy.size.height)
        let xs = engine.board.nodes.map { $0.position.x }
        let ys = engine.board.nodes.map { $0.position.y }
        self.bounds = (
            minX: xs.min() ?? 0,
            maxX: xs.max() ?? 0,
            minY: ys.min() ?? 0,
            maxY: ys.max() ?? 0
        )
        let spanX = bounds.maxX - bounds.minX
        let spanY = bounds.maxY - bounds.minY
        self.scale = (size / max(spanX, spanY)) * 0.95
        self.cell = scale * 2.0
    }
}

struct EdgeShape: Shape {
    let p1: CGPoint
    let p2: CGPoint
    
    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.move(to: p1)
        p.addLine(to: p2)
        return p
    }
}
