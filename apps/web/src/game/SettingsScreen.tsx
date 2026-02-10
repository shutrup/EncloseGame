import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useI18n, type Locale } from '../store/i18n';
import { useTelegramBackButton } from '../hooks/useTelegram';

export function SettingsScreen() {
    const {
        soundEnabled,
        setSoundEnabled,
        animationsEnabled,
        setAnimationsEnabled,
        hintsEnabled,
        setHintsEnabled,
        closeSettings
    } = useGameStore();

    const { locale, setLocale, t } = useI18n();

    useTelegramBackButton(closeSettings);

    return (
        <div className="flex min-h-dvh flex-col px-4 pb-6 pt-4">
            <header className="mb-6 flex items-center justify-between relative">
                <button
                    type="button"
                    onClick={closeSettings}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-2xl text-white transition active:bg-white/10"
                >
                    ‹
                </button>
                <h1 className="absolute left-1/2 -translate-x-1/2 text-center text-3xl font-black">{t('settings.title')}</h1>
                <div className="w-11" />
            </header>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3"
            >
                <section className="rounded-3xl border border-white/10 bg-panel p-4">
                    <h2 className="mb-3 text-lg font-bold text-white/70">{t('settings.feedback')}</h2>
                    <div className="flex flex-col gap-2">
                        <ToggleRow
                            label={t('settings.sound')}
                            icon="🔊"
                            enabled={soundEnabled}
                            onChange={setSoundEnabled}
                        />
                        <ToggleRow
                            label={t('settings.animations')}
                            icon="✨"
                            enabled={animationsEnabled}
                            onChange={setAnimationsEnabled}
                        />
                        <ToggleRow
                            label={t('game.hints')}
                            icon="💡"
                            enabled={hintsEnabled}
                            onChange={setHintsEnabled}
                        />
                    </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-panel p-4">
                    <h2 className="mb-3 text-lg font-bold text-white/70">{t('settings.language')}</h2>
                    <div className="flex gap-2">
                        <LanguageButton
                            label="Русский"
                            code="ru"
                            active={locale === 'ru'}
                            onClick={() => setLocale('ru')}
                        />
                        <LanguageButton
                            label="English"
                            code="en"
                            active={locale === 'en'}
                            onClick={() => setLocale('en')}
                        />
                    </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-panel p-4">
                    <h2 className="mb-3 text-lg font-bold text-white/70">О приложении</h2>
                    <div className="flex flex-col gap-2 text-white/80">
                        <div className="flex justify-between">
                            <span>Версия</span>
                            <span className="text-white/50">1.0.0</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Разработчик</span>
                            <span className="text-white/50">Telegram Mini App</span>
                        </div>
                    </div>
                </section>
            </motion.div>
        </div>
    );
}

function LanguageButton({ label, code, active, onClick }: { label: string; code: string; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex-1 rounded-xl px-4 py-3 text-center font-semibold transition active:scale-[0.98] ${active ? 'bg-accent text-white' : 'border border-white/10 bg-white/5 text-white/70'
                }`}
        >
            {label}
        </button>
    );
}

function ToggleRow({
    label,
    icon,
    enabled,
    onChange
}: {
    label: string;
    icon: string;
    enabled: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
                <span>{icon}</span>
                <span>{label}</span>
            </div>
            <button
                type="button"
                onClick={() => onChange(!enabled)}
                className={`relative h-7 w-12 rounded-full transition-colors ${enabled ? 'bg-accent' : 'bg-white/20'}`}
            >
                <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow"
                    style={{ left: enabled ? 'calc(100% - 26px)' : '2px' }}
                />
            </button>
        </div>
    );
}
