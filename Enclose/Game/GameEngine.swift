import Combine
import Foundation

final class GameEngine: ObservableObject {
  @Published private(set) var state: GameState
  @Published private(set) var board: BoardLayout
  private(set) var preset: BoardPreset
  @Published var aiLevel: AILevel?  // nil = PvP
  @Published var isProcessingMove = false  // UI Activity Indicator & Lock

  init(preset: BoardPreset = .standard, aiLevel: AILevel? = nil) {
    self.preset = preset
    self.aiLevel = aiLevel
    let board = BoardLayout.from(rows: preset.rows)
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

  func reset(preset: BoardPreset? = nil, aiLevel: AILevel? = nil) {
    if let preset {
      self.preset = preset
    }
    // If an explicit AI level is passed (or explicit nil in a wrapper if needed), use it.
    // For now, if passed, set it. If nil, keep current (unless we want to clear??)
    // Let's assume user wants to keep settings unless changed.
    if let aiLevel {
      self.aiLevel = aiLevel
    }

    board = BoardLayout.from(rows: self.preset.rows)
    state = GameState(zones: board.zones)
    isProcessingMove = false
  }

  // Explicitly set AI
  func setAI(_ level: AILevel?) {
    self.aiLevel = level
  }

  func makeAIMove() {
    guard let level = aiLevel else { return }
    guard state.currentPlayer == .o && !state.isGameOver else { return }

    isProcessingMove = true

    // Delay for natural pacing
    DispatchQueue.global(qos: .userInitiated).asyncAfter(deadline: .now() + 0.6) { [weak self] in
      guard let self = self else { return }

      // Calculate move
      let move = AI.bestMove(board: self.board, state: self.state, level: level)

      DispatchQueue.main.async {
        if let move = move {
          self.play(edgeId: move)

          // Check if AI gets another turn (Chain Capture)
          if self.state.currentPlayer == .o && !self.state.isGameOver {
            self.makeAIMove()  // Recurse
          } else {
            self.isProcessingMove = false  // Turn over
          }
        } else {
          self.isProcessingMove = false  // No moves possible
        }
      }
    }
  }
}
