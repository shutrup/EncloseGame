import SwiftUI

struct GameView: View {
    @StateObject private var engine = GameEngine()
    
    @AppStorage("hapticsEnabled") private var hapticsEnabled = true
    @AppStorage("animationsEnabled") private var animationsEnabled = true
    @AppStorage("boardPreset") private var boardPresetRaw = BoardPreset.standard.rawValue
    
    @State private var showingNewGameSheet = false
    
    private var boardPreset: BoardPreset {
        get { BoardPreset(rawValue: boardPresetRaw) ?? .standard }
        set { boardPresetRaw = newValue.rawValue }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.background.ignoresSafeArea()

                VStack(spacing: 18) {
                    HStack {
                        ScorePill(
                            label: NSLocalizedString("score.x", comment: "X"),
                            score: engine.state.scoreX,
                            color: AppTheme.playerX,
                            isActive: engine.state.currentPlayer == .x
                        )
                        Spacer()
                        
                        // Turn Indicator / Thinking status
                        HStack(spacing: 6) {
                            if engine.isProcessingMove {
                                ProgressView()
                                    .controlSize(.mini)
                                    .tint(AppTheme.textPrimary)
                                Text(LocalizedStringKey("turn.ai"))
                                    .font(.subheadline)
                                    .foregroundStyle(AppTheme.textSecondary)
                            } else {
                                if let _ = engine.aiLevel, engine.state.currentPlayer == .o {
                                    Image(systemName: "brain.head.profile")
                                        .font(.caption)
                                        .foregroundStyle(AppTheme.textSecondary)
                                }
                                Text(LocalizedStringKey(engine.state.currentPlayer == .x ? "turn.x" : "turn.o"))
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(AppTheme.textPrimary)
                            }
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(AppTheme.surface)
                        .clipShape(Capsule())
                        
                        Spacer()
                        ScorePill(
                            label: NSLocalizedString("score.o", comment: "O"),
                            score: engine.state.scoreO,
                            color: AppTheme.playerO,
                            isActive: engine.state.currentPlayer == .o
                        )
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 10)

                    BoardView(
                        engine: engine,
                        hapticsEnabled: hapticsEnabled,
                        animationsEnabled: animationsEnabled
                    )
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding(.horizontal, 12)
                    .opacity(engine.isProcessingMove ? 0.7 : 1.0) // Dim slightly when AI thinks
                    .animation(.easeInOut(duration: 0.2), value: engine.isProcessingMove)
                }
                .padding(.top, 12)
            }
            .navigationTitle("Enclose")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingNewGameSheet = true
                    } label: {
                        Text("new_game")
                            .font(.headline)
                            .foregroundStyle(AppTheme.accent)
                    }
                    .disabled(engine.isProcessingMove) // Block new game while thinking
                }
                
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        engine.reset()
                    } label: {
                        Text("menu.refresh")
                            .font(.body)
                            .foregroundStyle(AppTheme.textSecondary)
                    }
                    .disabled(engine.isProcessingMove)
                }
            }
            .sheet(isPresented: $showingNewGameSheet) {
                NewGameSheet(engine: engine, isPresented: $showingNewGameSheet)
                    .presentationDetents([.medium])
            }
        }
        .onChange(of: boardPresetRaw) {
             engine.reset(preset: boardPreset)
        }
        .onChange(of: engine.state.currentPlayer) {
            handleAITurn(player: engine.state.currentPlayer)
        }
        .overlay {
            if engine.state.isGameOver {
                GameOverModal(engine: engine)
            }
        }
    }
    
    private func handleAITurn(player: Player) {
        // Updated: Engine manages the delay internally now via isProcessingMove
        // But we still need to Trigger the flow if not already triggered.
        // GameEngine.makeAIMove() handles the rest.
        if player == .o && engine.aiLevel != nil && !engine.state.isGameOver {
             engine.makeAIMove()
        }
    }
    
    private var winnerTitleKey: String {
        if engine.state.scoreX == engine.state.scoreO {
            return "winner.draw"
        }
        return engine.state.scoreX > engine.state.scoreO ? "winner.x" : "winner.o"
    }
}

// Subviews (NewGameSheet, GameOverModal, ScorePill) remain mostly same, updated for completeness
struct NewGameSheet: View {
    @ObservedObject var engine: GameEngine
    @Binding var isPresented: Bool
    
