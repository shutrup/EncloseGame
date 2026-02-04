import SwiftUI

struct BoardView: View {
    @ObservedObject var engine: GameEngine

    private let inactiveLine = Color(red: 0.16, green: 0.18, blue: 0.22)
    private let activeLine = Color(red: 0.90, green: 0.92, blue: 0.94)
    private let glowColor = Color.white.opacity(0.25)
    private let xFill = Color(red: 0.29, green: 0.64, blue: 1.0)
    private let oFill = Color(red: 1.0, green: 0.42, blue: 0.36)
    private let nodeColor = Color(red: 0.22, green: 0.25, blue: 0.30)

    var body: some View {
        GeometryReader { proxy in
            let size = min(proxy.size.width, proxy.size.height)
            let center = CGPoint(x: proxy.size.width / 2, y: proxy.size.height / 2)

            Canvas { context, _ in
                for zone in engine.state.zones {
                    guard case let .player(player) = zone.owner else { continue }
                    let color: Color = player == .x ? xFill : oFill

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

                for edge in engine.board.edges {
                    let a = engine.board.nodes[edge.a].position
                    let b = engine.board.nodes[edge.b].position

                    let path = Path { p in
                        p.move(to: project(a, center: center, size: size))
                        p.addLine(to: project(b, center: center, size: size))
                    }

                    let isActive = engine.state.occupiedEdges.contains(edge.id)
                    if isActive {
                        var glow = context
                        glow.addFilter(.shadow(color: glowColor, radius: 6, x: 0, y: 0))
                        glow.stroke(path, with: .color(activeLine), lineWidth: 3.5)
                        context.stroke(path, with: .color(activeLine), lineWidth: 3.5)
                    } else {
                        context.stroke(path, with: .color(inactiveLine), lineWidth: 2)
                    }
                }

                for node in engine.board.nodes {
                    let pt = project(node.position, center: center, size: size)
                    let rect = CGRect(x: pt.x - 2, y: pt.y - 2, width: 4, height: 4)
                    context.fill(Path(ellipseIn: rect), with: .color(nodeColor))
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
        let scale: CGFloat = size / 10.5
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
        return best?.dist ?? .greatestFiniteMagnitude < 28 ? best?.id : nil
    }
}
