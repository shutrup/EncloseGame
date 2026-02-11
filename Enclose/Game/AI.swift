import Foundation

enum AILevel: String, CaseIterable, Identifiable {
    case easy
    case medium
    case hard

    var id: String { rawValue }

    var localizedName: String {
        switch self {
        case .easy: return NSLocalizedString("difficulty.easy", comment: "Easy")
        case .medium: return NSLocalizedString("difficulty.medium", comment: "Medium")
        case .hard: return NSLocalizedString("difficulty.hard", comment: "Hard")
        }
    }
}

struct AIDecisionContext {
    let sessionSeed: UInt64
    let decisionIndex: Int
    let recentAIMoves: [Int]
}

private enum GamePhase {
    case opening
    case midgame
    case endgame
}

private struct SeededRNG {
    private var state: UInt64

    init(seed: UInt64) {
        self.state = seed == 0 ? 0x9E3779B97F4A7C15 : seed
    }

    mutating func nextUInt64() -> UInt64 {
        state &+= 0x9E3779B97F4A7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58476D1CE4E5B9
        z = (z ^ (z >> 27)) &* 0x94D049BB133111EB
        return z ^ (z >> 31)
    }

    mutating func nextDouble() -> Double {
        let upper53 = nextUInt64() >> 11
        return Double(upper53) / Double(1 << 53)
    }

    mutating func randomBool(probability: Double) -> Bool {
        let clamped = min(max(probability, 0), 1)
        return nextDouble() < clamped
    }

    mutating func uniform(in range: ClosedRange<Double>) -> Double {
        range.lowerBound + ((range.upperBound - range.lowerBound) * nextDouble())
    }
}

private struct PhaseDoubleValues {
    let opening: Double
    let midgame: Double
    let endgame: Double

    func value(for phase: GamePhase) -> Double {
        switch phase {
        case .opening: return opening
        case .midgame: return midgame
        case .endgame: return endgame
        }
    }
}

private struct PhaseIntValues {
    let opening: Int
    let midgame: Int
    let endgame: Int

    func value(for phase: GamePhase) -> Int {
        switch phase {
        case .opening: return opening
        case .midgame: return midgame
        case .endgame: return endgame
        }
    }
}

private struct TacticalWeights {
    let captureReward: Double
    let thirdPenalty: Double
    let secondBonus: Double
    let safetyBonus: Double
    let centerBonus: Double
    let immediateCapturePenalty: Double
    let openThirdPenalty: Double
    let safeReplyBonus: Double
}

private struct DifficultyPolicy {
    let weights: TacticalWeights
    let candidateDelta: PhaseDoubleValues
    let candidateLimit: PhaseIntValues
    let temperature: PhaseDoubleValues
    let mistakeChance: PhaseDoubleValues
    let missCaptureChance: PhaseDoubleValues
    let noiseAmplitude: PhaseDoubleValues
    let noveltyPenalty: Double
}

private enum AIPolicies {
    static let easy = DifficultyPolicy(
        weights: TacticalWeights(
            captureReward: 118,
            thirdPenalty: 74,
            secondBonus: 4,
            safetyBonus: 22,
            centerBonus: 5,
            immediateCapturePenalty: 0,
            openThirdPenalty: 0,
            safeReplyBonus: 0
        ),
        candidateDelta: PhaseDoubleValues(opening: 22, midgame: 16, endgame: 10),
        candidateLimit: PhaseIntValues(opening: 5, midgame: 4, endgame: 3),
        temperature: PhaseDoubleValues(opening: 0.92, midgame: 0.82, endgame: 0.72),
        mistakeChance: PhaseDoubleValues(opening: 0.30, midgame: 0.22, endgame: 0.13),
        missCaptureChance: PhaseDoubleValues(opening: 0.14, midgame: 0.19, endgame: 0.24),
        noiseAmplitude: PhaseDoubleValues(opening: 8.2, midgame: 6.1, endgame: 4.0),
        noveltyPenalty: 4.8
    )

    static let medium = DifficultyPolicy(
        weights: TacticalWeights(
            captureReward: 174,
            thirdPenalty: 136,
            secondBonus: 9,
            safetyBonus: 24,
            centerBonus: 6,
            immediateCapturePenalty: 100,
            openThirdPenalty: 20,
            safeReplyBonus: 4.8
        ),
        candidateDelta: PhaseDoubleValues(opening: 13, midgame: 8, endgame: 4),
        candidateLimit: PhaseIntValues(opening: 5, midgame: 4, endgame: 3),
        temperature: PhaseDoubleValues(opening: 0.58, midgame: 0.42, endgame: 0.24),
        mistakeChance: PhaseDoubleValues(opening: 0.09, midgame: 0.06, endgame: 0.02),
        missCaptureChance: PhaseDoubleValues(opening: 0.05, midgame: 0.08, endgame: 0.10),
        noiseAmplitude: PhaseDoubleValues(opening: 2.4, midgame: 1.4, endgame: 0.6),
        noveltyPenalty: 2.4
    )

