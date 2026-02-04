import SwiftUI

struct ContentView: View {
    @StateObject private var engine = GameEngine()

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(red: 0.04, green: 0.05, blue: 0.07), Color(red: 0.02, green: 0.02, blue: 0.03)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            VStack(spacing: 18) {
                HStack {
                    ScorePill(label: "X", score: engine.state.scoreX, color: Color(red: 0.29, green: 0.64, blue: 1.0))
                    Spacer()
                    Text(engine.state.currentPlayer == .x ? "X Turn" : "O Turn")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Color.white.opacity(0.85))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.white.opacity(0.06))
                        .clipShape(Capsule())
                    Spacer()
                    ScorePill(label: "O", score: engine.state.scoreO, color: Color(red: 1.0, green: 0.42, blue: 0.36))
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
                        .foregroundStyle(Color.white.opacity(0.9))
                        .padding(.horizontal, 22)
                        .padding(.vertical, 12)
                        .background(Color.white.opacity(0.08))
                        .overlay(
                            Capsule()
                                .stroke(Color.white.opacity(0.18), lineWidth: 1)
                        )
                        .clipShape(Capsule())
                }
                .padding(.bottom, 16)
            }
            .padding(.top, 12)
        }
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
                .foregroundStyle(Color.white.opacity(0.9))
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.white.opacity(0.06))
        .overlay(
            Capsule()
                .stroke(Color.white.opacity(0.14), lineWidth: 1)
        )
        .clipShape(Capsule())
    }
}
