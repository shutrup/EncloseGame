import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

interface Particle {
    id: number;
    x: number;
    y: number;
    angle: number;
    velocity: number;
    size: number;
    color: string;
}

interface ParticleEffectProps {
    trigger: { x: number; y: number } | null;
    color: string;
}

export function ParticleEffect({ trigger, color }: ParticleEffectProps) {
    const [particles, setParticles] = useState<Particle[]>([]);
    const idRef = useRef(0);

    useEffect(() => {
        if (!trigger) return;

        const newParticles: Particle[] = [];
        const count = 12;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
            newParticles.push({
                id: idRef.current++,
                x: trigger.x,
                y: trigger.y,
                angle,
                velocity: 40 + Math.random() * 30,
                size: 4 + Math.random() * 4,
                color
            });
        }

        setParticles(newParticles);

        const timeout = setTimeout(() => {
            setParticles([]);
        }, 600);

        return () => clearTimeout(timeout);
    }, [trigger, color]);

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <AnimatePresence>
                {particles.map((p) => {
                    const endX = p.x + Math.cos(p.angle) * p.velocity;
                    const endY = p.y + Math.sin(p.angle) * p.velocity;

                    return (
                        <motion.div
                            key={p.id}
                            className="absolute rounded-full"
                            style={{
                                width: p.size,
                                height: p.size,
                                backgroundColor: p.color,
                                left: 0,
                                top: 0
                            }}
                            initial={{
                                x: p.x - p.size / 2,
                                y: p.y - p.size / 2,
                                opacity: 1,
                                scale: 1
                            }}
                            animate={{
                                x: endX - p.size / 2,
                                y: endY - p.size / 2,
                                opacity: 0,
                                scale: 0.2
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 0.5,
                                ease: 'easeOut'
                            }}
                        />
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
