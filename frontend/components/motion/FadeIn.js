"use client";
import { motion } from "framer-motion";

/**
 * FadeIn — a Motion Primitives-style building block.
 * Wrap any content to have it fade + slide in on mount/viewport-enter.
 */
export default function FadeIn({ children, delay = 0, y = 16, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
