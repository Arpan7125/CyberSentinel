import React, { useCallback, useRef } from 'react';

/**
 * Real 3D tilt: the card rotates in perspective toward the pointer, and any
 * child marked `data-depth` floats above its surface on the Z axis.
 *
 * Implemented with CSS transforms rather than a WebGL/three.js scene on
 * purpose — this is decorative depth on a handful of marketing cards, and it
 * does not justify shipping a renderer to every visitor. CSS 3D is
 * GPU-composited, costs nothing in bundle size, and degrades cleanly.
 *
 * Three guards, all deliberate:
 *  - `prefers-reduced-motion` disables it outright.
 *  - Coarse pointers (touch) are skipped: there is no hover there, and a
 *    tilt that fires on tap reads as a glitch.
 *  - Rotation is clamped (default 7°) so the card never detaches from its own
 *    hit box or makes its text harder to read.
 */
export default function Tilt3D({
  children,
  className = '',
  max = 7,
  scale = 1.015,
  style,
  ...rest
}) {
  const ref = useRef(null);
  const frame = useRef(0);

  const enabled = useCallback(() => {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
    // Hover-capable, fine pointer only.
    return window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false;
  }, []);

  const handleMove = useCallback(
    (event) => {
      const node = ref.current;
      if (!node || !enabled()) return;

      const rect = node.getBoundingClientRect();
      // -0.5 .. 0.5 relative to the card's centre.
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;

      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        // px/py span -0.5..0.5, so the ×2 is what makes `max` mean actual
        // degrees at the card's edge rather than half that.
        // Y follows horizontal travel, X inverts vertical travel so the card
        // leans toward the cursor rather than away from it.
        node.style.transform =
          `perspective(900px) rotateX(${(-py * 2 * max).toFixed(2)}deg) ` +
          `rotateY(${(px * 2 * max).toFixed(2)}deg) scale(${scale})`;
      });
    },
    [enabled, max, scale],
  );

  const handleEnter = useCallback(() => {
    const node = ref.current;
    if (!node || !enabled()) return;
    node.style.willChange = 'transform';
    node.style.transition = 'transform .12s ease-out';
  }, [enabled]);

  const handleLeave = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    cancelAnimationFrame(frame.current);
    // Longer, eased return so the card settles instead of snapping back.
    node.style.transition = 'transform .5s cubic-bezier(0.16, 1, 0.3, 1)';
    node.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
    // Releasing will-change matters: held indefinitely across many cards it
    // pins GPU memory for animations that are no longer running.
    window.setTimeout(() => {
      if (ref.current) ref.current.style.willChange = 'auto';
    }, 500);
  }, []);

  return (
    <div
      ref={ref}
      className={`tilt-3d ${className}`}
      onMouseMove={handleMove}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{ transformStyle: 'preserve-3d', ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
