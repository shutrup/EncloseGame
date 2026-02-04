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
