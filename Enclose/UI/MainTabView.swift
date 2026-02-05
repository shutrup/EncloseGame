import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            GameView()
                .tabItem {
                    Label(String(localized: "menu.play"), systemImage: "gamecontroller.fill")
                }
            
            RulesView()
                .tabItem {
                    Label(String(localized: "menu.help"), systemImage: "book.fill")
                }
            
            SettingsView()
                .tabItem {
                    Label(String(localized: "menu.settings"), systemImage: "gearshape.fill")
                }
        }
        .tint(AppTheme.accent) // Use accent color (Blue)
    }
}
