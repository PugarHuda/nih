"use client";

/**
 * Webpack alias target for `framer-motion`.
 *
 * Mezo Passport pulls in motion@12.x which bundles framer-motion that
 * touches `React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
 * .ReactCurrentOwner` at module load — a field React 19 removed.
 *
 * Our code never uses framer-motion directly (we replaced everything
 * with CSS keyframes). So we alias the entire package to this no-op
 * shim. Anything Passport tries to import becomes either a forwarding
 * `<div>` (for motion.div / motion.span / etc.) or a passthrough
 * component (for AnimatePresence / LazyMotion / etc.).
 *
 * Bundle stays tiny, page no longer crashes at chunk load.
 */
import * as React from "react";

type AnyProps = Record<string, unknown> & { children?: React.ReactNode };

// motion.div, motion.span, motion.button, motion.svg, …
type Motion = {
  [K in keyof React.JSX.IntrinsicElements]: React.FC<AnyProps>;
};

function strip(p: AnyProps) {
  // Drop framer-motion-only props so React doesn't warn about unknown DOM attrs.
  const {
    initial,
    animate,
    exit,
    transition,
    variants,
    whileHover,
    whileTap,
    whileDrag,
    whileFocus,
    whileInView,
    layout,
    layoutId,
    drag,
    dragConstraints,
    dragElastic,
    onAnimationStart,
    onAnimationComplete,
    custom,
    ...rest
  } = p as Record<string, unknown>;
  // suppress lints
  void initial; void animate; void exit; void transition; void variants;
  void whileHover; void whileTap; void whileDrag; void whileFocus; void whileInView;
  void layout; void layoutId; void drag; void dragConstraints; void dragElastic;
  void onAnimationStart; void onAnimationComplete; void custom;
  return rest;
}

export const motion: Motion = new Proxy({} as Motion, {
  get(_, tag) {
    const Tag = (tag === "$$typeof" ? undefined : tag) as keyof React.JSX.IntrinsicElements;
    if (!Tag) return undefined;
    const Comp: React.FC<AnyProps> = (props) => React.createElement(Tag, strip(props));
    Comp.displayName = `motion.${String(tag)}`;
    return Comp;
  },
});

export const AnimatePresence: React.FC<AnyProps> = ({ children }) => <>{children}</>;
export const LazyMotion: React.FC<AnyProps> = ({ children }) => <>{children}</>;
export const MotionConfig: React.FC<AnyProps> = ({ children }) => <>{children}</>;
export const Reorder = {
  Group: (({ children }: AnyProps) => <>{children}</>) as React.FC<AnyProps>,
  Item: (({ children }: AnyProps) => <>{children}</>) as React.FC<AnyProps>,
};

export const useAnimation = () => ({
  start: async () => {},
  stop: () => {},
  set: () => {},
  mount: () => () => {},
});
export const useAnimationControls = useAnimation;
export const useMotionValue = (v: unknown) => ({ get: () => v, set: () => {}, on: () => () => {} });
export const useTransform = () => ({ get: () => 0, set: () => {} });
export const useSpring = useMotionValue;
export const useScroll = () => ({
  scrollX: useMotionValue(0),
  scrollY: useMotionValue(0),
  scrollXProgress: useMotionValue(0),
  scrollYProgress: useMotionValue(0),
});
export const useInView = () => true;
export const useReducedMotion = () => false;
export const domAnimation = {};
export const domMax = {};

// Default export so `import x from "framer-motion"` resolves.
export default motion;
