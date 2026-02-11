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
    private var aiSessionSeed: UInt64 = 0
    private var aiDecisionIndex = 0
    private var recentAIMoves: [Int] = []
    private let recentAIMoveLimit = 8
    
    init(preset: BoardPreset = .standard, aiLevel: AILevel? = nil) {
        self.preset = preset
        self.aiLevel = aiLevel
        let board = BoardLayout.from(rows: preset.rows)
        self.board = board
        self.state = GameState(zones: board.zones)
        resetAIContext()
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
        invalidateAIMovePipeline()
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
        let decisionContext = AIDecisionContext(
            sessionSeed: aiSessionSeed,
            decisionIndex: aiDecisionIndex,
            recentAIMoves: recentAIMoves
        )
        let thinkDelay = aiThinkDelay(for: level, context: decisionContext)
        
        DispatchQueue.global(qos: .userInitiated).asyncAfter(deadline: .now() + thinkDelay) { [weak self] in
            let move = AI.bestMove(
                board: boardSnapshot,
                state: stateSnapshot,
                level: level,
                context: decisionContext
            )
            
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
                    guard self.play(edgeId: move) else {
                        self.isProcessingMove = false
                        return
                    }
                    self.recordAIMove(move)
                    
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
        resetAIContext()
    }

    private func resetAIContext() {
        aiSessionSeed = UInt64.random(in: UInt64.min...UInt64.max)
        aiDecisionIndex = 0
        recentAIMoves.removeAll(keepingCapacity: true)
    }

    private func recordAIMove(_ move: Int) {
        aiDecisionIndex += 1
        recentAIMoves.append(move)
        if recentAIMoves.count > recentAIMoveLimit {
            recentAIMoves.removeFirst(recentAIMoves.count - recentAIMoveLimit)
        }
    }

    private func aiThinkDelay(for level: AILevel, context: AIDecisionContext) -> TimeInterval {
        let baseRange: ClosedRange<Double>
        switch level {
        case .easy:
            baseRange = 0.10...0.19
        case .medium:
            baseRange = 0.16...0.30
        case .hard:
            baseRange = 0.22...0.40
        }

        let jitter = deterministicUnitValue(seed: context.sessionSeed, index: context.decisionIndex)
        return baseRange.lowerBound + ((baseRange.upperBound - baseRange.lowerBound) * jitter)
    }

    private func deterministicUnitValue(seed: UInt64, index: Int) -> Double {
        let indexSeed = UInt64(max(index, 0))
        let mixed = splitMix64(seed ^ (indexSeed &* 0x9E3779B97F4A7C15) ^ 0xA24BAED4963EE407)
        let upper53 = mixed >> 11
        return Double(upper53) / Double(1 << 53)
    }

    private func splitMix64(_ value: UInt64) -> UInt64 {
        var x = value &+ 0x9E3779B97F4A7C15
        x = (x ^ (x >> 30)) &* 0xBF58476D1CE4E5B9
        x = (x ^ (x >> 27)) &* 0x94D049BB133111EB
        return x ^ (x >> 31)
    }
}
