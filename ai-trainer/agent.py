import random
import math
from typing import List, Dict, Optional, Tuple
from game import Game, BoardLayout, GameState, Edge, Zone

class ApproximateQLearningAgent:
    def __init__(self, weights: Optional[List[float]] = None, alpha=0.01, gamma=0.9, epsilon=0.1):
        # Default weights if none provided
        # 0: Completes Box
        # 1: Gives Capture (Opponent can close)
        # 2: Two-Edge Zones (Potential risk/setup)
        # 3: Chain Length
        # 4: Center Distance
        # 5: Bias
        self.weights = weights if weights else [10.0, -20.0, -1.0, 0.5, 0.1, 1.0]
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon

    def get_q_value(self, game: Game, edge_id: int) -> float:
        features = self.extract_features(game, edge_id)
        return sum(f * w for f, w in zip(features, self.weights))

    def get_best_move(self, game: Game) -> int:
        legal_moves = game.get_legal_moves()
        if not legal_moves:
            return None
            
        if random.random() < self.epsilon:
            return random.choice(legal_moves)
            
        # Greedy
        best_score = -float('inf')
        best_moves = []
        
        for move in legal_moves:
            q = self.get_q_value(game, move)
            if q > best_score:
                best_score = q
                best_moves = [move]
            elif q == best_score:
                best_moves.append(move)
                
        return random.choice(best_moves)

    def update(self, game: Game, action: int, reward: float, next_game: Game):
        # Current Q
        features = self.extract_features(game, action)
        current_q = sum(f * w for f, w in zip(features, self.weights))
        
        # Max Next Q
        next_legal = next_game.get_legal_moves()
        max_next_q = 0.0
        if next_legal and not next_game.state.is_over:
            # We need to compute features for next state
            q_values = [self.get_q_value(next_game, m) for m in next_legal]
            max_next_q = max(q_values)
            
        # Target
        target = reward + self.gamma * max_next_q
        difference = target - current_q
        
        # Update weights: w_i <- w_i + alpha * diff * f_i
        for i in range(len(self.weights)):
            self.weights[i] += self.alpha * difference * features[i]

    def extract_features(self, game: Game, edge_id: int) -> List[float]:
        # Temporarily apply move logic to check consequences?
        # Or just inspect board.
        # "Completes Box" and "Gives Capture" are best calculated by
        # seeing what the state WOULD be. 
        # But we need features of (State, Action).
        
        features = [0.0] * 6
        features[5] = 1.0 # Bias
        
        # 1. Completes Box?
        # Check zones connected to this edge. If any has 2 occupied, this makes 3 -> Box!
        zones = [z for z in game.layout.zones if edge_id in z.edge_ids]
        completes_count = 0
        gives_capture_count = 0
        two_edge_zones_created = 0
        
        for z in zones:
            occupied = sum(1 for eid in z.edge_ids if eid in game.state.occupied_edges)
            if occupied == 2:
                completes_count += 1
                
        features[0] = float(completes_count)
        
        # 2. Gives Capture?
        # If we play this edge, and it makes a zone have 2 edges (and not 3),
        # then opponent can take it? 
        # Wait, if we make it 3 (Complete Box), we get another turn. So it's good.
        # If we make it 2 (from 1), then opponent (next player) encounters a 2-edge zone -> They can complete it.
        # So "Gives Capture" = Creating a 2-edge zone (that isn't completed immediately).
        
        for z in zones:
            occupied = sum(1 for eid in z.edge_ids if eid in game.state.occupied_edges)
            if occupied == 1:
                # We are adding the 2nd edge. Opponent can capture.
                gives_capture_count += 1
                
        features[1] = float(gives_capture_count)
        
        # 3. Two-Edge Zones count (Global or Local?)
        # Let's count how many *other* 2-edge zones exist / are created?
        # Simplify: Just global count of risky zones? Or diff?
        # Let's stick to Local: "Does this move create a setup?"
        features[2] = float(gives_capture_count) # Same as above for now?
        # Actually, "Two Edge Zones" usually implies potential future captures for US if we don't screw up.
        # But if we create it for opponent, it's bad.
        
        # 4. Chain Length
        # How connected is this edge?
        edge_obj = next(e for e in game.layout.edges if e.id == edge_id)
        # Find neighbors
        # (Simplified: just degree of node connectivity)
        # ...
        
        # 5. Center Distance
        node_a = next(n for n in game.layout.nodes if n.id == edge_obj.a)
        node_b = next(n for n in game.layout.nodes if n.id == edge_obj.b)
        cx = (node_a.x + node_b.x) / 2
        cy = (node_a.y + node_b.y) / 2
        
        # Assuming grid roughly 0..size
        # Center approx (size/2, size/2)
        # Let's just use dist from (0,0) if centering logic in game.py was correct?
        # In game.py I used 0..grid_size.
        # Center is grid_w/2, grid_h/2.
        
        # Need board bounds to normalize
        # Let's skip precise normalization for MVP.
        features[4] = 0.0 
        
        return features

