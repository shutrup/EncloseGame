//
//  EncloseApp.swift
//  Enclose
//
//  Created by Шарап Бамматов on 04.02.2026.
//

import SwiftUI

@main
struct EncloseApp: App {
    init() {
        UserDefaults.standard.register(defaults: [
            "soundEnabled": true,
            "hapticsEnabled": true,
            "animationsEnabled": true,
            "captureHintsEnabled": true,
            "highContrastMarksEnabled": true
        ])
    }

    var body: some Scene {
        WindowGroup {
            SplashScreenView()
        }
    }
}
