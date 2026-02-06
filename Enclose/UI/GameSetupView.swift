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

        var summaryTitle: String {
            switch self {
            case .pvp: return NSLocalizedString("menu.pvp.short", comment: "PvP")
            case .ai: return NSLocalizedString("menu.single_player.short", comment: "Single")
            }
        }
    }
    
    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()
            
            VStack(spacing: 16) {
                sectionCard(title: LocalizedStringKey("menu.board.size"), icon: "square.grid.3x3.fill") {
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
                
                sectionCard(title: LocalizedStringKey("menu.mode"), icon: "person.2.fill") {
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
                
                if selectedMode == .ai {
                    sectionCard(title: LocalizedStringKey("menu.difficulty"), icon: "brain.head.profile") {
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
                
                setupSummaryCard
                
                Spacer(minLength: 0)
                
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
            .padding(.top, 16)
            .padding(.bottom, 20)
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

    private var setupSummaryCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(LocalizedStringKey("game_setup.summary"))
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(AppTheme.textSecondary)
            
            LazyVGrid(columns: summaryColumns, spacing: 8) {
                summaryTag(title: String(localized: "menu.board.size"), value: selectedSize.localizedName)
                summaryTag(title: String(localized: "menu.mode"), value: selectedMode.summaryTitle)
                if selectedMode == .ai {
                    summaryTag(title: String(localized: "menu.difficulty"), value: selectedDifficulty.localizedName)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(AppTheme.surface.opacity(0.75))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Color.primary.opacity(0.08), lineWidth: 1)
        )
    }

    private var summaryColumns: [GridItem] {
        [GridItem(.adaptive(minimum: 130), spacing: 8, alignment: .leading)]
    }

    private func sectionCard<Content: View>(
        title: LocalizedStringKey,
        icon: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Label {
                Text(title)
                    .font(.headline)
            } icon: {
                Image(systemName: icon)
                    .font(.subheadline.weight(.semibold))
            }
            .foregroundStyle(AppTheme.textSecondary)
            
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(AppTheme.surface.opacity(0.85))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(Color.primary.opacity(0.08), lineWidth: 1)
        )
    }

    private func summaryTag(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(title)
                .font(.caption2)
                .foregroundStyle(AppTheme.textSecondary)
            Text(value)
                .font(.caption2.weight(.semibold))
                .foregroundStyle(AppTheme.textPrimary)
                .lineLimit(2)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)
                .allowsTightening(true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(AppTheme.background.opacity(0.6))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}
