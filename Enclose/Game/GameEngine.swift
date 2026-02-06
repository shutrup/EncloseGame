import Combine
import Foundation

final class GameEngine: ObservableObject {
    @Published private(set) var state: GameState
    @Published private(set) var board: BoardLayout
    private(set) var preset: BoardPreset
    @Published var aiLevel: AILevel?  // nil = PvP
    @Published var isProcessingMove = false  // UI Activity Indicator & Lock
    @Published private(set) var lastMove: LastMove?
    private var aiMoveGeneration: UInt64 = 0
    private var isAIMoveScheduled = false
    
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
        let mover = state.currentPlayer
        
        state.occupiedEdges.insert(edgeId)
        lastMove = LastMove(edgeId: edgeId, player: mover)
        
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
        invalidateAIMovePipeline()

        if let preset {
            self.preset = preset
        }
        if let aiLevel {
            self.aiLevel = aiLevel
        }
        
        board = BoardLayout.from(rows: self.preset.rows)
        state = GameState(zones: board.zones)
        lastMove = nil
    }
    
    func setAI(_ level: AILevel?) {
        self.aiLevel = level
        if level == nil {
            invalidateAIMovePipeline()
        }
    }
    
    func makeAIMove() {
        guard let level = aiLevel else { return }
        guard state.currentPlayer == .o && !state.isGameOver else {
            isProcessingMove = false
            return
        }
        guard !isAIMoveScheduled else { return }
        
        isProcessingMove = true
        isAIMoveScheduled = true
        let generation = aiMoveGeneration
        let boardSnapshot = board
        let stateSnapshot = state
        
        // Delay for natural pacing
        DispatchQueue.global(qos: .userInitiated).asyncAfter(deadline: .now() + 0.6) { [weak self] in
            let move = AI.bestMove(board: boardSnapshot, state: stateSnapshot, level: level)
            
            DispatchQueue.main.async {
                guard let self = self else { return }
                guard self.aiMoveGeneration == generation else { return }
                self.isAIMoveScheduled = false
                
                guard self.aiLevel == level,
                      self.state.currentPlayer == .o,
                      !self.state.isGameOver else {
                    self.isProcessingMove = false
                    return
                }
                
                if let move = move {
                    self.play(edgeId: move)
                    
                    if self.state.currentPlayer == .o && !self.state.isGameOver {
                        self.makeAIMove()
                    } else {
                        self.isProcessingMove = false
                    }
                } else {
                    self.isProcessingMove = false
                }
            }
        }
    }

    private func invalidateAIMovePipeline() {
        aiMoveGeneration &+= 1
        isAIMoveScheduled = false
        isProcessingMove = false
    }
}
