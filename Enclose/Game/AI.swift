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

final class AI {
    static func bestMove(board: BoardLayout, state: GameState, level: AILevel) -> Int? {
        let availableEdges = board.edges.map { $0.id }.filter { !state.occupiedEdges.contains($0) }
        guard !availableEdges.isEmpty else { return nil }
        
        switch level {
        case .easy:
            // Easy keeps simple logic and occasional mistakes for human-like play.
            if Double.random(in: 0...1) < 0.22 {
                return availableEdges.randomElement()
            }
            if let capture = findCapturingEdge(board: board, state: state, available: availableEdges) {
                return capture
            }
            let safe = findSafeEdges(board: board, state: state, available: availableEdges)
            return safe.randomElement() ?? availableEdges.randomElement()
            
        case .medium:
            return HeuristicSolver.solve(board: board, state: state, available: availableEdges)
            
        case .hard:
            return MinimaxSolver.solve(board: board, state: state, available: availableEdges)
        }
    }
    
    // MARK: - Helpers
    
    private static func findCapturingEdge(board: BoardLayout, state: GameState, available: [Int]) -> Int? {
        for zone in state.zones {
            if zone.owner != .none { continue }
            let occupiedCount = zone.edgeIds.filter { state.occupiedEdges.contains($0) }.count
            if occupiedCount == 3 {
                if let missing = zone.edgeIds.first(where: { !state.occupiedEdges.contains($0) }) {
                    return missing
                }
            }
        }
        return nil
    }
    
    private static func findSafeEdges(board: BoardLayout, state: GameState, available: [Int]) -> [Int] {
        var safe: [Int] = []
        for edge in available {
            if isSafe(edge: edge, board: board, state: state) {
                safe.append(edge)
            }
        }
        return safe
    }
    
    fileprivate static func isSafe(edge: Int, board: BoardLayout, state: GameState) -> Bool {
        // Safe = Does not make any zone's occupied count 2 -> 3
        let affectedZones = affectedZones(for: edge, board: board)
        for zone in affectedZones {
            let currentOccupied = zone.edgeIds.filter { state.occupiedEdges.contains($0) }.count
            if currentOccupied == 2 {
                return false
            }
        }
        return true
    }

    private static func affectedZones(for edge: Int, board: BoardLayout) -> [Zone] {
        board.zones.filter { $0.edgeIds.contains(edge) }
    }
}

private final class HeuristicSolver {
    static func solve(board: BoardLayout, state: GameState, available: [Int]) -> Int {
        let ordered = available.sorted { moveScore(edge: $0, board: board, state: state) > moveScore(edge: $1, board: board, state: state) }
        return ordered.first ?? available.first!
    }

    private static func moveScore(edge: Int, board: BoardLayout, state: GameState) -> Double {
        let metrics = moveMetrics(edge: edge, board: board, state: state)
        var score = 0.0
        score += Double(metrics.captures) * 160.0
        score += Double(metrics.createsSecond) * 8.0
        score -= Double(metrics.createsThird) * 125.0
        score += AI.isSafe(edge: edge, board: board, state: state) ? 22.0 : 0.0
        score += centerWeight(edge: edge, board: board) * 6.0
        return score
    }