    static let hard = DifficultyPolicy(
        weights: TacticalWeights(
            captureReward: 220,
            thirdPenalty: 72,
            secondBonus: 5,
            safetyBonus: 52,
            centerBonus: 3,
            immediateCapturePenalty: 0,
            openThirdPenalty: 0,
            safeReplyBonus: 0
        ),
        candidateDelta: PhaseDoubleValues(opening: 2, midgame: 1, endgame: 0),
        candidateLimit: PhaseIntValues(opening: 3, midgame: 2, endgame: 1),
        temperature: PhaseDoubleValues(opening: 0.20, midgame: 0.16, endgame: 0.08),
        mistakeChance: PhaseDoubleValues(opening: 0.08, midgame: 0.04, endgame: 0),
        missCaptureChance: PhaseDoubleValues(opening: 0, midgame: 0, endgame: 0),
        noiseAmplitude: PhaseDoubleValues(opening: 0.8, midgame: 0.4, endgame: 0),
        noveltyPenalty: 0
    )
}

private struct BoardAnalysis {
    let edgeToZoneIndices: [[Int]]
    let edgeAdjacentEdges: [[Int]]

    init(board: BoardLayout) {
        var mapping = Array(repeating: [Int](), count: board.edges.count)
        for zoneIndex in board.zones.indices {
            for edgeId in board.zones[zoneIndex].edgeIds {
                if edgeId >= 0 && edgeId < mapping.count {
                    mapping[edgeId].append(zoneIndex)
                }
            }
        }
        self.edgeToZoneIndices = mapping

        var adjacent = Array(repeating: Set<Int>(), count: board.edges.count)
        var nodeToEdges = Array(repeating: [Int](), count: board.nodes.count)
        for edge in board.edges {
            nodeToEdges[edge.a].append(edge.id)
            nodeToEdges[edge.b].append(edge.id)
        }

        for edge in board.edges {
            let edgeId = edge.id
            for neighbor in nodeToEdges[edge.a] where neighbor != edgeId {
                adjacent[edgeId].insert(neighbor)
            }
            for neighbor in nodeToEdges[edge.b] where neighbor != edgeId {
                adjacent[edgeId].insert(neighbor)
            }
            for zoneIndex in mapping[edgeId] {
                for neighbor in board.zones[zoneIndex].edgeIds where neighbor != edgeId {
                    adjacent[edgeId].insert(neighbor)
                }
            }
        }

        self.edgeAdjacentEdges = adjacent.map { Array($0) }
    }

    func zones(for edgeId: Int) -> [Int] {
        guard edgeId >= 0 && edgeId < edgeToZoneIndices.count else { return [] }
        return edgeToZoneIndices[edgeId]
    }

    func adjacentEdges(for edgeId: Int) -> [Int] {
        guard edgeId >= 0 && edgeId < edgeAdjacentEdges.count else { return [] }
        return edgeAdjacentEdges[edgeId]
    }
}

final class AI {
    static func bestMove(board: BoardLayout, state: GameState, level: AILevel, context: AIDecisionContext) -> Int? {
        let available = availableEdges(board: board, state: state)
        guard !available.isEmpty else { return nil }

        let analysis = BoardAnalysis(board: board)
        let phase = gamePhase(remainingEdges: available.count, totalEdges: board.edges.count)
        let seed = decisionSeed(context: context, board: board, state: state, level: level)
        var rng = SeededRNG(seed: seed)

        switch level {
        case .easy:
            return easyMove(
                board: board,
                state: state,
                available: available,
                analysis: analysis,
                phase: phase,
                context: context,
                rng: &rng
            )
        case .medium:
            return HeuristicSolver.solve(
                board: board,
                state: state,
                available: available,
                analysis: analysis,
                phase: phase,
                context: context,
                rng: &rng
            )
        case .hard:
            return MinimaxSolver.solve(
                board: board,
                state: state,
                available: available,
                analysis: analysis,
                phase: phase,
                rng: &rng
            )
        }
    }

