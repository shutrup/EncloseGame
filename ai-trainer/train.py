import random
import json
import time
from game import Game
from agent import ApproximateQLearningAgent

import sys

def train_agent(episodes=100000):
    agent = ApproximateQLearningAgent(alpha=0.001, gamma=0.9, epsilon=0.1)
    
    wins = {'learn': 0, 'opponent': 0, 'draw': 0}
    
    try:
        for episode in range(episodes):
            game = Game(preset='mini') # Train on Mini for speed
        
            # Randomize who starts?
            turn = 'x'
            
            # For self-play training, let's have one "Learning" agent vs Random for now
            # to ensure it learns basic strategy. Later self-play.
            
            # State tracking for update
            last_state = None
            last_action = None
            current_reward = 0
            
            while not game.state.is_over:
                # Learning Agent (always as 'x' or 'o'?)
                # Let agent play 'x'.
                
                if game.state.current_player == 'x':
                    # Agent Turn
                    # 1. Update previous step if needed? 
                    # (S, A, R, S') -> Update.
                    # If we made a move last time (as X), we are now in state S'.
                    # The intermediate opponent move led us here.
                    
                    if last_state is not None:
                        # Reward for surviving opponent turn? Or just delayed?
                        # Reward is accumulated from our move and opponent's move outcome.
                        # e.g. Did we lose a box?
                        
                        # Update (last_state, last_action, current_reward, current_game)
                        agent.update(last_state, last_action, current_reward, game)
                        current_reward = 0
                    
                    # Make Move
                    move = agent.get_best_move(game)
                    if move is None: break
                    
                    # Store S, A
                    # Need immutable state or copy?
                    # Game logic mutation makes copy necessary for accurate update? 
                    # Agent uses current game object for next state features.
                    # Just need features of state S. Extract now?
                    # Actually agent.update re-extracts. So we need S.
                    # Python's deepcopy is slow.
                    # Let's just store features if possible, or refactor agent.
                    # For now, simplistic approach: Game object is small enough?
                    # No, game object mutates. We need snapshot.
                    # Or just extract features NOW.
                    
                    last_state = copy_game(game) # This reference will mutate! ERROR.
                    # Fix: Agent should store features, not state.
                    # Refactoring agent.update to take features?
                    
                    last_action = move
                    
                    # Apply move
                    game.play_move(move)
                    
                    # Immediate reward? (e.g. Completed box)
                    if game.state.scores['x'] > last_state.state.scores['x']:
                        current_reward += 10 # Box!
                        # If we complete a box, we get another turn!
                        # The loop continues with 'x'.
                        # We should probably treat "Extra Turn" as part of the same action sequence?
                        # Or just immediate update?
                        
                else:
                    # Opponent Turn (Greedy - captures if possible, else random)
                    # This teaches the AI defense (not to give easy captures)
                    
                    # Check for captures
                    legal = game.get_legal_moves()
                    move = None
                    
                    # strict greedy: find move that completes a box
                    for m in legal:
                        # Simulation check is expensive, check board structure directly?
                        # Or just quick simulation
                        # We can use the agent's "completes_box" logic if we want, or just game logic
                        if creates_box(game, m):
                            move = m
                            break
                            
                    if move is None and legal:
                        move = random.choice(legal)
                        
                    if move is not None:
                        game.play_move(move)
                    else: break
            
            # Game Over
            # Final update
            reward = 100 if game.winner == 'x' else -100 if game.winner == 'o' else 0
            if last_state:
                agent.update(last_state, last_action, reward + current_reward, game)
                
            # Stats
            if game.winner == 'x': wins['learn'] += 1
            elif game.winner == 'o': wins['opponent'] += 1
            else: wins['draw'] += 1
            
            if episode % 1000 == 0:
                print(f"Episode {episode}: {wins}")
                
    except KeyboardInterrupt:
        print("\nTraining interrupted by user.")
            
    print(f"Training finished. Win rates: {wins}")
    
    # Save weights
    with open('weights.json', 'w') as f:
        json.dump(agent.weights, f)

def copy_game(game):
    # Quick hack shallow copy might not be enough
    # Implementing deep copy or just snapshotting critical data
    import copy
    return copy.deepcopy(game) # Slow but correct for MVP

def creates_box(game, edge_id):
    # Helper to see if a move closes a box
    zones = [z for z in game.layout.zones if edge_id in z.edge_ids]
    for z in zones:
        occupied = sum(1 for eid in z.edge_ids if eid in game.state.occupied_edges)
        if occupied == 3: return True
    return False

if __name__ == "__main__":
    episodes = 100000
    if len(sys.argv) > 1:
        episodes = int(sys.argv[1])
    train_agent(episodes)
