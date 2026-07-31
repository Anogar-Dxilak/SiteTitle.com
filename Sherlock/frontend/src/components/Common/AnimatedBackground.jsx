import { useMemo } from 'react';

export default function AnimatedBackground() {
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 15}s`,
      duration: `${10 + Math.random() * 20}s`,
      size: `${1 + Math.random() * 3}px`,
      opacity: 0.1 + Math.random() * 0.4,
    }));
  }, []);

  return (
    <div className="animated-bg">
      <div className="animated-bg__grid" />
      <div className="animated-bg__glow animated-bg__glow--cyan" />
      <div className="animated-bg__glow animated-bg__glow--magenta" />
      {particles.map((p) => (
        <div
          key={p.id}
          className="animated-bg__particle"
          style={{
            left: p.left,
            bottom: '-10px',
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}
