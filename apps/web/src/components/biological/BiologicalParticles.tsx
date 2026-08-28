import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * Floating ambient biological particles for the dark hero background.
 * Pure CSS/Framer Motion — no WebGL dependency.
 */
export const BiologicalParticles: React.FC<{ count?: number }> = ({ count = 18 }) => {
  const particles = useMemo(() => {
    const colors = ['#C084FC', '#FB7185', '#FDA4AF', '#E879F9', '#D8B4FE', '#FFFFFF'];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1.5 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.15 + Math.random() * 0.35,
      duration: 5 + Math.random() * 8,
      delay: Math.random() * 4,
      driftX: -12 + Math.random() * 24,
      driftY: -18 + Math.random() * 36,
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-5" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          animate={{
            x: [0, p.driftX, 0],
            y: [0, p.driftY, 0],
            opacity: [p.opacity * 0.5, p.opacity, p.opacity * 0.5],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}40`,
          }}
        />
      ))}
    </div>
  );
};
