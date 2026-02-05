import SwiftUI

struct AppTheme {
    // Semantic Colors for Adaptive Theme
    static let background = Color(UIColor.systemBackground)
    static let surface = Color(UIColor.secondarySystemBackground)
    static let textPrimary = Color.primary
    static let textSecondary = Color.secondary
    static let accent = Color.accentColor
    
    // Game Specific - these need to work well in both modes
    // We can use Asset Catalog colors later, but for now let's use adaptive system colors or hardcoded values that work in both.
    // Blue and Red usually work well in dark/light.
    static let playerX = Color.blue
    static let playerO = Color.red
    
    // Lines and Grid need to adapt
    static let activeLine = Color.primary
    static let inactiveGrid = Color.secondary.opacity(0.3)
}

extension View {
    func appBackground() -> some View {
        self.background(AppTheme.background.ignoresSafeArea())
    }
}
