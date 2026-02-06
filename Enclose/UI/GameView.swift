import SwiftUI
import UIKit

struct GameView: View {
    @StateObject var engine: GameEngine
    
    init(engine: GameEngine = GameEngine()) {
        _engine = StateObject(wrappedValue: engine)
    }
    
    @AppStorage("hapticsEnabled") private var hapticsEnabled = true
    @AppStorage("animationsEnabled") private var animationsEnabled = true
    @AppStorage("captureHintsEnabled") private var captureHintsEnabled = true
    
    @State private var showingNewGameSheet = false
    @State private var turnBadgeScale: CGFloat = 1.0
    @State private var previousPlayer: Player?
    private let turnChangeHaptic = UIImpactFeedbackGenerator(style: .light)
    
    var body: some View {
        GeometryReader { proxy in
            let availableHeight = proxy.size.height
            let boardStageHeight = min(max(availableHeight * 0.58, 280), 520)

            ZStack {
                AppTheme.background.ignoresSafeArea()
                
                VStack(spacing: 14) {
                    HStack {
                        ScorePill(
                            label: NSLocalizedString("score.x", comment: "X"),
                            score: engine.state.scoreX,
                            color: AppTheme.playerX,
                            isActive: engine.state.currentPlayer == .x
                        )
                        Spacer()
                        ScorePill(
                            label: NSLocalizedString("score.o", comment: "O"),
                            score: engine.state.scoreO,
                            color: AppTheme.playerO,
                            isActive: engine.state.currentPlayer == .o
                        )
                    }
                    
                    turnStatusPill
                    
                    boardStage(height: boardStageHeight)
                    
                    HStack(spacing: 10) {
                        StatPill(
                            icon: "line.3.horizontal",
                            title: String(localized: "game.stat.edges"),
                            value: "\(engine.state.occupiedEdges.count)/\(engine.board.edges.count)"
                        )
                        StatPill(
                            icon: "square.grid.3x3.fill",
                            title: String(localized: "game.stat.zones"),
                            value: "\(engine.state.scoreX + engine.state.scoreO)/\(engine.state.zones.count)"
                        )
                        StatPill(
                            icon: engine.aiLevel == nil ? "person.2.fill" : "brain.head.profile",
                            title: String(localized: "menu.mode"),
                            value: engine.aiLevel == nil ? String(localized: "menu.pvp.short") : String(localized: "menu.single_player.short")
                        )
                    }
                    .frame(maxWidth: .infinity)
                    
                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 10)
            }
        }
        .navigationTitle("Enclose")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showingNewGameSheet = true
                } label: {
                    Text(LocalizedStringKey("new_game"))
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(AppTheme.accent)
                }
                .disabled(engine.isProcessingMove)
            }

            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink {
                    RulesView()
                } label: {
                    Image(systemName: "questionmark.circle")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(AppTheme.textSecondary)
                }
                .disabled(engine.isProcessingMove)
            }
            
            ToolbarItem(placement: .topBarLeading) {
                Button {
                    engine.reset()
                } label: {
                    Text(LocalizedStringKey("menu.refresh"))
                        .font(.subheadline)
                        .foregroundStyle(AppTheme.textSecondary)
                }
                .disabled(engine.isProcessingMove)
            }
        }
        .sheet(isPresented: $showingNewGameSheet) {
            NewGameSheet(engine: engine, isPresented: $showingNewGameSheet)
                .presentationDetents([.medium])
        }
        .onAppear {
            previousPlayer = engine.state.currentPlayer
        }
        .onChange(of: engine.state.currentPlayer) {
            handleAITurn(player: engine.state.currentPlayer)
            animateTurnChange(to: engine.state.currentPlayer)
        }
        .overlay {
            if engine.state.isGameOver {
                GameOverModal(engine: engine)
            }
        }
    }

    @ViewBuilder
    private var turnStatusPill: some View {
        HStack(spacing: 8) {
            if engine.isProcessingMove {
                ProgressView()
                    .controlSize(.mini)
                    .tint(AppTheme.textPrimary)
                Text(LocalizedStringKey("turn.ai"))
                    .font(.subheadline)
                    .foregroundStyle(AppTheme.textSecondary)
            } else {
                if engine.aiLevel != nil, engine.state.currentPlayer == .o {
                    Image(systemName: "brain.head.profile")
                        .font(.caption)
                        .foregroundStyle(AppTheme.textSecondary)
                }
                Text(LocalizedStringKey(engine.state.currentPlayer == .x ? "turn.x" : "turn.o"))
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(AppTheme.textPrimary)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity)
        .background(AppTheme.surface.opacity(0.9))
        .overlay(
            Capsule()
                .stroke(Color.primary.opacity(0.08), lineWidth: 1)
        )
        .clipShape(Capsule())
        .scaleEffect(turnBadgeScale)
    }

    private func boardStage(height: CGFloat) -> some View {
        GeometryReader { stageProxy in
            let side = min(stageProxy.size.width - 26, stageProxy.size.height - 20)

            ZStack {
                RoundedRectangle(cornerRadius: 26, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                AppTheme.surface.opacity(0.95),
                                AppTheme.background.opacity(0.9)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                Circle()
                    .fill(AppTheme.accent.opacity(0.18))
                    .blur(radius: 70)
                    .frame(width: side * 0.9, height: side * 0.9)

                BoardView(
                    engine: engine,
                    hapticsEnabled: hapticsEnabled,
                    animationsEnabled: animationsEnabled,
                    showCaptureHints: shouldShowCaptureHints
                )
                .aspectRatio(1, contentMode: .fit)
                .frame(width: side, height: side)
            }
            .overlay(
                RoundedRectangle(cornerRadius: 26, style: .continuous)
                    .stroke(Color.primary.opacity(0.14), lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(0.22), radius: 14, y: 8)
            .opacity(engine.isProcessingMove ? 0.7 : 1.0)
            .animation(.easeInOut(duration: 0.2), value: engine.isProcessingMove)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        }
        .frame(height: height)
    }
    
    private func handleAITurn(player: Player) {
        // Updated: Engine manages the delay internally now via isProcessingMove
        // But we still need to Trigger the flow if not already triggered.
        // GameEngine.makeAIMove() handles the rest.
        if player == .o && engine.aiLevel != nil && !engine.state.isGameOver {
            engine.makeAIMove()
        }
    }

    private func animateTurnChange(to newPlayer: Player) {
        guard let oldPlayer = previousPlayer else {
            previousPlayer = newPlayer
            return
        }
        guard oldPlayer != newPlayer else { return }
        previousPlayer = newPlayer
        
        withAnimation(.spring(response: 0.22, dampingFraction: 0.55)) {
            turnBadgeScale = 1.05
        }
        withAnimation(.spring(response: 0.28, dampingFraction: 0.8).delay(0.08)) {
            turnBadgeScale = 1.0
        }
        
        if hapticsEnabled {
            turnChangeHaptic.impactOccurred(intensity: 0.55)
        }
    }

    private var shouldShowCaptureHints: Bool {
        guard captureHintsEnabled else { return false }
        guard !engine.state.isGameOver else { return false }
        guard !engine.isProcessingMove else { return false }
        // In single-player mode we only hint during human turns.
        if engine.aiLevel != nil && engine.state.currentPlayer == .o {
            return false
        }
        return true
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
                    
                    Button {
                        engine.setAI(.hard)
                        engine.reset()
                        isPresented = false
                    } label: {
                        Label(String(localized: "difficulty.hard"), systemImage: "flag")
                    }
                }
            }
            .navigationTitle(String(localized: "new_game"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(String(localized: "cancel")) { isPresented = false }
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
                        Text(LocalizedStringKey("common.vs"))
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

private struct StatPill: View {
    let icon: String
    let title: String
    let value: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption2)
                Text(title)
                    .font(.caption2)
            }
            .foregroundStyle(AppTheme.textSecondary)
            
            Text(value)
                .font(.caption.weight(.semibold))
                .foregroundStyle(AppTheme.textPrimary)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(AppTheme.surface.opacity(0.86))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(Color.primary.opacity(0.07), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}
