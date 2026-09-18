"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { hourLabel, toUnitTemp, type HourPoint, type Units } from "@/lib/weather";
import { WeatherIcon } from "./WeatherIcon";

const W = 1200;
const H = 300;
const PAD = { l: 8, r: 8, t: 44, b: 64 };

export function HourlyChart({ hours, units }: { hours: HourPoint[]; units: Units }) {
  const id = useId();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);
  if (!hours.length) {
    return (
      <div className="rounded-3xl border border-dashed border-line p-10 text-center text-sm text-ink/60">
        Hourly data isn&apos;t available for this place right now.
      </div>
    );
  }

  const temps = hours.map((h) => h.temp);
  const lo = Math.min(...temps);
  const hi = Math.max(...temps);
  const span = Math.max(4, hi - lo);
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const step = innerW / (hours.length - 1);
  const x = (i: number) => PAD.l + i * step;
  const y = (t: number) => PAD.t + (1 - (t - lo) / span) * innerH;

  // Smooth curve through the points (Catmull-Rom → cubic bezier).
  const pts = hours.map((h, i) => [x(i), y(h.temp)] as const);
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  const area = `${d} L ${x(hours.length - 1)} ${PAD.t + innerH} L ${x(0)} ${PAD.t + innerH} Z`;
  const active = hover ?? 0;

  return (
    <div className="relative">
      <p className="mb-3 text-xs text-ink/55 sm:hidden">Swipe sideways to see the whole day →</p>
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-paper to-transparent lg:hidden" aria-hidden />
      <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="min-w-[760px] rounded-3xl border border-line bg-paper-2/60 p-3 focus-within:ring-2 focus-within:ring-solar sm:p-5">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`Hourly temperature from ${hourLabel(hours[0].time)}: low ${toUnitTemp(lo, units)}°, high ${toUnitTemp(hi, units)}°`}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--solar)" stopOpacity="0.45" />
              <stop offset="1" stopColor="var(--solar)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${id}-line`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="var(--ice)" />
              <stop offset="1" stopColor="var(--solar)" />
            </linearGradient>
          </defs>

          {/* rain-chance bars */}
          {hours.map((h, i) => {
            const bh = (h.precipProb / 100) * 40;
            return (
              <rect
                key={h.time}
                x={x(i) - step * 0.28}
                y={H - PAD.b + 22 - bh}
                width={step * 0.56}
                height={bh}
                rx={3}
                fill="var(--ice)"
                opacity={h.precipProb ? 0.9 : 0}
              />
            );
          })}

          <motion.path
            d={area}
            fill={`url(#${id}-fill)`}
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 }}
          />
          <motion.path
            d={d}
            fill="none"
            stroke={`url(#${id}-line)`}
            strokeWidth={4}
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* hover columns */}
          {hours.map((h, i) => (
            <rect
              key={`hit-${h.time}`}
              x={x(i) - step / 2}
              y={0}
              width={step}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              tabIndex={0}
              aria-label={`${hourLabel(h.time)}: ${toUnitTemp(h.temp, units)}°, ${h.precipProb}% rain`}
              className="outline-none"
            />
          ))}

          {/* active marker */}
          <line x1={x(active)} x2={x(active)} y1={PAD.t - 30} y2={H - PAD.b + 22} stroke="var(--ink)" strokeOpacity="0.25" strokeDasharray="3 4" />
          <circle cx={x(active)} cy={y(hours[active].temp)} r={7} fill="var(--paper)" stroke="var(--ink)" strokeWidth={3} />
          <g transform={`translate(${Math.min(W - 70, Math.max(70, x(active)))}, ${PAD.t - 24})`}>
            <rect x={-60} y={-16} width={120} height={28} rx={14} fill="var(--ink)" />
            <text textAnchor="middle" y={4} fill="var(--paper)" fontSize={14} fontFamily="var(--font-mono)" fontWeight={600}>
              {hourLabel(hours[active].time)} · {toUnitTemp(hours[active].temp, units)}° · {hours[active].precipProb}%
            </text>
          </g>

          {/* x labels + icons */}
          {hours.map((h, i) =>
            i % 3 === 0 ? (
              <g key={`lbl-${h.time}`} transform={`translate(${x(i)}, ${H - 14})`}>
                <text textAnchor="middle" fill="var(--ink)" fillOpacity="0.55" fontSize={13} fontFamily="var(--font-mono)">
                  {hourLabel(h.time)}
                </text>
              </g>
            ) : null,
          )}
          {hours.map((h, i) => (
            <text
              key={`t-${h.time}`}
              x={x(i)}
              y={y(h.temp) - 14}
              textAnchor="middle"
              fill="var(--ink)"
              fillOpacity={i === active ? 0 : 0.7}
              fontSize={12}
              fontFamily="var(--font-mono)"
            >
              {toUnitTemp(h.temp, units)}°
            </text>
          ))}
        </svg>
        <div className="mt-2 flex justify-between px-1">
          {hours.map((h, i) =>
            i % 3 === 0 ? (
              <WeatherIcon key={`i-${h.time}`} code={h.code} isDay={h.isDay} className="h-4 w-4 text-ink/60" strokeWidth={1.6} />
            ) : null,
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
