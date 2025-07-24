import React, { useEffect, useState } from 'react';

const MatrixCursor = () => {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [trails, setTrails] = useState([]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });

      // Generate trails on mouse movement (immediate effect)
      if (Math.random() < 0.6) { // 60% chance on movement
        const newTrail = {
          id: Date.now() + Math.random(),
          x: e.clientX + (Math.random() - 0.5) * 120,
          y: e.clientY + (Math.random() - 0.5) * 120,
          binary: Math.random() > 0.5 ? '1' : '0',
        };

        setTrails(prev => [...prev.slice(-30), newTrail]);

        setTimeout(() => {
          setTrails(prev => prev.filter(trail => trail.id !== newTrail.id));
        }, 2000);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    // Continuous trail generation around cursor position (stationary effect)
    const generateTrails = () => {
      if (Math.random() < 1) { // 70% chance for stationary trails
        const radius = 80; // Radius around cursor
        const angle = Math.random() * 2 * Math.PI; // Random angle
        const distance = Math.random() * radius; // Random distance within radius
        
        const newTrail = {
          id: Date.now() + Math.random(),
          x: cursorPos.x + Math.cos(angle) * distance,
          y: cursorPos.y + Math.sin(angle) * distance,
          binary: Math.random() > 0.5 ? '1' : '0',
        };

        setTrails(prev => [...prev.slice(-30), newTrail]); // Keep last 30 trails

        // Remove trail after animation
        setTimeout(() => {
          setTrails(prev => prev.filter(trail => trail.id !== newTrail.id));
        }, 2000);
      }
    };

    // Generate trails continuously every 100ms (faster)
    const intervalId = setInterval(generateTrails, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [cursorPos]);

  return (
    <>
      {/* Binary trails */}
      {trails.map(trail => (
        <div
          key={trail.id}
          className="matrix-trail"
          style={{
            left: trail.x,
            top: trail.y,
          }}
        >
          {trail.binary}
        </div>
      ))}
    </>
  );
};

export default MatrixCursor;