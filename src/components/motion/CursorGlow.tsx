"use client";

import { motion, useMotionTemplate, useTransform, type MotionValue } from "framer-motion";

/** A soft light that follows the pointer across the sky, tinted by the sky's glow colour. */
export function CursorGlow({ px, py, color, active }: { px: MotionValue<number>; py: MotionValue<number>; color: string; active: boolean }) {
  const x = useTransform(px, [-1, 1], ["0%", "100%"]);
  const y = useTransform(py, [-1, 1], ["0%", "100%"]);
  const bg = useMotionTemplate`radial-gradient(38rem circle at ${x} ${y}, ${color}, transparent 60%)`;
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 mix-blend-soft-light"
      style={{ background: bg }}
      animate={{ opacity: active ? 0.9 : 0 }}
      transition={{ duration: 0.8 }}
    />
  );
}
