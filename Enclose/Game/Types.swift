import Foundation
import CoreGraphics

enum Player: String, Equatable {
    case x
    case o

    var next: Player { self == .x ? .o : .x }
}

enum ZoneOwner: Equatable {
    case none
    case player(Player)
}

struct Node: Hashable, Identifiable {
    let id: Int
    let position: CGPoint
}

struct Edge: Hashable, Identifiable {
    let id: Int
    let a: Int
    let b: Int
}

struct Zone: Identifiable, Equatable {
    let id: Int
    let nodeIds: [Int]
    let edgeIds: [Int]
    var owner: ZoneOwner
}
