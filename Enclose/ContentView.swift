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

            BoardView(engine: engine)
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            Button("New Game") {
                engine.reset()
            }
        }
        .padding()
    }
}

#Preview {
    ContentView()
}
