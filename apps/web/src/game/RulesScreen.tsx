import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useTelegramBackButton } from '../hooks/useTelegram';
import { useI18n } from '../store/i18n';

interface RulesScreenProps {
    fromGame?: boolean;
}

export function RulesScreen({ fromGame }: RulesScreenProps) {
    const closeRules = useGameStore((s) => s.closeRules);
    const { t } = useI18n();

    // useTelegramBackButton(closeRules);

    const rules = [
        {
            icon: '📐',
            iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-400',
            title: t('rules.draw_line'),
            description: t('rules.draw_line_desc')
        },
        {
            icon: '⬜',
            iconBg: 'bg-gradient-to-br from-green-500 to-emerald-400',
            title: t('rules.capture'),
            description: t('rules.capture_desc')
        },
        {
            icon: '🔄',
            iconBg: 'bg-gradient-to-br from-purple-500 to-violet-400',
            title: t('rules.extra'),
            description: t('rules.extra_desc')
        },
        {
            icon: '🏆',
            iconBg: 'bg-gradient-to-br from-yellow-500 to-orange-400',
            title: t('rules.win'),
            description: t('rules.win_desc')
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="mx-4 flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900"
            >
                {/* Header */}
                <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-4 relative">
                    <button
                        type="button"
                        onClick={closeRules}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-lg text-white transition active:bg-white/10"
                    >
                        ‹
                    </button>
                    <h1 className="absolute left-1/2 -translate-x-1/2 text-center text-xl font-bold">{t('rules.title')}</h1>
                    <div className="w-9" />
                </header>

                {/* Content */}
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                    {rules.map((rule, i) => (
                        <motion.div
                            key={rule.title}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="flex gap-3 rounded-2xl border border-white/10 bg-slate-800/60 p-3"
                        >
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${rule.iconBg} text-lg`}>
                                {rule.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="mb-1 text-base font-bold">{rule.title}</h3>
                                <p className="text-sm leading-snug text-white/70">{rule.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}
