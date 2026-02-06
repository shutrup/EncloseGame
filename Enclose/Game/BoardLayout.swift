import CoreGraphics
import Foundation

enum BoardPreset: String, CaseIterable, Identifiable {
    case mini
    case standard
    case large
    
    var id: String { rawValue }
    
    var rows: [Int] {
        switch self {
        case .mini:
            return [1, 3, 5, 3, 1]
        case .standard:
            return [1, 3, 5, 7, 5, 3, 1]
        case .large:
            return [1, 3, 5, 7, 9, 7, 5, 3, 1]
        }
    }
    
    var localizedName: String {
        switch self {
        case .mini: return NSLocalizedString("menu.board.mini", comment: "Mini")
        case .standard: return NSLocalizedString("menu.board.standard", comment: "Standard")
        case .large: return NSLocalizedString("menu.board.large", comment: "Large")
        }
    }
}

struct BoardLayout {
    let nodes: [Node]
    let edges: [Edge]
    let zones: [Zone]
    
    static func from(rows: [Int]) -> BoardLayout {
        let cellSize: CGFloat = 2.0
        let half: CGFloat = cellSize / 2.0
        
        // Odd counts keep perfect grid alignment.
        let yStart = (rows.count - 1) / 2
        let step: CGFloat = 2.0
        let rowDefs: [(y: CGFloat, xs: [CGFloat])] = rows.enumerated().map { index, count in
            let y = CGFloat(yStart - index) * step
            let start = -CGFloat(count - 1) / 2.0
            let xs = (0..<count).map { (start + CGFloat($0)) * step }
            return (y, xs)
        }
        
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
    }
    
    static let diamond25 = BoardLayout.from(rows: BoardPreset.standard.rows)
}
