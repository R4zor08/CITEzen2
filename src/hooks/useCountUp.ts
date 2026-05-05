import { useState, useEffect, useRef } from 'react';

export function useCountUp(end: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const prevEnd = useRef(end);
  const frameRef = useRef<number>();

  useEffect(() => {
    const startVal = prevEnd.current !== end ? 0 : count;
    prevEnd.current = end;

    if (end === 0) {
      setCount(0);
      return;
    }

    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (end - startVal) * eased);

      setCount(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration]);

  return count;
}