    private static func easyMove(
        board: BoardLayout,
        state: GameState,
        available: [Int],
        analysis: BoardAnalysis,
        phase: GamePhase,
        context: AIDecisionContext,
        rng: inout SeededRNG
    ) -> Int {
        let policy = AIPolicies.easy

        if let capture = findCapturingEdge(state: state),
           !rng.randomBool(probability: policy.missCaptureChance.value(for: phase)) {
            return capture
        }

        let safe = findSafeEdges(board: board, state: state, available: available, analysis: analysis)
        let safePool = safe.isEmpty ? available : safe

        let scored = safePool.map { edge in
            let metrics = moveMetrics(edge: edge, board: board, state: state, analysis: analysis)
            var score = 0.0
            score += Double(metrics.captures) * policy.weights.captureReward
            score -= Double(metrics.createsThird) * policy.weights.thirdPenalty
            score += Double(metrics.createsSecond) * policy.weights.secondBonus
            score += isSafe(edge: edge, board: board, state: state, analysis: analysis) ? policy.weights.safetyBonus : 0
            score += centerWeight(edge: edge, board: board) * policy.weights.centerBonus
            let noiseAmplitude = policy.noiseAmplitude.value(for: phase)
            if noiseAmplitude > 0 {
                score += rng.uniform(in: (-noiseAmplitude)...noiseAmplitude)
            }
            return (edge, score)
        }

        let noveltyShaped = applyNoveltyPenalty(
            to: scored,
            recentMoves: context.recentAIMoves,
            penalty: policy.noveltyPenalty,
            analysis: analysis
        )

        let candidates = nearBestCandidates(
            from: noveltyShaped,
            delta: policy.candidateDelta.value(for: phase),
            limit: policy.candidateLimit.value(for: phase)
        )

        if rng.randomBool(probability: policy.mistakeChance.value(for: phase)) {
            let suboptimalPool = Array(noveltyShaped.dropFirst().prefix(max(2, candidates.count)))
            if let suboptimal = weightedChoice(
                suboptimalPool,
                temperature: policy.temperature.value(for: phase) + 0.28,
                rng: &rng
            ) {
                return suboptimal
            }
        }

        return weightedChoice(candidates, temperature: policy.temperature.value(for: phase), rng: &rng)
            ?? noveltyShaped.first?.0
            ?? available.first!
    }

    fileprivate static func nearBestCandidates(
        from scored: [(Int, Double)],
        delta: Double,
        limit: Int
    ) -> [(Int, Double)] {
        guard let best = scored.first?.1, limit > 0 else { return [] }
        return Array(scored.filter { best - $0.1 <= delta }.prefix(limit))
    }

    fileprivate static func weightedChoice(
        _ scored: [(Int, Double)],
        temperature: Double,
        rng: inout SeededRNG
    ) -> Int? {
        guard !scored.isEmpty else { return nil }
        let safeTemperature = max(0.08, temperature)
        let maxScore = scored.map { $0.1 }.max() ?? 0

        let weighted: [(edge: Int, weight: Double)] = scored.map { edge, score in
            let normalized = (score - maxScore) / safeTemperature
            return (edge: edge, weight: exp(normalized))
        }

        let total = weighted.reduce(0.0) { $0 + $1.weight }
        guard total > 0 else { return scored.first?.0 }

        var pick = rng.nextDouble() * total
        for candidate in weighted {
            pick -= candidate.weight
            if pick <= 0 {
                return candidate.edge
            }
        }
        return weighted.last?.edge
    }

    fileprivate static func applyNoveltyPenalty(
        to scored: [(Int, Double)],
        recentMoves: [Int],
        penalty: Double,
        analysis: BoardAnalysis
    ) -> [(Int, Double)] {
        guard penalty > 0, !recentMoves.isEmpty else {
            return scored.sorted {
                if $0.1 == $1.1 { return $0.0 < $1.0 }
                return $0.1 > $1.1
            }
        }

        let recent = Array(recentMoves.suffix(10))
        var recencyWeights: [Int: Double] = [:]
        for (index, edge) in recent.enumerated() {
            let recency = Double(index + 1) / Double(recent.count)
            recencyWeights[edge, default: 0] += recency
        }

        return scored
            .map { edge, score in
                let directPenalty = recencyWeights[edge, default: 0] * penalty
                let adjacentPenalty = analysis
                    .adjacentEdges(for: edge)
                    .reduce(0.0) { total, adjacentEdge in
                        total + (recencyWeights[adjacentEdge, default: 0] * penalty * 0.55)
                    }
                let shapedScore = score - directPenalty - adjacentPenalty
                return (edge, shapedScore)
            }
            .sorted {
                if $0.1 == $1.1 { return $0.0 < $1.0 }
                return $0.1 > $1.1
            }
    }

    private static func decisionSeed(
        context: AIDecisionContext,
        board: BoardLayout,
        state: GameState,
        level: AILevel
    ) -> UInt64 {
        var seed = context.sessionSeed
        seed ^= splitmix64(UInt64(max(context.decisionIndex, 0)) &+ 0x9E3779B97F4A7C15)
        seed ^= splitmix64(UInt64(board.edges.count) &* 0xD1B54A32D192ED03)
        seed ^= splitmix64(UInt64(state.occupiedEdges.count) &* 0x94D049BB133111EB)

        switch level {
        case .easy:
            seed ^= 0xA24BAED4963EE407
        case .medium:
            seed ^= 0x9FB21C651E98DF25
        case .hard:
            seed ^= 0xC13FA9A902A6328F
        }

        for edge in context.recentAIMoves.suffix(10) {
            seed ^= splitmix64(UInt64(edge) &+ 0xBF58476D1CE4E5B9)
        }

        return splitmix64(seed)
    }

