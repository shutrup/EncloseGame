import SwiftUI

struct Particle: Identifiable {
    let id = UUID()
    var position: CGPoint
    var velocity: CGPoint
    var opacity: Double = 1.0
    var scale: Double = 1.0
    var color: Color
}

struct ParticleView: View {
    @Binding var trigger: CGPoint? // Trigger point
    @Binding var color: Color
    
    @State private var particles: [Particle] = []
    
    var body: some View {
        TimelineView(.animation) { timeline in
            Canvas { context, size in
                for particle in particles {
                    var pContext = context
                    pContext.opacity = particle.opacity
                    pContext.fill(
                        Path(ellipseIn: CGRect(x: particle.position.x - 4, y: particle.position.y - 4, width: 8, height: 8)),
                        with: .color(particle.color)
                    )
                }
            }
            .onChange(of: timeline.date) { _ in
                updateParticles()
            }
            .onChange(of: trigger) { point in
                if let point = point {
                    spawnParticles(at: point)
                }
            }
        }
        .allowsHitTesting(false)
    }
    
    private func spawnParticles(at point: CGPoint) {
        for _ in 0..<12 {
            let angle = Double.random(in: 0..<2 * .pi)
            let speed = Double.random(in: 2...6)
            let velocity = CGPoint(x: cos(angle) * speed, y: sin(angle) * speed)
            let particle = Particle(
                position: point,
                velocity: velocity,
                color: color
            )
            particles.append(particle)
        }
    }
    
    private func updateParticles() {
        for i in particles.indices {
            particles[i].position.x += particles[i].velocity.x
            particles[i].position.y += particles[i].velocity.y
            particles[i].opacity -= 0.02
            particles[i].scale -= 0.01
        }
        particles.removeAll { $0.opacity <= 0 }
    }
}
