"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Route transition: each page rises in. Re-mounts on navigation, unlike layout. */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="flex flex-1 flex-col"
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
