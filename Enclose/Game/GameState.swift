import Foundation

struct GameState {
    var currentPlayer: Player = .x
    var occupiedEdges: Set<Int> = []
    var zones: [Zone]

    var scoreX: Int { zones.filter { $0.owner == .player(.x) }.count }
    var scoreO: Int { zones.filter { $0.owner == .player(.o) }.count }

    var isGameOver: Bool { zones.allSatisfy { $0.owner != .none } }
}