    private static func moveMetrics(edge: Int, board: BoardLayout, state: GameState) -> (captures: Int, createsThird: Int, createsSecond: Int) {
        var captures = 0
        var createsThird = 0
        var createsSecond = 0

        for zone in board.zones where zone.edgeIds.contains(edge) && zone.owner == .none {
            let occupied = zone.edgeIds.filter { state.occupiedEdges.contains($0) }.count
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

    private static func centerWeight(edge: Int, board: BoardLayout) -> Double {
        guard let e = board.edges.first(where: { $0.id == edge }) else { return 0 }
        let a = board.nodes[e.a]
        let b = board.nodes[e.b]
        let centerX = (a.position.x + b.position.x) / 2
        let centerY = (a.position.y + b.position.y) / 2
        let dist = sqrt((centerX * centerX) + (centerY * centerY))
        return max(0, 1 - (dist / 10))
    }
}

// MARK: - Minimax Solver

private final class MinimaxSolver {
    
    // Evaluate depth based on remaining empty edges
    // < 15 edges: Go deep (endgame solver)
    // > 15 edges: Shallow search (3-4 ply)
    static func solve(board: BoardLayout, state: GameState, available: [Int]) -> Int {
        let emptyCount = available.count
        let maxDepth = emptyCount <= 12 ? 9 : (emptyCount <= 20 ? 5 : 3)
        
        var bestScore = Int.min
        var bestMove = available.first!
        var alpha = Int.min
        let beta = Int.max
        
        // Root level search
        // Optimization: Sort moves? Captures first.
        let sortedMoves = sortMoves(moves: available, board: board, state: state)
        
        for move in sortedMoves {
            var nextState = state
            let extraTurn = simulate(move: move, state: &nextState, board: board)
            
            // If we got an extra turn, we continue maximizing from same depth!
            // But to simplify recursion and prevent infinite loops in design,
            // we can treat it as: if extraTurn, depth doesn't decrease?
            // Or just recurse maximizing.
            
            let score: Int
            if extraTurn {
                // Maximize again (same player)
                score = minimax(state: nextState, depth: maxDepth, alpha: alpha, beta: beta, maximizingPlayer: true, board: board)
            } else {
                // Minimize (opponent turn)
                score = minimax(state: nextState, depth: maxDepth - 1, alpha: alpha, beta: beta, maximizingPlayer: false, board: board)
            }
            
            if score > bestScore {
                bestScore = score
                bestMove = move
            }
            alpha = max(alpha, score)
            // No beta prune at root
        }
        
        return bestMove
    }
    
    private static func minimax(state: GameState, depth: Int, alpha: Int, beta: Int, maximizingPlayer: Bool, board: BoardLayout) -> Int {
        if depth == 0 || state.occupiedEdges.count == board.edges.count {
            return evaluate(state, maximizingPlayer: maximizingPlayer)
        }
        
        let available = board.edges.map { $0.id }.filter { !state.occupiedEdges.contains($0) }
        if available.isEmpty { return evaluate(state, maximizingPlayer: maximizingPlayer) }
        
        // Sort moves to improve pruning: Chains/Captures first
        let moves = sortMoves(moves: available, board: board, state: state)
        
        var alpha = alpha
        var beta = beta
        
        if maximizingPlayer {
            var maxEval = Int.min
            for move in moves {
                var nextState = state
                let extraTurn = simulate(move: move, state: &nextState, board: board)
                
                let eval: Int
                if extraTurn {
                    eval = minimax(state: nextState, depth: depth, alpha: alpha, beta: beta, maximizingPlayer: true, board: board)
                } else {
                    eval = minimax(state: nextState, depth: depth - 1, alpha: alpha, beta: beta, maximizingPlayer: false, board: board)
                }
                
                maxEval = max(maxEval, eval)
                alpha = max(alpha, eval)
                if beta <= alpha {
                    break
                }
            }
            return maxEval
        } else {
            var minEval = Int.max
            for move in moves {
                var nextState = state
                let extraTurn = simulate(move: move, state: &nextState, board: board)
                
                let eval: Int
                if extraTurn {
                    eval = minimax(state: nextState, depth: depth, alpha: alpha, beta: beta, maximizingPlayer: false, board: board)
                } else {
                    eval = minimax(state: nextState, depth: depth - 1, alpha: alpha, beta: beta, maximizingPlayer: true, board: board)
                }
                
                minEval = min(minEval, eval)
                beta = min(beta, eval)
                if beta <= alpha {
                    break
                }
            }
            return minEval
        }
    }
    
    // Heuristic Evaluation
    private static func evaluate(_ state: GameState, maximizingPlayer: Bool) -> Int {
        _ = maximizingPlayer
        let scoreDiff = (state.scoreO - state.scoreX) * 100

        var nearCaptures = 0
        var unstableZones = 0

        for zone in state.zones where zone.owner == .none {
            let occupied = zone.edgeIds.filter { state.occupiedEdges.contains($0) }.count
            if occupied == 3 {
                nearCaptures += 1
            } else if occupied == 2 {
                unstableZones += 1
            }
        }

        let turnFactor = state.currentPlayer == .o ? 1 : -1
        return scoreDiff + (nearCaptures * 24 * turnFactor) - (unstableZones * 7)
    }
    
    // Logic from GameEngine
    private static func simulate(move: Int, state: inout GameState, board: BoardLayout) -> Bool {
        state.occupiedEdges.insert(move)
        var captured = false
        
        // Optimization: Only check zones connected to this edge
        // But board.zones isn't indexed by edge. Map needed?
        // Board size is small (25 zones), iteration is fast enough (25 ops).
        for i in state.zones.indices {
            if state.zones[i].owner == .none {
                // Only relevant if zone contains the edges
                if state.zones[i].edgeIds.contains(move) {
                    let zoneEdges = state.zones[i].edgeIds
                    // Check if all edges are occupied
                    // Since we just added 'move', and we know others might be there
                    if zoneEdges.allSatisfy({ state.occupiedEdges.contains($0) }) {
                        state.zones[i].owner = .player(state.currentPlayer)
                        captured = true
                    }
                }
            }
        }
        
        if captured {
            // Player keeps turn. Score update happens automatically via computed scoreX/O in state?
            // GameState computes scoreX/Y dynamically from zones array usually.
            // Let's check GameState def. If it's computed var, then we are good.
            // Yes, standard GameState usually computes scores.
            return true
        } else {
            state.currentPlayer = state.currentPlayer.next
            return false
        }
    }
    
    // Move Ordering optimization
    private static func sortMoves(moves: [Int], board: BoardLayout, state: GameState) -> [Int] {
        return moves.sorted { a, b in
            let scoreA = moveScore(edge: a, board: board, state: state)
            let scoreB = moveScore(edge: b, board: board, state: state)
            return scoreA > scoreB
        }
    }
    
    private static func moveScore(edge: Int, board: BoardLayout, state: GameState) -> Int {
        let metrics = moveMetrics(edge: edge, board: board, state: state)
        var score = 0
        score += metrics.captures * 100
        score += isSafe(edge: edge, board: board, state: state) ? 40 : 0
        score -= metrics.createsThird * 50
        score += metrics.createsSecond * 4
        score += Int(centerWeight(edge: edge, board: board) * 3.0)
        return score
    }
    
    private static func captures(edge: Int, board: BoardLayout, state: GameState) -> Bool {
        for zone in board.zones where zone.edgeIds.contains(edge) {
            if zone.edgeIds.contains(edge) && zone.owner == .none {
                let occupied = zone.edgeIds.filter { state.occupiedEdges.contains($0) }.count
                if occupied == 3 { return true } // The 4th is this edge (assuming it's not occupied yet, which it isn't)
            }
        }
        return false
    }
    
    private static func isSafe(edge: Int, board: BoardLayout, state: GameState) -> Bool {
        // Check neighbors
        for zone in board.zones {
            if zone.edgeIds.contains(edge) {
                let occupied = zone.edgeIds.filter { state.occupiedEdges.contains($0) }.count
                if occupied == 2 { return false } // Will become 3
            }
        }
        return true
    }

    private static func moveMetrics(edge: Int, board: BoardLayout, state: GameState) -> (captures: Int, createsThird: Int, createsSecond: Int) {
        var captures = 0
        var createsThird = 0
        var createsSecond = 0

        for zone in board.zones where zone.edgeIds.contains(edge) && zone.owner == .none {
            let occupied = zone.edgeIds.filter { state.occupiedEdges.contains($0) }.count
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

    private static func centerWeight(edge: Int, board: BoardLayout) -> Double {
        guard let e = board.edges.first(where: { $0.id == edge }) else { return 0 }
        let a = board.nodes[e.a]
        let b = board.nodes[e.b]
        let centerX = (a.position.x + b.position.x) / 2
        let centerY = (a.position.y + b.position.y) / 2
        let dist = sqrt((centerX * centerX) + (centerY * centerY))
        return max(0, 1 - (dist / 10))
    }
}
