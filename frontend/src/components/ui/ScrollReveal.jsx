import React, { useEffect, useRef, useState } from 'react';

export default function ScrollReveal({ children, className = '', delay = 0, threshold = 0.15 }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        setIsVisible(entry.isIntersecting);
      });
    }, { threshold: 0.4, rootMargin: '0px 0px -100px 0px' });
    
    const { current } = domRef;
    if (current) observer.observe(current);
    
    return () => {
      if (current) observer.unobserve(current);
    };
  }, [threshold]);

  return (
    <div
      ref={domRef}
      className={`${className} ${isVisible ? 'scroll-visible' : 'scroll-hidden'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
