/**
 * Shared framer-motion variants for the CyberSentinel design system.
 *
 * Every variant here is written so that a `reduce` motion preference collapses
 * it to a plain opacity change (or nothing at all) — pair these with
 * `useReducedMotion()` from framer-motion, or use the `useMotion()` helper
 * below which does it for you.
 */
import { useReducedMotion } from 'framer-motion';

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1];

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT_EXPO },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: EASE_OUT_EXPO },
  },
};

/** Parent wrapper that reveals children one after another. */
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

/** Route-level transition — deliberately subtle so navigation stays snappy. */
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease: 'easeIn' } },
};

/** Interactive lift for cards/tiles. Spread onto a motion element. */
export const hoverLift = {
  whileHover: { y: -3, transition: { duration: 0.2, ease: EASE_OUT_EXPO } },
  whileTap: { scale: 0.99 },
};

const STATIC = { hidden: {}, visible: {} };

/**
 * Returns motion variants that respect the user's reduced-motion preference.
 * Usage: const m = useMotion(); <motion.div variants={m.fadeUp} .../>
 */
export function useMotion() {
  const reduce = useReducedMotion();

  if (reduce) {
    return {
      fadeUp: fadeIn,
      fadeIn,
      scaleIn: fadeIn,
      staggerContainer: STATIC,
      pageTransition: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      },
      hoverLift: {},
      reduce: true,
    };
  }

  return { fadeUp, fadeIn, scaleIn, staggerContainer, pageTransition, hoverLift, reduce: false };
}
