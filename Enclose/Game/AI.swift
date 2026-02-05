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
    /// Returns the best edge ID to play based on the current board state and difficulty level.
    static func bestMove(board: BoardLayout, state: GameState, level: AILevel) -> Int? {
        let availableEdges = board.edges.map { $0.id }.filter { !state.occupiedEdges.contains($0) }
        guard !availableEdges.isEmpty else { return nil }
        
        // 1. **Immediate Capture (Greedy)**
        // ALWAYS take a point if available.
        if let capturingMove = findCapturingEdge(board: board, state: state, available: availableEdges) {
            // Logic: If there are multiple capturing moves, any is fine.
            // But in a real game, you might want to pick the one leading to MORE captures (chain).
            // Since we get another turn after capture, taking *any* capture is the first step of the chain.
            return capturingMove
        }
        
        // 2. **Safety (Defensive)**
        // Find moves that do NOT give the opponent a free capture (i.e. don't set a zone to 3 edges).
        let safeEdges = findSafeEdges(board: board, state: state, available: availableEdges)
        
        if !safeEdges.isEmpty {
            // If we have safe moves, pick one.
            switch level {
            case .easy:
                // Easy: 70% chance to pick safe, 30% might slip up (random safe or potentially bad if we didn't filter strictly).
                // But user requested "Logical moves". So even Easy should be somewhat rigorous.
                // Let's just make Easy pick Random Safe.
                return safeEdges.randomElement()
                
            case .medium, .hard:
                // Hard/Medium: Could prioritize edges that minimalize future risks or keep chains small.
                // For now, Random Safe is quite strong.
                // Improvement: Pick safe edge that affects the FEWEST zones (leaving them at 0 or 1 edge).
                // Or pick center?
                return safeEdges.randomElement()
            }
        }
        
        // 3. **Forced Sacrifice**
        // If NO safe moves exist, we must give away a point.
        // Strategy: Minimize damage. Give the smallest chain?
        // For MVP, randomly pick one of the remaining (bad) edges.
        return availableEdges.randomElement()
    }
    
    /// Finds an edge that will complete a zone (score a point).
    private static func findCapturingEdge(board: BoardLayout, state: GameState, available: [Int]) -> Int? {
        // Optimization: Check zones that currently have 3 lines.
        for zone in state.zones {
            if zone.owner != .none { continue }
            
            let occupiedCount = zone.edgeIds.filter { state.occupiedEdges.contains($0) }.count
            if occupiedCount == 3 {
                // Return the one missing edge
                if let missing = zone.edgeIds.first(where: { !state.occupiedEdges.contains($0) }) {
                    return missing
                }
            }
        }
        return nil
    }
    
    /// Finds edges that do NOT result in a zone having 3 lines occupied (which would allow opponent to capture).
    private static func findSafeEdges(board: BoardLayout, state: GameState, available: [Int]) -> [Int] {
        var safe: [Int] = []
        
        for edge in available {
            if isSafe(edge: edge, board: board, state: state) {
                safe.append(edge)
            }
        }
        
        return safe
    }
    
    /// Checks if playing an edge is "safe" (doesn't give a free point to opponent).
    private static func isSafe(edge: Int, board: BoardLayout, state: GameState) -> Bool {
        // Find zones sharing this edge
        let affectedZones = board.zones.filter { $0.edgeIds.contains(edge) }
        
        for zone in affectedZones {
            // A zone is unsafe if playing this edge brings its count to 3.
            // (Current count must be 2).
            let currentOccupied = zone.edgeIds.filter { state.occupiedEdges.contains($0) }.count
            if currentOccupied == 2 {
                return false // Playing this would make it 3 -> Unsafe
            }
        }
        return true
    }
}
