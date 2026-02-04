import Foundation
import Combine

final class GameEngine: ObservableObject {
    @Published private(set) var state: GameState
    let board: BoardLayout

    init(board: BoardLayout = .diamond25) {
        self.board = board
        self.state = GameState(zones: board.zones)
    }

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

    func reset() {
        state = GameState(zones: board.zones)
    }
}
