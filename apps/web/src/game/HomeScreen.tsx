import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useTelegramMainButton } from '../hooks/useTelegram';

export function HomeScreen() {
    const { goToSetup, openRules, openSettings } = useGameStore();

    // useTelegramMainButton('Играть', goToSetup);

    return (
        <div className="flex min-h-dvh flex-col items-center justify-center px-6">
            {/* Hero */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-12 flex flex-col items-center"
            >
                <div className="relative mb-4">
                    <div className="absolute inset-0 rounded-full bg-accent/30 blur-3xl" />
                    <svg
                        className="relative h-24 w-24"
                        viewBox="0 0 100 100"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <rect
                            x="20"
                            y="20"
                            width="60"
                            height="60"
                            rx="8"
                            stroke="currentColor"
                            strokeWidth="6"
                            className="text-accent"
                        />
                        <circle cx="20" cy="20" r="5" className="fill-white" />
                        <circle cx="80" cy="20" r="5" className="fill-white" />
                        <circle cx="20" cy="80" r="5" className="fill-white" />
                        <circle cx="80" cy="80" r="5" className="fill-white" />
                    </svg>
                </div>
                <h1 className="text-6xl font-black tracking-tight">Enclose</h1>
            </motion.div>

            {/* Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="flex w-full max-w-xs flex-col gap-4"
            >
                <button
                    type="button"
                    onClick={goToSetup}
                    className="w-full rounded-full bg-gradient-to-r from-accent to-sky-500 px-6 py-5 text-2xl font-black text-white shadow-glow transition active:scale-[0.98]"
                >
                    Играть
                </button>


                <button
                    type="button"
                    onClick={openRules}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-panel px-6 py-4 text-lg font-bold transition active:scale-[0.98]"
                >
                    <span>📖</span>
                    <span>Правила</span>
                </button>

                <button
                    type="button"
                    onClick={openSettings}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-panel px-6 py-4 text-lg font-bold transition active:scale-[0.98]"
                >
                    <span>⚙️</span>
                    <span>Настройки</span>
                </button>
            </motion.div>

            {/* Footer */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-6 text-sm text-white/50"
            >
                v1.0
            </motion.p>
        </div>
    );
}
