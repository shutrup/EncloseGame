import SwiftUI

struct RulesView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                RuleItem(
                    number: "1",
                    title: String(localized: "rules.title1"),
                    description: String(localized: "rules.desc1"),
                    icon: "pencil.line",
                    color: Color.blue
                )
                
                RuleItem(
                    number: "2",
                    title: String(localized: "rules.title2"),
                    description: String(localized: "rules.desc2"),
                    icon: "square.dashed",
                    color: Color.purple
                )
                
                RuleItem(
                    number: "3",
                    title: String(localized: "rules.title3"),
                    description: String(localized: "rules.desc3"),
                    icon: "arrow.triangle.2.circlepath",
                    color: Color.green
                )
                
                RuleItem(
                    number: "4",
                    title: String(localized: "rules.title4"),
                    description: String(localized: "rules.desc4"),
                    icon: "trophy.fill",
                    color: Color.orange
                )
            }
            .padding()
        }
        .background(Color(UIColor.systemGroupedBackground))
        .navigationTitle(String(localized: "menu.rules"))
    }
}

private struct RuleItem: View {
    let number: String
    let title: String
    let description: String
    let icon: String
    let color: Color
    
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            ZStack {
                Circle()
                    .fill(color.opacity(0.1))
                    .frame(width: 44, height: 44)
                
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundStyle(color)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(.primary)
                
                Text(description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground)) // Adaptive card background
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}
