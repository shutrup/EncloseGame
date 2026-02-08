import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

const rules = [
    {
        icon: '📐',
        iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-400',
        title: 'Проведи линию',
        description: 'Соедини любые две соседние точки линией. Линии не могут пересекаться или дублироваться.'
    },
    {
        icon: '⬜',
        iconBg: 'bg-gradient-to-br from-green-500 to-emerald-400',
        title: 'Замкни квадрат',
        description: 'Когда ты рисуешь четвертую сторону квадрата, он становится твоим! Внутри появится твой символ (X или O).'
    },
    {
        icon: '🔄',
        iconBg: 'bg-gradient-to-br from-purple-500 to-violet-400',
        title: 'Дополнительный ход',
        description: 'Если ты захватил квадрат, ты ОБЯЗАН сделать еще один ход. Можно захватывать цепочки квадратов!'
    },
    {
        icon: '🏆',
        iconBg: 'bg-gradient-to-br from-yellow-500 to-orange-400',
        title: 'Победа',
        description: 'Игра заканчивается, когда все линии нарисованы. Побеждает тот, кто захватил больше квадратов.'
    }
];

interface RulesScreenProps {
    fromGame?: boolean;
}

export function RulesScreen({ fromGame }: RulesScreenProps) {
    const closeRules = useGameStore((s) => s.closeRules);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="mx-4 flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900"
            >
                {/* Header */}
                <header className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3">
                    <button
                        type="button"
                        onClick={closeRules}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-lg"
                    >
                        ‹
                    </button>
                    <h1 className="flex-1 text-center text-xl font-bold">Правила</h1>
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
