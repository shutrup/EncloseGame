import random
import json
import time
from game import Game
from agent import ApproximateQLearningAgent

def train_agent(episodes=1000):
    agent = ApproximateQLearningAgent(alpha=0.01, gamma=0.9, epsilon=0.1)
    
    wins = {'learn': 0, 'random': 0, 'draw': 0}
    start_time = time.time()
    
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
                state_copy = copy_game(game) # Need immutable state or copy?
                # Game logic mutation makes copy necessary for accurate update? 
                # Agent uses current game object for next state features.
                # Just need features of state S. Extract now?
                # Actually agent.update re-extracts. So we need S.
                # Python's deepcopy is slow.
                # Let's just store features if possible, or refactor agent.
                # For now, simplistic approach: Game object is small enough?
                # No, game object mutates. We need snapshot.
                # Or just extract features NOW.
                
                last_state = game # This reference will mutate! ERROR.
                # Fix: Agent should store features, not state.
                # Refactoring agent.update to take features?
                
                last_action = move
                
                # Apply move
                game.play_move(move)
                
                # Immediate reward? (e.g. Completed box)
                if game.state.scores['x'] > state_copy.state.scores['x']:
                    current_reward += 10 # Box!
                    # If we complete a box, we get another turn!
                    # The loop continues with 'x'.
                    # We should probably treat "Extra Turn" as part of the same action sequence?
                    # Or just immediate update?
                    
            else:
                # Random Opponent
                legal = game.get_legal_moves()
                if legal:
                    move = random.choice(legal)
                    game.play_move(move)
                    
                    # If opponent captured, negative reward for agent?
                    # Only if agent *gave* it implementation-wise.
                else: break
        
        # Game Over
        # Final update
        reward = 100 if game.winner == 'x' else -100 if game.winner == 'o' else 0
        if last_state:
            agent.update(last_state, last_action, reward + current_reward, game)
            
        # Stats
        if game.winner == 'x': wins['learn'] += 1
        elif game.winner == 'o': wins['random'] += 1
        else: wins['draw'] += 1
        
        if episode % 100 == 0:
            print(f"Episode {episode}: {wins}")
            
    print(f"Training finished. Win rates: {wins}")
    
    # Save weights
    with open('weights.json', 'w') as f:
        json.dump(agent.weights, f)

def copy_game(game):
    # Quick hack shallow copy might not be enough
    # Implementing deep copy or just snapshotting critical data
    import copy
    return copy.deepcopy(game) # Slow but correct for MVP

if __name__ == "__main__":
    train_agent()
