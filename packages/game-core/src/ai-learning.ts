import { getScores } from './state';
import { type BoardLayout, type GameState, type Player } from './types';

// Feature weights interface
export type FeatureWeights = number[];

// Default weights for initialization (heuristic based)
// 0: Completes Box (Reward!)
// 1: Gives Capture (Penalty!)
// 2: Two-Edge Zones (Warning)
// 3: Chain Length (Strategy - small bonus for long chains?)
// 4: Center Distance (Positional - prefer center)
// 5: Bias (Base value)
export const DEFAULT_WEIGHTS: FeatureWeights = [
    2.8932669812201,   // Completes Box
    -10.5206972923569, // Gives Capture
    8.479302707643111, // Two-Edge Zones
    0.5,               // Chain Length (not used in training?)
    0.1,               // Center Distance
    60.15689011204689  // Bias
];

export class LearningAgent {
    private weights: FeatureWeights;
    private alpha: number = 0.05; // Learning rate
    private gamma: number = 0.9;  // Discount factor
    private epsilon: number = 0.1; // Exploration rate

    constructor(weights: FeatureWeights = [...DEFAULT_WEIGHTS]) {
        this.weights = weights;
    }

    // Get best move based on current weights
    getBestMove(board: BoardLayout, state: GameState, available: number[]): number {
        // Epsilon-greedy policy for exploration
        if (Math.random() < this.epsilon) {
            return available[Math.floor(Math.random() * available.length)];
        }

        let bestScore = Number.NEGATIVE_INFINITY;
        let bestMoves: number[] = [];

        for (const edgeId of available) {
            const features = this.extractFeatures(board, state, edgeId);
            const score = this.predict(features);

            if (score > bestScore) {
                bestScore = score;
                bestMoves = [edgeId];
            } else if (score === bestScore) {
                bestMoves.push(edgeId);
            }
        }

        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    // Update weights based on transition (S, A, R, S')
    update(
        board: BoardLayout,
        state: GameState,
        action: number,
        reward: number,
        nextState: GameState,
        nextAvailable: number[]
    ): FeatureWeights {
        const features = this.extractFeatures(board, state, action);
        const prediction = this.predict(features);

        // Calculate max Q(s', a')
        let maxNextQ = 0;
        if (nextAvailable.length > 0) {
            maxNextQ = Number.NEGATIVE_INFINITY;
            for (const edgeId of nextAvailable) {
                const nextFeatures = this.extractFeatures(board, nextState, edgeId);
                const q = this.predict(nextFeatures);
                if (q > maxNextQ) maxNextQ = q;
            }
        }

        // Gradient Descent Update
        // difference = (reward + gamma * maxNextQ) - prediction
        const target = reward + this.gamma * maxNextQ;
        const difference = target - prediction;

        // w_i = w_i + alpha * difference * f_i
        const newWeights = [...this.weights];
        for (let i = 0; i < newWeights.length; i++) {
            newWeights[i] += this.alpha * difference * features[i];
        }

        this.weights = newWeights;
        return this.weights;
    }

    getWeights(): FeatureWeights {
        return this.weights;
    }

    setWeights(weights: FeatureWeights) {
        this.weights = weights;
    }

    // Linear Function Approximation: Q(s, a) = sum(w_i * f_i)
    private predict(features: number[]): number {
        return features.reduce((sum, f, i) => sum + f * (this.weights[i] || 0), 0);
    }

    // Extract features representing state-action pair
    private extractFeatures(board: BoardLayout, state: GameState, edgeId: number): number[] {
        const features: number[] = [0, 0, 0, 0, 0, 1]; // Initialize with Bias = 1

        // 1. Completes Box?
        const completesBox = this.doesCompleteBox(board, state, edgeId);
        features[0] = completesBox ? 1 : 0;

        // 2. Gives Capture?
        const givesCapture = this.doesGiveCapture(board, state, edgeId);
        features[1] = givesCapture ? 1 : 0;

        // 3. Two-Edge Zones count (after move)
        // Simplified: How many zones become 2-edge zones because of this move?
        features[2] = this.countNewTwoEdgeZones(board, state, edgeId);

        // 4. Chain Length (Approximation: number of connected edges)
        // Not implemented fully deep, just local connectivity
        features[3] = this.getConnectivity(board, state, edgeId);

        // 5. Center Distance (Normalized 0-1, 1 is center)
        const edge = board.edges.find(e => e.id === edgeId);
        if (edge) {
            const nodeA = board.nodes[edge.a];
            const nodeB = board.nodes[edge.b];
            const centerX = (nodeA.position.x + nodeB.position.x) / 2;
            const centerY = (nodeA.position.y + nodeB.position.y) / 2;
            // Assuming board is roughly centered around 0,0 and max dimension ~10
            const dist = Math.sqrt(centerX * centerX + centerY * centerY);
            features[4] = Math.max(0, 1 - dist / 10);
        }

        return features;
    }

    // --- Feature Helper Methods ---

    private doesCompleteBox(board: BoardLayout, state: GameState, edgeId: number): boolean {
        const zones = board.zones.filter(z => z.edgeIds.includes(edgeId));
        for (const zone of zones) {
            const occupied = zone.edgeIds.filter(id => state.occupiedEdges.has(id)).length;
            if (occupied === 3) return true; // Adding 4th edge
        }
        return false;
    }

    private doesGiveCapture(board: BoardLayout, state: GameState, edgeId: number): boolean {
        // If move creates a zone with 3 edges (that wasn't already closed), it gives a capture
        const zones = board.zones.filter(z => z.edgeIds.includes(edgeId));
        for (const zone of zones) {
            const occupied = zone.edgeIds.filter(id => state.occupiedEdges.has(id)).length;
            if (occupied === 2) return true; // Adding 3rd edge -> opponent can capture
        }
        return false;
        // Note: This logic is simplified. It doesn't check if *we* get another turn to capture it ourselves.
        // Ideally, "Gives Capture" means we end our turn leaving a 3-edge zone.
        // But since the feature is state-action based, this is a decent local approximation.
    }

    private countNewTwoEdgeZones(board: BoardLayout, state: GameState, edgeId: number): number {
        let count = 0;
        const zones = board.zones.filter(z => z.edgeIds.includes(edgeId));
        for (const zone of zones) {
            const occupied = zone.edgeIds.filter(id => state.occupiedEdges.has(id)).length;
            if (occupied === 1) count++; // Adding 2nd edge
        }
        return count;
    }

    private getConnectivity(board: BoardLayout, state: GameState, edgeId: number): number {
        // How many already occupied edges are connected to this edge?
        const edge = board.edges.find(e => e.id === edgeId);
        if (!edge) return 0;

        // Find neighbors via nodes
        const neighbors = board.edges.filter(e =>
            e.id !== edgeId &&
            (e.a === edge.a || e.a === edge.b || e.b === edge.a || e.b === edge.b)
        );

        return neighbors.filter(e => state.occupiedEdges.has(e.id)).length;
    }
}
