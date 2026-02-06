import SwiftUI

struct HomeView: View {
    var body: some View {
        NavigationStack {
            ZStack {
                AppTheme.background.ignoresSafeArea()
                
                VStack(spacing: 30) {
                    Spacer()
                    
                    // Hero / Title
                    VStack(spacing: 12) {
                        Image(systemName: "diamond.fill")
                            .font(.system(size: 60))
                            .foregroundStyle(AppTheme.accent)
                            .shadow(color: AppTheme.accent.opacity(0.5), radius: 20)
                        
                        Text("Enclose")
                            .font(.system(size: 48, weight: .heavy, design: .rounded))
                            .foregroundStyle(AppTheme.textPrimary)
                    }
                    
                    Spacer()
                    
                    // Buttons Section
                    VStack(spacing: 16) {
                        // Play Button -> Navigation
                        NavigationLink(destination: GameSetupView()) {
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
                        
                        // Rules Button
                        NavigationLink(destination: RulesView()) {
                            HStack {
                                Image(systemName: "book.fill")
                                Text(LocalizedStringKey("menu.rules"))
                            }
                            .font(.headline.weight(.bold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(AppTheme.surface)
                            .foregroundStyle(AppTheme.textPrimary)
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                            .shadow(color: Color.black.opacity(0.05), radius: 5, y: 2)
                        }
                        
                        // Settings Button
                        NavigationLink(destination: SettingsView()) {
                            HStack {
                                Image(systemName: "gearshape.fill")
                                Text(LocalizedStringKey("menu.settings"))
                            }
                            .font(.headline.weight(.bold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(AppTheme.surface)
                            .foregroundStyle(AppTheme.textPrimary)
                            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                            .shadow(color: Color.black.opacity(0.05), radius: 5, y: 2)
                        }
                    }
                    .padding(.horizontal, 40)
                    
                    Spacer()
                    
                    // Footer
                    Text("v1.0")
                        .font(.caption)
                        .foregroundStyle(AppTheme.textSecondary)
                }
            }
        }
        .tint(AppTheme.accent)
    }
}
