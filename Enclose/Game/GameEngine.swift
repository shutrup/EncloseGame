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