    var body: some View {
        NavigationStack {
            List {
                Section(String(localized: "menu.play")) {
                    Button {
                        engine.setAI(nil)
                        engine.reset()
                        isPresented = false
                    } label: {
                        Label(String(localized: "menu.pvp"), systemImage: "person.2")
                    }
                }
                
                Section(String(localized: "menu.single_player")) {
                    Button {
                        engine.setAI(.easy)
                        engine.reset()
                        isPresented = false
                    } label: {
                        Label(String(localized: "difficulty.easy"), systemImage: "ant")
                    }
                    Button {
                        engine.setAI(.medium)
                        engine.reset()
                        isPresented = false
                    } label: {
                        Label(String(localized: "difficulty.medium"), systemImage: "hare")
                    }
                }
            }
            .navigationTitle("new_game")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { isPresented = false }
                }
            }
        }
    }
}

private struct GameOverModal: View {
    @ObservedObject var engine: GameEngine
    @State private var animateIn = false
    
    var body: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()
                .transition(.opacity)

            VStack(spacing: 20) {
                Spacer().frame(height: 8)
                
                VStack(spacing: 8) {
                    Image(systemName: "trophy.fill")
                        .font(.system(size: 40))
                        .foregroundStyle(Color.yellow)
                        .shadow(color: .orange.opacity(0.5), radius: 10)
                    
                    Text(LocalizedStringKey(winnerTitleKey))
                        .font(.title2.weight(.bold))
                        .multilineTextAlignment(.center)
                        .foregroundStyle(Color.primary)
                }

                Divider()
                    .background(Color.primary.opacity(0.1))

                VStack(spacing: 4) {
                    let xLabel = NSLocalizedString("score.x", comment: "X")
                    let oLabel = NSLocalizedString("score.o", comment: "O")
                    
                    Text("\(engine.state.scoreX) — \(engine.state.scoreO)")
                        .font(.system(size: 32, weight: .heavy, design: .rounded))
                        .foregroundStyle(Color.primary)
                    
                    HStack(spacing: 4) {
                        Text(xLabel).foregroundStyle(AppTheme.playerX)
                        Text("vs")
                            .font(.caption)
                            .foregroundStyle(Color.secondary)
                        Text(oLabel).foregroundStyle(AppTheme.playerO)
                    }
                    .font(.caption.weight(.bold))
                }

                Spacer().frame(height: 8)

                Button {
                    withAnimation {
                        engine.reset()
                    }
                } label: {
                    Text("play_again")
                        .font(.headline)
                        .foregroundStyle(Color.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(
                            LinearGradient(
                                colors: [AppTheme.accent, AppTheme.accent.opacity(0.8)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                        .shadow(color: AppTheme.accent.opacity(0.3), radius: 8, x: 0, y: 4)
                }
                .padding(.horizontal, 8)
            }
            .padding(24)
            .background(.regularMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            .shadow(color: Color.black.opacity(0.15), radius: 30, x: 0, y: 15)
            .padding(.horizontal, 40)
            .scaleEffect(animateIn ? 1.0 : 0.9)
            .opacity(animateIn ? 1.0 : 0.0)
            .animation(.spring(response: 0.5, dampingFraction: 0.7), value: animateIn)
        }
        .onAppear {
            animateIn = true
            SoundManager.shared.play(.win)
        }
    }
    
    private var winnerTitleKey: String {
        if engine.state.scoreX == engine.state.scoreO {
            return "winner.draw"
        }
        return engine.state.scoreX > engine.state.scoreO ? "winner.x" : "winner.o"
    }
}

private struct ScorePill: View {
    let label: String
    let score: Int
    let color: Color
    let isActive: Bool

    init(label: String, score: Int, color: Color, isActive: Bool = false) {
        self.label = label
        self.score = score
        self.color = color
        self.isActive = isActive
    }

    var body: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
                .opacity(isActive ? 1.0 : 0.5)
            Text("\(label): \(score)")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(AppTheme.textPrimary.opacity(isActive ? 1.0 : 0.6))
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(AppTheme.surface) 
        .overlay(
            Capsule()
                .stroke(isActive ? color.opacity(0.5) : Color.primary.opacity(0.05), lineWidth: 1)
        )
        .clipShape(Capsule())
        .scaleEffect(isActive ? 1.05 : 1.0)
        .animation(.spring(response: 0.3), value: isActive)
    }
}
