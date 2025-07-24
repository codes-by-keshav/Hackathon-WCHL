import React, { useEffect, useState } from 'react';

const AnimatedBackground = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      // Increased particle count from 15 to 60
      for (let i = 0; i < 100; i++) {
        newParticles.push({
          id: i,
          left: Math.random() * 100,
          size: Math.random() * 2 + 1,
          startY: Math.random() * 200 - 100,
          delay: Math.random() * 2,
          duration: Math.random() * 8 + 4
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  return (
    <>
      <div className="animated-bg"></div>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.left}%`,
              width: `${particle.size}px`,
              height: `${particle.size * 4}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              transform: `translateY(${particle.startY}vh)`

            }}
          />
        ))}
      </div>
    </>
  );
};

export default AnimatedBackground;