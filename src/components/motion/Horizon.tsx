"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { mix, type SkyState } from "@/lib/sky";

/**
 * Three layers of rolling terrain in front of the sky, each moving at its own depth
 * with the pointer and with scroll. Colours derive from the current sky, so the hills
 * are lit the way the sky is lit.
 */
const LAYERS = [
  {
    d: "M0 120 C 140 80, 260 60, 420 92 S 720 140, 900 96 S 1200 40, 1440 88 L1440 200 L0 200 Z",
    depth: 0.35,
    k: 0.22,
  },
  {
    d: "M0 150 C 180 110, 320 118, 480 136 S 780 96, 980 128 S 1280 150, 1440 122 L1440 200 L0 200 Z",
    depth: 0.6,
    k: 0.4,
  },
  {
    d: "M0 176 C 120 158, 300 146, 520 166 S 860 190, 1060 160 S 1340 150, 1440 170 L1440 200 L0 200 Z",
    depth: 1,
    k: 0.58,
  },
];

export function Horizon({
  sky,
  px,
  py,
  scroll,
  className = "",
}: {
  sky: SkyState;
  px: MotionValue<number>;
  py: MotionValue<number>;
  scroll?: MotionValue<number>;
  className?: string;
}) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-[26svh] min-h-[160px] overflow-hidden ${className}`} aria-hidden>
      {LAYERS.map((l, i) => (
        <Layer key={i} d={l.d} depth={l.depth} fill={mix(sky.colors.horizon, sky.colors.top, l.k)} px={px} py={py} scroll={scroll} index={i} />
      ))}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{ background: `linear-gradient(to top, ${mix(sky.colors.horizon, sky.colors.top, 0.62)}, transparent)` }}
      />
    </div>
  );
}

function Layer({
  d,
  depth,
  fill,
  px,
  py,
  scroll,
  index,
}: {
  d: string;
  depth: number;
  fill: string;
  px: MotionValue<number>;
  py: MotionValue<number>;
  scroll?: MotionValue<number>;
  index: number;
}) {
  const x = useTransform(px, (v) => v * -22 * depth);
  const pointerY = useTransform(py, (v) => v * -8 * depth);
  const scrollY = useTransform(scroll ?? py, (v) => (scroll ? v * 160 * (1.2 - depth) : 0));
  const y = useTransform([pointerY, scrollY], ([a, b]) => (a as number) + (b as number));
  return (
    <motion.svg
      viewBox="0 0 1440 200"
      preserveAspectRatio="none"
      className="absolute inset-x-[-4%] bottom-0 h-full w-[108%]"
      style={{ x, y, zIndex: index, opacity: 0.92 }}
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 0.92 }}
      transition={{ duration: 1.2, delay: 0.3 + index * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.path d={d} style={{ fill }} animate={{ fill }} transition={{ duration: 1.2 }} />
    </motion.svg>
  );
}
