import SwiftUI

struct SettingsView: View {
    @AppStorage("hapticsEnabled") private var hapticsEnabled = true
    @AppStorage("animationsEnabled") private var animationsEnabled = true
    @AppStorage("soundEnabled") private var soundEnabled = true
    @AppStorage("boardPreset") private var boardPresetRaw = BoardPreset.standard.rawValue
    
    var body: some View {
        NavigationStack {
            Form {
                Section(String(localized: "menu.board.size")) {
                    Picker(String(localized: "menu.board.size"), selection: $boardPresetRaw) {
                        Text(String(localized: "menu.board.mini")).tag(BoardPreset.mini.rawValue)
                        Text(String(localized: "menu.board.standard")).tag(BoardPreset.standard.rawValue)
                        Text(String(localized: "menu.board.large")).tag(BoardPreset.large.rawValue)
                    }
                    .pickerStyle(.segmented)
                }

                Section(String(localized: "menu.feedback")) {
                    Toggle(String(localized: "menu.sound"), isOn: $soundEnabled)
                    Toggle(String(localized: "menu.haptics"), isOn: $hapticsEnabled)
                    Toggle(String(localized: "menu.animations"), isOn: $animationsEnabled)
                }
                
                Section(String(localized: "menu.about")) {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0")
                            .foregroundStyle(.secondary)
                    }
                    HStack {
                        Text("Designed by")
                        Spacer()
                        Text("You")
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle(String(localized: "menu.settings"))
        }
    }
}