    private static func gamePhase(remainingEdges: Int, totalEdges: Int) -> GamePhase {
        guard totalEdges > 0 else { return .midgame }
        let progress = 1.0 - (Double(remainingEdges) / Double(totalEdges))
        if progress < 0.30 { return .opening }
        if progress < 0.74 { return .midgame }
        return .endgame
    }
}

private final class HeuristicSolver {
    static func solve(
        board: BoardLayout,
        state: GameState,
        available: [Int],
        analysis: BoardAnalysis,
        phase: GamePhase,
        context: AIDecisionContext,
        rng: inout SeededRNG
    ) -> Int {
        let policy = AIPolicies.medium
        let scored = available.map { edge in
            (edge, moveScore(edge: edge, board: board, state: state, analysis: analysis, phase: phase, policy: policy, rng: &rng))
        }

        let noveltyShaped = AI.applyNoveltyPenalty(
            to: scored,
            recentMoves: context.recentAIMoves,
            penalty: policy.noveltyPenalty,
            analysis: analysis
        )

        let candidates = AI.nearBestCandidates(
            from: noveltyShaped,
            delta: policy.candidateDelta.value(for: phase),
            limit: policy.candidateLimit.value(for: phase)
        )

        if rng.randomBool(probability: policy.mistakeChance.value(for: phase)) {
            let exploratoryPool = Array(noveltyShaped.dropFirst().prefix(max(2, candidates.count + 1)))
            if let exploratory = AI.weightedChoice(
                exploratoryPool,
                temperature: policy.temperature.value(for: phase) + 0.16,
                rng: &rng
            ) {
                return exploratory
            }
        }

        return AI.weightedChoice(candidates, temperature: policy.temperature.value(for: phase), rng: &rng)
            ?? noveltyShaped.first?.0
            ?? available.first!
    }

    private static func moveScore(
        edge: Int,
        board: BoardLayout,
        state: GameState,
        analysis: BoardAnalysis,
        phase: GamePhase,
        policy: DifficultyPolicy,
        rng: inout SeededRNG
    ) -> Double {
        let metrics = moveMetrics(edge: edge, board: board, state: state, analysis: analysis)
        let pressure = opponentPressure(after: edge, board: board, state: state, analysis: analysis)

        var score = 0.0
        score += Double(metrics.captures) * policy.weights.captureReward
        score += Double(metrics.createsSecond) * policy.weights.secondBonus
        score -= Double(metrics.createsThird) * policy.weights.thirdPenalty
        score -= Double(pressure.immediateCaptures) * policy.weights.immediateCapturePenalty
        score -= Double(pressure.openThirds) * policy.weights.openThirdPenalty
        score += Double(pressure.safeReplyCount) * policy.weights.safeReplyBonus
        score += isSafe(edge: edge, board: board, state: state, analysis: analysis) ? policy.weights.safetyBonus : 0
        score += centerWeight(edge: edge, board: board) * policy.weights.centerBonus

        let noiseAmplitude = policy.noiseAmplitude.value(for: phase)
        if noiseAmplitude > 0 {
            score += rng.uniform(in: (-noiseAmplitude)...noiseAmplitude)
        }

        return score
    }

    private static func opponentPressure(
        after edge: Int,
        board: BoardLayout,
        state: GameState,
        analysis: BoardAnalysis
    ) -> (immediateCaptures: Int, openThirds: Int, safeReplyCount: Int) {
        var nextState = state
        _ = simulateMove(edge, state: &nextState, board: board, analysis: analysis)

        let replies = availableEdges(board: board, state: nextState)
        var immediateCaptures = 0
        var openThirds = 0
        var safeReplyCount = 0

        for reply in replies {
            let replyMetrics = moveMetrics(edge: reply, board: board, state: nextState, analysis: analysis)
            if replyMetrics.captures > 0 {
                immediateCaptures += replyMetrics.captures
            }
            openThirds += replyMetrics.createsThird
            if isSafe(edge: reply, board: board, state: nextState, analysis: analysis) {
                safeReplyCount += 1
            }
        }

        return (immediateCaptures, openThirds, safeReplyCount)
    }
}

private final class MinimaxSolver {
    private enum TranspositionBound {
        case exact
        case lower
        case upper
    }

    private struct TranspositionEntry {
        let depth: Int
        let score: Int
        let bestMove: Int?
        let bound: TranspositionBound
    }

    private struct SearchProfile {
        let depthLimit: Int
        let timeBudget: CFAbsoluteTime
        let exactEndgameThreshold: Int
    }

