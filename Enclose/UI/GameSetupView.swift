import SwiftUI

struct GameSetupView: View {
    @State private var selectedMode: GameMode = .pvp
    @State private var selectedDifficulty: AILevel = .easy
    @State private var selectedSize: BoardPreset = .standard
    @State private var navigateToGame = false
    @State private var gameEngine: GameEngine?
    
    enum GameMode: String, CaseIterable, Identifiable {
        case pvp
        case ai
        var id: String { rawValue }
        
        var localizedName: String {
            switch self {
            case .pvp: return NSLocalizedString("menu.pvp", comment: "PvP")
            case .ai: return NSLocalizedString("menu.single_player", comment: "AI")
            }
        }

        var segmentTitle: String {
            switch self {
            case .pvp: return NSLocalizedString("menu.pvp.short", comment: "PvP")
            case .ai: return NSLocalizedString("menu.single_player", comment: "AI")
            }
        }
    }
    
    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()
            
            VStack(spacing: 24) {
                // Size Selection
                VStack(alignment: .leading, spacing: 12) {
                    Text(LocalizedStringKey("menu.board.size"))
                        .font(.headline)
                        .foregroundStyle(AppTheme.textSecondary)
                    
                    Picker(String(localized: "menu.board.size"), selection: $selectedSize) {
                        ForEach(BoardPreset.allCases) { preset in
                            Text(preset.localizedName)
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                                .tag(preset)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                
                // Mode Selection
                VStack(alignment: .leading, spacing: 12) {
                    Text(String(localized: "menu.mode"))
                        .font(.headline)
                        .foregroundStyle(AppTheme.textSecondary)
                    
                    Picker(String(localized: "menu.mode"), selection: $selectedMode) {
                        ForEach(GameMode.allCases) { mode in
                            Text(mode.segmentTitle)
                                .lineLimit(1)
                                .minimumScaleFactor(0.75)
                                .tag(mode)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                
                // Difficulty (only for AI mode)
                if selectedMode == .ai {
                    VStack(alignment: .leading, spacing: 12) {
                        Text(LocalizedStringKey("menu.difficulty"))
                            .font(.headline)
                            .foregroundStyle(AppTheme.textSecondary)
                        
                        Picker(String(localized: "menu.difficulty"), selection: $selectedDifficulty) {
                            ForEach(AILevel.allCases) { level in
                                Text(level.localizedName)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.75)
                                    .tag(level)
                            }
                        }
                        .pickerStyle(.segmented)
                    }
                    .transition(.opacity.combined(with: .move(edge: .top)))
                }
                
                Spacer()
                
                // Start Button
                Button {
                    let engine = GameEngine(
                        preset: selectedSize,
                        aiLevel: selectedMode == .ai ? selectedDifficulty : nil
                    )
                    gameEngine = engine
                    navigateToGame = true
                } label: {
                    Text(LocalizedStringKey("menu.play"))
                        .font(.title2.weight(.bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 18)
                        .background(
                            LinearGradient(
                                colors: [AppTheme.accent, AppTheme.accent.opacity(0.8)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .clipShape(Capsule())
                        .shadow(color: AppTheme.accent.opacity(0.4), radius: 10, y: 5)
                }
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 20)
        }
        .navigationTitle(String(localized: "game_setup.title"))
        .navigationBarTitleDisplayMode(.inline)
        .animation(.easeInOut(duration: 0.25), value: selectedMode)
        .navigationDestination(isPresented: $navigateToGame) {
            if let engine = gameEngine {
                GameView(engine: engine)
            }
        }
    }
}
