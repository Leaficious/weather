"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sunrise, Sunset } from "lucide-react";
import { timeLabel } from "@/lib/weather";

/** Sun's path today: rise → set, with the current position marked. */
export function SunArc({ sunrise, sunset, progress }: { sunrise: string; sunset: string; progress: number }) {
  const reduce = useReducedMotion();
  const p = Math.max(0, Math.min(1, progress));
  const below = progress < 0 || progress > 1;
  const W = 280;
  const H = 120;
  const cx = W / 2;
  const r = 118;
  const cy = 118;
  const ang = Math.PI - p * Math.PI;
  const sx = cx + r * Math.cos(ang);
  const sy = cy - r * Math.sin(ang);
  const path = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <div>
      <p className="eyebrow" style={{ color: "var(--sky-text-muted)" }}>
        Sun today
      </p>
      <svg viewBox={`0 0 ${W} ${H + 8}`} className="mt-2 h-auto w-full" role="img" aria-label={`Sunrise ${timeLabel(sunrise)}, sunset ${timeLabel(sunset)}`}>
        <path d={path} fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="4 6" />
        <motion.path
          d={path}
          fill="none"
          stroke="var(--solar)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: below ? 0 : p }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
        <line x1={0} x2={W} y1={cy} y2={cy} stroke="currentColor" strokeOpacity="0.3" />
        {!below && (
          <motion.g
            initial={reduce ? false : { opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            style={{ transformOrigin: `${sx}px ${sy}px` }}
          >
            <circle cx={sx} cy={sy} r={16} fill="var(--solar)" opacity={0.25} className="sun-pulse" />
            <circle cx={sx} cy={sy} r={7} fill="var(--solar)" stroke="var(--ink)" strokeWidth={2} />
          </motion.g>
        )}
      </svg>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5">
          <Sunrise className="h-4 w-4 text-solar" aria-hidden /> <span className="num">{timeLabel(sunrise)}</span>
        </span>
        <span className="text-xs" style={{ color: "var(--sky-text-muted)" }}>
          {below ? "Sun is below the horizon" : `${Math.round(p * 100)}% through the day`}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="num">{timeLabel(sunset)}</span> <Sunset className="h-4 w-4 text-solar" aria-hidden />
        </span>
      </div>
    </div>
  );
}