    static func solve(
        board: BoardLayout,
        state: GameState,
        available: [Int],
        analysis: BoardAnalysis,
        phase: GamePhase,
        rng: inout SeededRNG
    ) -> Int {
        let profile = searchProfile(remaining: available.count, phase: phase)

        if available.count <= profile.exactEndgameThreshold {
            return exactEndgameMove(board: board, state: state, available: available, analysis: analysis)
        }

        let maxDepth = depthLimit(remaining: available.count, phase: phase)
        let deadline = CFAbsoluteTimeGetCurrent() + timeBudget(remaining: available.count, phase: phase)

        var table: [UInt64: TranspositionEntry] = [:]
        var bestMove = available.first!
        var bestScore = Int.min
        var rootMoves = orderedMoves(
            moves: available,
            preferredMove: nil,
            board: board,
            state: state,
            analysis: analysis
        )
        var lastStableScores: [Int: Int] = [:]

        for depth in 1...maxDepth {
            if CFAbsoluteTimeGetCurrent() >= deadline { break }

            var alpha = Int.min
            let beta = Int.max
            var iterationBestMove = bestMove
            var iterationBestScore = Int.min
            var iterationScores: [Int: Int] = [:]
            var timedOut = false

            if let bestIndex = rootMoves.firstIndex(of: bestMove), bestIndex != 0 {
                rootMoves.swapAt(0, bestIndex)
            }

            let rootKey = stateHash(state)
            let preferred = table[rootKey]?.bestMove
            rootMoves = orderedMoves(
                moves: rootMoves,
                preferredMove: preferred ?? bestMove,
                board: board,
                state: state,
                analysis: analysis
            )

            for move in rootMoves {
                if CFAbsoluteTimeGetCurrent() >= deadline {
                    timedOut = true
                    break
                }

                var nextState = state
                let keepsTurn = simulateMove(move, state: &nextState, board: board, analysis: analysis)
                let nextDepth = max(0, depth - (keepsTurn ? 0 : 1))

                let score = minimax(
                    state: nextState,
                    depth: nextDepth,
                    alpha: alpha,
                    beta: beta,
                    board: board,
                    analysis: analysis,
                    deadline: deadline,
                    table: &table,
                    timedOut: &timedOut
                )

                if timedOut { break }

                iterationScores[move] = score
                if score > iterationBestScore {
                    iterationBestScore = score
                    iterationBestMove = move
                }
                alpha = max(alpha, score)
            }

            if timedOut {
                break
            }

            bestMove = iterationBestMove
            bestScore = iterationBestScore
            lastStableScores = iterationScores
        }

        if !lastStableScores.isEmpty {
            return diversifiedRootChoice(
                fallbackBestMove: bestMove,
                fallbackBestScore: bestScore,
                rootScores: lastStableScores,
                phase: phase,
                rng: &rng
            )
        }

        return bestMove
    }

    private static func exactEndgameMove(
        board: BoardLayout,
        state: GameState,
        available: [Int],
        analysis: BoardAnalysis
    ) -> Int {
        var table: [UInt64: TranspositionEntry] = [:]
        let ordered = orderedMoves(
            moves: available,
            preferredMove: nil,
            board: board,
            state: state,
            analysis: analysis
        )

        var alpha = Int.min
        let beta = Int.max
        var bestMove = ordered.first ?? available.first!
        var bestScore = Int.min

        for move in ordered {
            var nextState = state
            _ = simulateMove(move, state: &nextState, board: board, analysis: analysis)

            let score = exactMinimax(
                state: nextState,
                alpha: alpha,
                beta: beta,
                board: board,
                analysis: analysis,
                table: &table
            )

            if score > bestScore || (score == bestScore && move < bestMove) {
                bestScore = score
                bestMove = move
            }
            alpha = max(alpha, bestScore)
        }

        return bestMove
    }

    private static func exactMinimax(
        state: GameState,
        alpha: Int,
        beta: Int,
        board: BoardLayout,
        analysis: BoardAnalysis,
        table: inout [UInt64: TranspositionEntry]
    ) -> Int {
        if state.occupiedEdges.count == board.edges.count {
            return terminalScore(state)
        }

        let remaining = board.edges.count - state.occupiedEdges.count
        let key = stateHash(state)
        let cached = table[key]

        var alpha = alpha
        var beta = beta
        if let cached, cached.depth >= remaining {
            switch cached.bound {
            case .exact:
                return cached.score
            case .lower:
                alpha = max(alpha, cached.score)
            case .upper:
                beta = min(beta, cached.score)
            }
            if alpha >= beta {
                return cached.score
            }
        }

        let available = availableEdges(board: board, state: state)
        if available.isEmpty {
            return terminalScore(state)
        }

        let moves = orderedMoves(
            moves: available,
            preferredMove: cached?.bestMove,
            board: board,
            state: state,
            analysis: analysis
        )

        let maximizing = (state.currentPlayer == .o)
        let originalAlpha = alpha
        let originalBeta = beta
        var best = maximizing ? Int.min : Int.max
        var bestMove: Int?

        for move in moves {
            var nextState = state
            _ = simulateMove(move, state: &nextState, board: board, analysis: analysis)
            let eval = exactMinimax(
                state: nextState,
                alpha: alpha,
                beta: beta,
                board: board,
                analysis: analysis,
                table: &table
            )

            if maximizing {
                if eval > best {
                    best = eval
                    bestMove = move
                }
                alpha = max(alpha, best)
            } else {
                if eval < best {
                    best = eval
                    bestMove = move
                }
                beta = min(beta, best)
            }

            if beta <= alpha {
                break
            }
        }

        let bound: TranspositionBound
        if best <= originalAlpha {
            bound = .upper
        } else if best >= originalBeta {
            bound = .lower
        } else {
            bound = .exact
        }

        table[key] = TranspositionEntry(depth: remaining, score: best, bestMove: bestMove, bound: bound)
        return best
    }

