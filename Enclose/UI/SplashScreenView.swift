import SwiftUI

struct SplashScreenView: View {
    @State private var isActive = false
    @State private var lineProgress: CGFloat = 0.0
    @State private var opacity = 0.0
    @State private var scale = 0.8
    
    var body: some View {
        if isActive {
            MainTabView()
        } else {
            ZStack {
                AppTheme.background.ignoresSafeArea()
                
                VStack(spacing: 0) {
                    ZStack {
                        // Background glow
                        Circle()
                            .fill(Color.blue.opacity(0.1))
                            .frame(width: 140, height: 140)
                            .blur(radius: 30)
                        
                        // Icon construction
                        GeometryReader { geo in
                            let center = CGPoint(x: geo.size.width / 2, y: geo.size.height / 2)
                            let size: CGFloat = 60
                            
                            Path { path in
                                path.move(to: CGPoint(x: center.x - size/2, y: center.y - size/2))
                                path.addLine(to: CGPoint(x: center.x + size/2, y: center.y - size/2))
                                path.addLine(to: CGPoint(x: center.x + size/2, y: center.y + size/2))
                                path.addLine(to: CGPoint(x: center.x - size/2, y: center.y + size/2))
                                path.closeSubpath()
                            }
                            .trim(from: 0, to: lineProgress)
                            .stroke(AppTheme.playerX, style: StrokeStyle(lineWidth: 4, lineCap: .round, lineJoin: .round))
                            
                            ForEach(0..<4) { i in
                                let x = (i == 0 || i == 3) ? -1.0 : 1.0
                                let y = (i == 0 || i == 1) ? -1.0 : 1.0
                                
                                Circle()
                                    .fill(AppTheme.textPrimary)
                                    .frame(width: 8, height: 8)
                                    .position(x: center.x + CGFloat(x) * size/2, y: center.y + CGFloat(y) * size/2)
                                    .scaleEffect(lineProgress > Double(i) * 0.25 ? 1.0 : 0.0)
                            }
                        }
                        .frame(width: 100, height: 100)
                    }
                    
                    Text("Enclose")
                        .font(.system(size: 42, weight: .bold, design: .rounded))
                        .foregroundStyle(AppTheme.textPrimary)
                        .padding(.top, 40)
                        .opacity(opacity)
                        .scaleEffect(scale)
                }
            }
            .onAppear {
                withAnimation(.easeInOut(duration: 1.5)) {
                    lineProgress = 1.0
                }
                
                withAnimation(.easeOut(duration: 1.0).delay(0.5)) {
                    opacity = 1.0
                    scale = 1.0
                }
                
                DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                    withAnimation {
                        isActive = true
                    }
                }
            }
        }
    }
}
