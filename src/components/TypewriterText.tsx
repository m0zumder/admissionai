import React, { useState, useEffect } from 'react';

export const TypewriterText: React.FC<{ text: string; speed?: number; onComplete?: () => void }> = ({ text, speed = 30, onComplete }) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) return;
    setDisplayed('');
    setDone(false);
    const words = text.split(' ');
    let idx = 0;

    const interval = setInterval(() => {
      idx++;
      setDisplayed(words.slice(0, idx).join(' '));
      if (idx >= words.length) {
        clearInterval(interval);
        setDone(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />}
    </span>
  );
};