    private static func minimax(
        state: GameState,
        depth: Int,
        alpha: Int,
        beta: Int,
        board: BoardLayout,
        analysis: BoardAnalysis,
        deadline: CFAbsoluteTime,
        table: inout [UInt64: TranspositionEntry],
        timedOut: inout Bool
    ) -> Int {
        if timedOut {
            return evaluate(state: state, board: board, analysis: analysis)
        }

        if CFAbsoluteTimeGetCurrent() >= deadline {
            timedOut = true
            return evaluate(state: state, board: board, analysis: analysis)
        }

        if depth == 0 || state.occupiedEdges.count == board.edges.count {
            return evaluate(state: state, board: board, analysis: analysis)
        }

        let key = stateHash(state)
        let cached = table[key]

        var alpha = alpha
        var beta = beta

        if let cached, cached.depth >= depth {
            switch cached.bound {
            case .exact:
                return cached.score
            case .lower:
                alpha = max(alpha, cached.score)
            case .upper:
                beta = min(beta, cached.score)
            }

            if alpha >= beta {
                return cached.score
            }
        }

        let available = availableEdges(board: board, state: state)
        if available.isEmpty {
            return evaluate(state: state, board: board, analysis: analysis)
        }

        let moves = orderedMoves(
            moves: available,
            preferredMove: cached?.bestMove,
            board: board,
            state: state,
            analysis: analysis
        )

        let maximizing = (state.currentPlayer == .o)
        let originalAlpha = alpha
        let originalBeta = beta
        var best = maximizing ? Int.min : Int.max
        var bestMove: Int?

        for move in moves {
            if CFAbsoluteTimeGetCurrent() >= deadline {
                timedOut = true
                break
            }

            var nextState = state
            let keepsTurn = simulateMove(move, state: &nextState, board: board, analysis: analysis)
            let nextDepth = max(0, depth - (keepsTurn ? 0 : 1))

            let eval = minimax(
                state: nextState,
                depth: nextDepth,
                alpha: alpha,
                beta: beta,
                board: board,
                analysis: analysis,
                deadline: deadline,
                table: &table,
                timedOut: &timedOut
            )

            if timedOut { break }

            if maximizing {
                if eval > best {
                    best = eval
                    bestMove = move
                }
                alpha = max(alpha, best)
            } else {
                if eval < best {
                    best = eval
                    bestMove = move
                }
                beta = min(beta, best)
            }

            if beta <= alpha {
                break
            }
        }

        if !timedOut {
            let bound: TranspositionBound
            if best <= originalAlpha {
                bound = .upper
            } else if best >= originalBeta {
                bound = .lower
            } else {
                bound = .exact
            }

            table[key] = TranspositionEntry(depth: depth, score: best, bestMove: bestMove, bound: bound)
            return best
        }

        return evaluate(state: state, board: board, analysis: analysis)
    }

    private static func evaluate(state: GameState, board: BoardLayout, analysis: BoardAnalysis) -> Int {
        let scoreDiff = (state.scoreO - state.scoreX) * 120

        var immediateCapturesForCurrent = 0
        var riskyTwos = 0
        var lowRiskZones = 0

        for zone in state.zones where zone.owner == .none {
            let occupied = zoneOccupiedEdgeCount(zone: zone, state: state)
            if occupied == 3 {
                immediateCapturesForCurrent += 1
            } else if occupied == 2 {
                riskyTwos += 1
            } else if occupied <= 1 {
                lowRiskZones += 1
            }
        }

        let safeMoves = availableEdges(board: board, state: state).reduce(into: 0) { total, edge in
            if isSafe(edge: edge, board: board, state: state, analysis: analysis) {
                total += 1
            }
        }

        let turnSign = (state.currentPlayer == .o) ? 1 : -1
        return scoreDiff
            + (immediateCapturesForCurrent * 27 * turnSign)
            - (riskyTwos * 10)
            + (lowRiskZones * 2)
            + (safeMoves * 4 * turnSign)
    }

