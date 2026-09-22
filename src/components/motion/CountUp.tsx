"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

/**
 * Animates a number from 0 (or its previous value) to `value` when it scrolls into view.
 * Renders the formatted target immediately for SSR / reduced motion, so nothing depends on JS.
 */
export function CountUp({
  value,
  format = (n) => Math.round(n).toString(),
  duration = 1.4,
  className,
  delay = 0,
  from,
}: {
  value: number;
  /** Start of the count. Defaults to 0 on first render, then the previous value. */
  from?: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const prev = useRef(from ?? 0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce || !inView) {
      el.textContent = format(value);
      return;
    }
    const controls = animate(from ?? prev.current, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = format(v);
      },
      onComplete: () => {
        prev.current = value;
      },
    });
    return () => controls.stop();
  }, [value, inView, reduce, format, duration, delay, from]);

  return (
    <span ref={ref} className={className} aria-label={format(value)}>
      {format(value)}
    </span>
  );
}
