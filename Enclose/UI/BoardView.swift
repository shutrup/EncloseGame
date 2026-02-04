import SwiftUI
import UIKit

struct BoardView: View {
    @ObservedObject var engine: GameEngine

    @State private var hoveredEdgeId: Int?
    @State private var lastPlayedEdgeId: Int?

    private let inactiveLine = Color(red: 0.78, green: 0.80, blue: 0.83)
    private let activeLine = Color(red: 0.10, green: 0.11, blue: 0.13)
    private let hoverLine = Color.black.opacity(0.35)
    private let xColor = Color(red: 0.12, green: 0.40, blue: 0.80)
    private let oColor = Color(red: 0.78, green: 0.18, blue: 0.18)
    private let nodeColor = Color(red: 0.55, green: 0.58, blue: 0.62)
    private let haptic = UIImpactFeedbackGenerator(style: .rigid)

    var body: some View {
        GeometryReader { proxy in
            let size = min(proxy.size.width, proxy.size.height)
            let center = CGPoint(x: proxy.size.width / 2, y: proxy.size.height / 2)
            let bounds = boardBounds()
            let spanX = bounds.maxX - bounds.minX
            let spanY = bounds.maxY - bounds.minY
            let scale = (size / max(spanX, spanY)) * 0.95
            let cell = scale * 2.0
            let symbolSize = max(18, cell * 0.9)

            Canvas { context, _ in
                for edge in engine.board.edges {
                    let a = engine.board.nodes[edge.a].position
                    let b = engine.board.nodes[edge.b].position

                    let path = Path { p in
                        p.move(to: project(a, center: center, scale: scale, bounds: bounds))
                        p.addLine(to: project(b, center: center, scale: scale, bounds: bounds))
                    }

                    let isActive = engine.state.occupiedEdges.contains(edge.id)
                    let isHovered = hoveredEdgeId == edge.id && !isActive
                    let isJustPlayed = lastPlayedEdgeId == edge.id

                    if isActive {
                        let width: CGFloat = isJustPlayed ? 5.0 : 4.0
                        context.stroke(path, with: .color(activeLine), lineWidth: width)
                    } else if isHovered {
                        context.stroke(path, with: .color(hoverLine), lineWidth: 4.0)
                    } else {
                        context.stroke(path, with: .color(inactiveLine), lineWidth: 3)
                    }
                }

                for node in engine.board.nodes {
                    let pt = project(node.position, center: center, scale: scale, bounds: bounds)
                    let rect = CGRect(x: pt.x - 3, y: pt.y - 3, width: 6, height: 6)
                    context.fill(Path(ellipseIn: rect), with: .color(nodeColor))
                }

                for zone in engine.state.zones {
                    guard case let .player(player) = zone.owner else { continue }
                    let color: Color = player == .x ? xColor : oColor
                    let symbol = player == .x ? "X" : "O"
                    let points = zone.nodeIds.map { engine.board.nodes[$0].position }
                    let centerPoint = CGPoint(
                        x: points.map(\.x).reduce(0, +) / CGFloat(points.count),
                        y: points.map(\.y).reduce(0, +) / CGFloat(points.count)
                    )
                    let screen = project(centerPoint, center: center, scale: scale, bounds: bounds)
                    let text = Text(symbol)
                        .font(.system(size: symbolSize, weight: .bold, design: .rounded))
                        .foregroundStyle(color)
                    context.draw(text, at: screen)
                }
            }
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { value in
                        if let edgeId = nearestEdge(to: value.location, in: proxy.size) {
                            if engine.state.occupiedEdges.contains(edgeId) {
                                hoveredEdgeId = nil
                            } else {
                                hoveredEdgeId = edgeId
                            }
                        } else {
                            hoveredEdgeId = nil
                        }
                    }
                    .onEnded { value in
                        if let edgeId = nearestEdge(to: value.location, in: proxy.size) {
                            let didPlay = engine.play(edgeId: edgeId)
                            if didPlay {
                                haptic.impactOccurred()
                                withAnimation(.easeOut(duration: 0.15)) {
                                    lastPlayedEdgeId = edgeId
                                }
                                DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                                    if lastPlayedEdgeId == edgeId {
                                        lastPlayedEdgeId = nil
                                    }
                                }
                            }
                        }
                        hoveredEdgeId = nil
                    }
            )
        }
    }

    private func project(_ point: CGPoint, center: CGPoint, scale: CGFloat, bounds: (minX: CGFloat, maxX: CGFloat, minY: CGFloat, maxY: CGFloat)) -> CGPoint {
        let midX = (bounds.minX + bounds.maxX) / 2.0
        let midY = (bounds.minY + bounds.maxY) / 2.0
        return CGPoint(
            x: center.x + (point.x - midX) * scale,
            y: center.y - (point.y - midY) * scale
        )
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
}
