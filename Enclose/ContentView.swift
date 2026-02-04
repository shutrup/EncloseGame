import SwiftUI

struct ContentView: View {
    @StateObject private var engine = GameEngine()
    @AppStorage("hapticsEnabled") private var hapticsEnabled = true
    @AppStorage("animationsEnabled") private var animationsEnabled = true
    @State private var showHowToPlay = true
    @State private var showSettings = false

    var body: some View {
        ZStack {
            Color.white.ignoresSafeArea()

            VStack(spacing: 18) {
                HStack {
                    ScorePill(label: "X", score: engine.state.scoreX, color: Color(red: 0.12, green: 0.40, blue: 0.80))
                    Spacer()
                    Text(engine.state.currentPlayer == .x ? "X Turn" : "O Turn")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Color.black.opacity(0.85))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.black.opacity(0.06))
                        .clipShape(Capsule())
                    Spacer()
                    ScorePill(label: "O", score: engine.state.scoreO, color: Color(red: 0.78, green: 0.18, blue: 0.18))
                    Button {
                        showSettings = true
                    } label: {
                        Image(systemName: "gearshape")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(Color.black.opacity(0.7))
                            .padding(10)
                            .background(Color.black.opacity(0.05))
                            .clipShape(Circle())
                    }
                }
                .padding(.horizontal, 12)
                .padding(.top, 6)

                BoardView(
                    engine: engine,
                    hapticsEnabled: hapticsEnabled,
                    animationsEnabled: animationsEnabled
                )
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding(.horizontal, 12)

                Button {
                    engine.reset()
                } label: {
                    Text("New Game")
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(Color.black.opacity(0.9))
                        .padding(.horizontal, 22)
                        .padding(.vertical, 12)
                        .background(Color.black.opacity(0.06))
                        .overlay(
                            Capsule()
                                .stroke(Color.black.opacity(0.18), lineWidth: 1)
                        )
                        .clipShape(Capsule())
                }
                .padding(.bottom, 16)
            }
            .padding(.top, 12)

            if engine.state.isGameOver {
                Color.black.opacity(0.08)
                    .ignoresSafeArea()

                VStack(spacing: 12) {
                    Text(winnerTitle)
                        .font(.title2.weight(.semibold))
                        .foregroundStyle(Color.black.opacity(0.92))

                    Text("X \(engine.state.scoreX) — \(engine.state.scoreO) O")
                        .font(.callout.weight(.medium))
                        .foregroundStyle(Color.black.opacity(0.55))

                    Button {
                        engine.reset()
                    } label: {
                        Text("Play Again")
                            .font(.headline.weight(.semibold))
                            .foregroundStyle(Color.black.opacity(0.9))
                            .padding(.horizontal, 22)
                            .padding(.vertical, 12)
                            .background(Color.black.opacity(0.08))
                            .overlay(
                                Capsule()
                                    .stroke(Color.black.opacity(0.20), lineWidth: 1)
                            )
                            .clipShape(Capsule())
                    }
                    .padding(.top, 6)
                }
                .padding(.horizontal, 26)
                .padding(.vertical, 22)
                .background(
                    LinearGradient(
                        colors: [Color.white, Color(red: 0.97, green: 0.97, blue: 0.98)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.black.opacity(0.14), lineWidth: 1)
                )
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.16), radius: 18, x: 0, y: 10)
                .padding(.horizontal, 28)
            }

            if showHowToPlay && !engine.state.isGameOver {
                VStack(spacing: 8) {
                    Text("Draw one line")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Color.black.opacity(0.85))
                    Text("Close a square to claim it")
                        .font(.caption)
                        .foregroundStyle(Color.black.opacity(0.6))
                    Text("Claiming gives an extra turn")
                        .font(.caption)
                        .foregroundStyle(Color.black.opacity(0.6))

                    Button {
                        if animationsEnabled {
                            withAnimation(.easeOut(duration: 0.2)) {
                                showHowToPlay = false
                            }
                        } else {
                            showHowToPlay = false
                        }
                    } label: {
                        Text("Got it")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(Color.black.opacity(0.85))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 6)
                            .background(Color.black.opacity(0.06))
                            .overlay(
                                Capsule()
                                    .stroke(Color.black.opacity(0.18), lineWidth: 1)
                            )
                            .clipShape(Capsule())
                    }
                    .padding(.top, 4)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 14)
                .background(Color.white)
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(Color.black.opacity(0.12), lineWidth: 1)
                )
                .cornerRadius(14)
                .shadow(color: Color.black.opacity(0.1), radius: 12, x: 0, y: 6)
                .padding(.horizontal, 28)
                .transition(.opacity.combined(with: .scale))
            }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView(
                hapticsEnabled: $hapticsEnabled,
                animationsEnabled: $animationsEnabled,
                showHowToPlay: $showHowToPlay
            )
        }
    }

    private var winnerTitle: String {
        if engine.state.scoreX == engine.state.scoreO {
            return "Draw"
        }
        return engine.state.scoreX > engine.state.scoreO ? "X Wins" : "O Wins"
    }
}

#Preview {
    ContentView()
}

private struct SettingsView: View {
    @Binding var hapticsEnabled: Bool
    @Binding var animationsEnabled: Bool
    @Binding var showHowToPlay: Bool
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Feedback") {
                    Toggle("Haptics", isOn: $hapticsEnabled)
                    Toggle("Animations", isOn: $animationsEnabled)
                }

                Section("Help") {
                    Button("Show Tutorial") {
                        showHowToPlay = true
                        dismiss()
                    }
                }
            }
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}

private struct ScorePill: View {
    let label: String
    let score: Int
    let color: Color

    var body: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            Text("\(label): \(score)")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Color.black.opacity(0.9))
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.black.opacity(0.04))
        .overlay(
            Capsule()
                .stroke(Color.black.opacity(0.14), lineWidth: 1)
        )
        .clipShape(Capsule())
    }
}
