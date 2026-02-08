type SoundType = 'pop' | 'capture' | 'win';

interface SoundConfig {
    frequency: number;
    duration: number;
    type: OscillatorType;
    gain: number;
    rampDown?: boolean;
}

const SOUNDS: Record<SoundType, SoundConfig> = {
    pop: {
        frequency: 600,
        duration: 0.08,
        type: 'sine',
        gain: 0.25,
        rampDown: true
    },
    capture: {
        frequency: 880,
        duration: 0.15,
        type: 'sine',
        gain: 0.35,
        rampDown: true
    },
    win: {
        frequency: 523.25, // C5
        duration: 0.4,
        type: 'triangle',
        gain: 0.3,
        rampDown: true
    }
};

class SoundManager {
    private audioContext: AudioContext | null = null;
    private enabled = true;

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    play(sound: SoundType): void {
        if (!this.enabled) return;

        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        }

        const config = SOUNDS[sound];
        const ctx = this.audioContext;

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = config.type;
        oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);

        // For win sound, play a chord sequence
        if (sound === 'win') {
            oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
            oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
        }

        gainNode.gain.setValueAtTime(config.gain, ctx.currentTime);

        if (config.rampDown) {
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration);
        }

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + config.duration);
    }

    playCapture(): void {
        this.play('capture');
    }

    playPop(): void {
        this.play('pop');
    }

    playWin(): void {
        this.play('win');
    }
}

export const soundManager = new SoundManager();
