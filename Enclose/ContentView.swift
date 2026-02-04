import SwiftUI

struct ContentView: View {
    @StateObject private var engine = GameEngine()

    var body: some View {
        VStack(spacing: 16) {
            HStack {
                Text("X: \(engine.state.scoreX)")
                Spacer()
                Text("O: \(engine.state.scoreO)")
            }
            .font(.headline)

            Text(engine.state.currentPlayer == .x ? "X Turn" : "O Turn")
                .font(.subheadline)
                .padding(.bottom, 4)

            BoardView(engine: engine)
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            Button("New Game") {
                engine.reset()
            }
        }
        .padding()
        .background(Color(.systemGroupedBackground))
    }
}

#Preview {
    ContentView()
}