    private static func terminalScore(_ state: GameState) -> Int {
        (state.scoreO - state.scoreX) * 10_000
    }

    private static func orderedMoves(
        moves: [Int],
        preferredMove: Int?,
        board: BoardLayout,
        state: GameState,
        analysis: BoardAnalysis
    ) -> [Int] {
        moves
            .map { move -> (move: Int, preferred: Int, captures: Int, safe: Int, staticScore: Int) in
                let metrics = moveMetrics(edge: move, board: board, state: state, analysis: analysis)
                let isPreferred = (preferredMove != nil && move == preferredMove) ? 1 : 0
                let isCapturing = metrics.captures > 0 ? 1 : 0
                let isSafeMove = isSafe(edge: move, board: board, state: state, analysis: analysis) ? 1 : 0
                return (
                    move: move,
                    preferred: isPreferred,
                    captures: isCapturing,
                    safe: isSafeMove,
                    staticScore: staticMoveScore(edge: move, board: board, state: state, analysis: analysis)
                )
            }
            .sorted { lhs, rhs in
                if lhs.preferred != rhs.preferred { return lhs.preferred > rhs.preferred }
                if lhs.captures != rhs.captures { return lhs.captures > rhs.captures }
                if lhs.safe != rhs.safe { return lhs.safe > rhs.safe }
                if lhs.staticScore != rhs.staticScore { return lhs.staticScore > rhs.staticScore }
                return lhs.move < rhs.move
            }
            .map { $0.move }
    }

    private static func staticMoveScore(edge: Int, board: BoardLayout, state: GameState, analysis: BoardAnalysis) -> Int {
        let policy = AIPolicies.hard
        let metrics = moveMetrics(edge: edge, board: board, state: state, analysis: analysis)
        var score = 0.0
        score += Double(metrics.captures) * policy.weights.captureReward
        score += Double(metrics.createsSecond) * policy.weights.secondBonus
        score -= Double(metrics.createsThird) * policy.weights.thirdPenalty
        score += isSafe(edge: edge, board: board, state: state, analysis: analysis) ? policy.weights.safetyBonus : 0
        score += centerWeight(edge: edge, board: board) * policy.weights.centerBonus
        return Int(score)
    }

    private static func searchProfile(remaining: Int, phase: GamePhase) -> SearchProfile {
        switch phase {
        case .opening:
            switch remaining {
            case ...12: return SearchProfile(depthLimit: min(remaining, 11), timeBudget: 0.38, exactEndgameThreshold: 12)
            case 13...20: return SearchProfile(depthLimit: 9, timeBudget: 0.28, exactEndgameThreshold: 12)
            default: return SearchProfile(depthLimit: 6, timeBudget: 0.20, exactEndgameThreshold: 12)
            }
        case .midgame:
            switch remaining {
            case ...12: return SearchProfile(depthLimit: min(remaining, 12), timeBudget: 0.42, exactEndgameThreshold: 12)
            case 13...20: return SearchProfile(depthLimit: 10, timeBudget: 0.32, exactEndgameThreshold: 12)
            default: return SearchProfile(depthLimit: 7, timeBudget: 0.24, exactEndgameThreshold: 12)
            }
        case .endgame:
            switch remaining {
            case ...8: return SearchProfile(depthLimit: remaining, timeBudget: 0.56, exactEndgameThreshold: 12)
            case 9...12: return SearchProfile(depthLimit: 12, timeBudget: 0.50, exactEndgameThreshold: 12)
            case 13...20: return SearchProfile(depthLimit: 11, timeBudget: 0.36, exactEndgameThreshold: 12)
            default: return SearchProfile(depthLimit: 8, timeBudget: 0.28, exactEndgameThreshold: 12)
            }
        }
    }

    private static func depthLimit(remaining: Int, phase: GamePhase) -> Int {
        searchProfile(remaining: remaining, phase: phase).depthLimit
    }

    private static func timeBudget(remaining: Int, phase: GamePhase) -> CFAbsoluteTime {
        searchProfile(remaining: remaining, phase: phase).timeBudget
    }

    private static func diversifiedRootChoice(
        fallbackBestMove: Int,
        fallbackBestScore: Int,
        rootScores: [Int: Int],
        phase: GamePhase,
        rng: inout SeededRNG
    ) -> Int {
        guard phase != .endgame else { return fallbackBestMove }

        let policy = AIPolicies.hard
        let sorted = rootScores.sorted { lhs, rhs in
            if lhs.value == rhs.value { return lhs.key < rhs.key }
            return lhs.value > rhs.value
        }
        guard let best = sorted.first else { return fallbackBestMove }

        let anchor = (best.value >= fallbackBestScore) ? best.key : fallbackBestMove
        let delta = Int(policy.candidateDelta.value(for: phase).rounded())
        let limit = policy.candidateLimit.value(for: phase)
        let candidates = Array(sorted.filter { best.value - $0.value <= delta }.prefix(limit))

        guard candidates.count > 1 else { return anchor }
        guard rng.randomBool(probability: policy.mistakeChance.value(for: phase)) else { return anchor }

        let weighted = candidates.map { ($0.key, Double($0.value)) }
        return AI.weightedChoice(weighted, temperature: policy.temperature.value(for: phase), rng: &rng) ?? anchor
    }
}

