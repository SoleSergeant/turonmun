import React, { useEffect } from 'react';

const CursorHighlight: React.FC = () => {
  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 100;
      const y = (event.clientY / window.innerHeight) * 100;

      document.documentElement.style.setProperty('--cursor-x', `${x}%`);
      document.documentElement.style.setProperty('--cursor-y', `${y}%`);
    };

    window.addEventListener('pointermove', handleMove);
    return () => window.removeEventListener('pointermove', handleMove);
  }, []);

  return <div className="cursor-highlight" aria-hidden="true" />;
};

export default CursorHighlight;
