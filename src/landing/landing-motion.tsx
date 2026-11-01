import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import { spring } from "../lib/motion";

export const stagger = (index: number) => ({ "--i": index }) as CSSProperties;

/** Scroll-in reveal: fades and rises once, with the app's default spring. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ ...spring.default, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Staggers the `staggerChild` items inside it when the block enters view. */
export const staggerParent = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export const staggerChild = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: spring.default },
};

export function StaggerGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </motion.div>
  );
}