private func availableEdges(board: BoardLayout, state: GameState) -> [Int] {
    board.edges.map { $0.id }.filter { !state.occupiedEdges.contains($0) }
}

private func findCapturingEdge(state: GameState) -> Int? {
    for zone in state.zones where zone.owner == .none {
        if zoneOccupiedEdgeCount(zone: zone, state: state) == 3,
           let missing = zone.edgeIds.first(where: { !state.occupiedEdges.contains($0) }) {
            return missing
        }
    }
    return nil
}

private func findSafeEdges(
    board: BoardLayout,
    state: GameState,
    available: [Int],
    analysis: BoardAnalysis
) -> [Int] {
    available.filter { isSafe(edge: $0, board: board, state: state, analysis: analysis) }
}

private func moveMetrics(
    edge: Int,
    board: BoardLayout,
    state: GameState,
    analysis: BoardAnalysis
) -> (captures: Int, createsThird: Int, createsSecond: Int) {
    var captures = 0
    var createsThird = 0
    var createsSecond = 0

    for zoneIndex in analysis.zones(for: edge) {
        let zone = board.zones[zoneIndex]
        guard state.zones[zoneIndex].owner == .none else { continue }

        let occupied = zoneOccupiedEdgeCount(zone: zone, state: state)
        if occupied == 3 {
            captures += 1
        } else if occupied == 2 {
            createsThird += 1
        } else if occupied == 1 {
            createsSecond += 1
        }
    }

    return (captures, createsThird, createsSecond)
}

private func isSafe(edge: Int, board: BoardLayout, state: GameState, analysis: BoardAnalysis) -> Bool {
    for zoneIndex in analysis.zones(for: edge) {
        guard state.zones[zoneIndex].owner == .none else { continue }
        let zone = board.zones[zoneIndex]
        if zoneOccupiedEdgeCount(zone: zone, state: state) == 2 {
            return false
        }
    }
    return true
}

private func centerWeight(edge: Int, board: BoardLayout) -> Double {
    guard let selected = board.edges.first(where: { $0.id == edge }) else { return 0 }
    let a = board.nodes[selected.a].position
    let b = board.nodes[selected.b].position
    let centerX = (a.x + b.x) / 2
    let centerY = (a.y + b.y) / 2
    let distance = sqrt((centerX * centerX) + (centerY * centerY))
    return max(0, 1 - (distance / 10))
}

private func zoneOccupiedEdgeCount(zone: Zone, state: GameState) -> Int {
    zone.edgeIds.reduce(into: 0) { partial, edgeId in
        if state.occupiedEdges.contains(edgeId) {
            partial += 1
        }
    }
}

private func simulateMove(_ move: Int, state: inout GameState, board: BoardLayout, analysis: BoardAnalysis) -> Bool {
    state.occupiedEdges.insert(move)
    var captured = false

    for zoneIndex in analysis.zones(for: move) {
        guard state.zones[zoneIndex].owner == .none else { continue }
        let zone = board.zones[zoneIndex]
        if zone.edgeIds.allSatisfy({ state.occupiedEdges.contains($0) }) {
            state.zones[zoneIndex].owner = .player(state.currentPlayer)
            captured = true
        }
    }

    if !captured {
        state.currentPlayer = state.currentPlayer.next
    }

    return captured
}

private func stateHash(_ state: GameState) -> UInt64 {
    var hash: UInt64 = 0xCBF29CE484222325

    for edge in state.occupiedEdges {
        hash ^= splitmix64(UInt64(edge) &+ 0x9E3779B97F4A7C15)
    }

    for zone in state.zones {
        switch zone.owner {
        case .none:
            continue
        case .player(.x):
            hash ^= splitmix64(UInt64(zone.id) &* 3 &+ 0xD1B54A32D192ED03)
        case .player(.o):
            hash ^= splitmix64(UInt64(zone.id) &* 5 &+ 0x94D049BB133111EB)
        }
    }

    if state.currentPlayer == .o {
        hash ^= 0x9E3779B97F4A7C15
    }

    return hash
}

private func splitmix64(_ value: UInt64) -> UInt64 {
    var x = value &+ 0x9E3779B97F4A7C15
    x = (x ^ (x >> 30)) &* 0xBF58476D1CE4E5B9
    x = (x ^ (x >> 27)) &* 0x94D049BB133111EB
    return x ^ (x >> 31)
}
