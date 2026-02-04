import SwiftUI

struct ContentView: View {
    @StateObject private var engine = GameEngine()

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
                }
                .padding(.horizontal, 12)
                .padding(.top, 6)

                BoardView(engine: engine)
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
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(Color.black.opacity(0.9))

                    Text("X \(engine.state.scoreX) — \(engine.state.scoreO) O")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(Color.black.opacity(0.6))

                    Button {
                        engine.reset()
                    } label: {
                        Text("Play Again")
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
                    .padding(.top, 6)
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 20)
                .background(Color.white)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.black.opacity(0.12), lineWidth: 1)
                )
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.12), radius: 16, x: 0, y: 8)
                .padding(.horizontal, 28)
            }
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
