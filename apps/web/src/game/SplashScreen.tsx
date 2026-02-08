import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

export function SplashScreen() {
    const [show, setShow] = useState(true);
    const goToSetup = useGameStore((s) => s.goToSetup);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShow(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    if (!show) return null;

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg"
        >
            {/* Animated Logo */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative mb-6"
            >
                {/* Glow */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 0.6, scale: 1.2 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="absolute inset-0 rounded-full bg-accent/40 blur-3xl"
                />

                {/* Square Logo */}
                <svg
                    className="relative h-32 w-32"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Animated square stroke */}
                    <motion.rect
                        x="20"
                        y="20"
                        width="60"
                        height="60"
                        rx="8"
                        stroke="currentColor"
                        strokeWidth="6"
                        className="text-accent"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, ease: 'easeInOut' }}
                    />

                    {/* Animated dots */}
                    {[
                        { cx: 20, cy: 20, delay: 0.2 },
                        { cx: 80, cy: 20, delay: 0.4 },
                        { cx: 80, cy: 80, delay: 0.6 },
                        { cx: 20, cy: 80, delay: 0.8 }
                    ].map((dot, i) => (
                        <motion.circle
                            key={i}
                            cx={dot.cx}
                            cy={dot.cy}
                            r="5"
                            className="fill-white"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3, delay: dot.delay }}
                        />
                    ))}
                </svg>
            </motion.div>

            {/* Title */}
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-6xl font-black tracking-tight"
            >
                Enclose
            </motion.h1>

            {/* Subtitle */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mt-2 text-lg text-white/60"
            >
                Стратегическая игра
            </motion.p>

            {/* Loading indicator */}
            <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 1.2, delay: 0.6 }}
                className="mt-8 h-1 w-32 origin-left rounded-full bg-gradient-to-r from-accent to-sky-400"
            />
        </motion.div>
    );
}
