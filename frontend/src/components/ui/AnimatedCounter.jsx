import React, { useState, useEffect, useRef } from 'react';

export default function AnimatedCounter({ end, duration = 2000, prefix = '', suffix = '', decimals = 0 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animateCount();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  const animateCount = () => {
    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * end);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  const displayValue = decimals > 0 ? count.toFixed(decimals) : Math.round(count).toLocaleString();

  return (
    <span ref={ref} className="animated-counter">
      {prefix}{displayValue}{suffix}
    </span>
  );
}
