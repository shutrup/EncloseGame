import AVFoundation
import SwiftUI

enum Sound: String {
    case pop
    case capture
    case win = "win"
    case loss = "loss"
}

class SoundManager {
    static let shared = SoundManager()
    private var players: [String: AVAudioPlayer] = [:]
    
    init() {
        configureAudioSession()
        preload(sound: .pop)
        preload(sound: .capture)
        preload(sound: .win)
        preload(sound: .loss)
    }
    
    private func configureAudioSession() {
        do {
            // Using .ambient means it respects the silent switch.
            // If user wants sound even in silent mode, they can't. 
            // Usually games use .playback to override silent switch?
            // "Enclose" feels like a casual game, maybe .ambient is safer.
            // But if user complains "cannot hear", usually it's silent switch.
            // Let's use .ambient but ensure we log if it fails.
            try AVAudioSession.sharedInstance().setCategory(.ambient, options: .mixWithOthers)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Failed to configure audio session: \(error)")
        }
    }
    
    func play(_ sound: Sound) {
        // Check UserDefaults directly
        if UserDefaults.standard.bool(forKey: "soundEnabled") == false {
            return
        }
        
        guard let player = players[sound.rawValue] else { return }
        
        if player.isPlaying {
            player.stop()
            player.currentTime = 0
        }
        player.play()
    }
    
    private func preload(sound: Sound) {
        if let url = Bundle.main.url(forResource: sound.rawValue, withExtension: "mp3") {
            load(url: url, for: sound)
        } else if let url = Bundle.main.url(forResource: sound.rawValue, withExtension: "wav") {
            load(url: url, for: sound)
        } else {
             print("Sound file not found: \(sound.rawValue)")
        }
    }
    
    private func load(url: URL, for sound: Sound) {
        do {
            let player = try AVAudioPlayer(contentsOf: url)
            player.prepareToPlay()
            players[sound.rawValue] = player
        } catch {
            print("Failed to load sound: \(sound.rawValue), error: \(error)")
        }
    }
}
