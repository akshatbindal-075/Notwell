"use client";
import { motion } from "framer-motion";

/**
 * TextShimmer — animated gradient sweep across text, Motion Primitives style.
 * Used for "agent is working" states.
 */
export default function TextShimmer({ text, className = "" }) {
  return (
    <motion.span
      className={`bg-clip-text text-transparent bg-[length:200%_100%] ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, #5A5A5A 0%, #2B93D1 50%, #5A5A5A 100%)",
      }}
      animate={{ backgroundPosition: ["200% 0%", "-200% 0%"] }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      {text}
    </motion.span>
  );
}
