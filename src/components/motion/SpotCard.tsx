"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { useSpotlight } from "@/lib/motion";

/** A card whose border and inner glow light up where the pointer is. Reveals on scroll. */
export function SpotCard({
  children,
  className = "",
  style,
  index = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  index?: number;
  as?: "div" | "li" | "article";
}) {
  const reduce = useReducedMotion();
  const ref = useSpotlight<HTMLDivElement>();
  const Tag = motion[as];
  return (
    <Tag
      ref={ref as never}
      className={`spot spot-border ${className}`}
      style={style}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px -5% 0px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: index * 0.09 }}
    >
      {children}
    </Tag>
  );
}
