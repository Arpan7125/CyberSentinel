import React, { useEffect, useRef, useState } from 'react';

/**
 * Reveals its children once, the first time they scroll into view.
 *
 * Two deliberate behaviours:
 *
 * - **Reveal is one-way.** This used to mirror `entry.isIntersecting`, which
 *   re-hid content the moment it left the viewport — so scrolling back up
 *   made already-read sections vanish and replay. Once shown, it stays shown
 *   and the observer disconnects.
 * - **Reduced motion is honoured.** The hidden state is `opacity: 0` plus a
 *   40px translate, which is exactly the sort of movement that triggers
 *   vestibular discomfort. Under `prefers-reduced-motion: reduce` the CSS
 *   collapses both states to plain visible content (see index.css), and this
 *   component starts in the revealed state so nothing depends on the observer
 *   ever firing.
 */
export default function ScrollReveal({ children, className = '', delay = 0, threshold = 0.4 }) {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const [isVisible, setIsVisible] = useState(prefersReduced);
  const domRef = useRef(null);
  // Tracked in a ref, not the dependency array: reveal is one-way, so the
  // effect never needs to re-run when it flips.
  const revealedRef = useRef(prefersReduced);

  useEffect(() => {
    if (prefersReduced || revealedRef.current) return undefined;

    const node = domRef.current;
    if (!node) return undefined;

    let observer;

    const reveal = () => {
      if (revealedRef.current) return;
      revealedRef.current = true;
      setIsVisible(true);
      observer?.disconnect();
      window.removeEventListener('scroll', revealIfInView);
      window.removeEventListener('resize', revealIfInView);
    };

    // Geometry check, independent of any observer. This is the safety net:
    // these elements start at opacity 0, so anything that stops the observer
    // firing would otherwise leave the page permanently blank rather than
    // merely un-animated. Content must never depend on an animation to exist.
    //
    // Deliberately NOT rAF-throttled. rAF is part of the same rendering loop
    // that IntersectionObserver depends on, so throttling through it would
    // make the fallback fail in exactly the cases it exists to cover. The
    // read is a single getBoundingClientRect and each listener removes itself
    // the moment its element is revealed, so the cost is bounded and brief.
    function revealIfInView() {
      const rect = node.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < viewportH - 80 && rect.bottom > 0) reveal();
    }

    revealIfInView();

    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => entries.forEach((entry) => entry.isIntersecting && reveal()),
        { threshold, rootMargin: '0px 0px -80px 0px' },
      );
      observer.observe(node);
    }

    window.addEventListener('scroll', revealIfInView, { passive: true });
    window.addEventListener('resize', revealIfInView, { passive: true });

    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', revealIfInView);
      window.removeEventListener('resize', revealIfInView);
    };
  }, [threshold, prefersReduced]);

  return (
    <div
      ref={domRef}
      className={`${className} ${isVisible ? 'scroll-visible' : 'scroll-hidden'}`}
      style={prefersReduced ? undefined : { transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
