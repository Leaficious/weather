"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { computeSky } from "@/lib/sky";
import { describeCode, placeHref, timeLabel, toUnitTemp, type Forecast } from "@/lib/weather";
import { useUnits } from "./Providers";
import { WeatherIcon } from "./WeatherIcon";
import { TiltCard } from "./motion/TiltCard";
import { CountUp } from "./motion/CountUp";

export function CityTile({ forecast, index = 0 }: { forecast: Forecast; index?: number }) {
  const { units } = useUnits();
  const reduce = useReducedMotion();
  const sky = computeSky({
    code: forecast.current.code,
    isDay: forecast.current.isDay,
    localTime: forecast.current.time,
    sunrise: forecast.sunrise,
    sunset: forecast.sunset,
  });
  const cond = describeCode(forecast.current.code);
  const fmt = (n: number) => `${Math.round(toUnitTemp(n, units))}°`;
  const night = sky.phase === "night";

  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 36, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
      className="list-none [perspective:1000px]"
    >
      <TiltCard className="group rounded-3xl" max={6}>
        <Link
          href={placeHref(forecast.place)}
          className="tile shine relative block overflow-hidden rounded-3xl p-5 outline-offset-4"
          style={{
            background: `linear-gradient(170deg, ${sky.colors.top} 0%, ${sky.colors.mid} 60%, ${sky.colors.horizon} 100%)`,
            color: sky.colors.text,
          }}
        >
          {/* Depth layers inside the tile: sun/moon disc and a horizon haze that shift on hover. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full blur-2xl transition-transform duration-700 ease-out group-hover:translate-x-[-10px] group-hover:translate-y-[8px]"
            style={{ background: sky.colors.glow, opacity: night ? 0.18 : 0.55 }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 transition-transform duration-700 ease-out group-hover:translate-y-1"
            style={{ background: `linear-gradient(to top, ${sky.colors.horizon}, transparent)`, opacity: 0.7 }}
          />
          {night && (
            <span aria-hidden className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(1px_1px_at_20%_30%,#fff_50%,transparent_51%),radial-gradient(1px_1px_at_70%_20%,#fff_50%,transparent_51%),radial-gradient(1.5px_1.5px_at_40%_60%,#fff_50%,transparent_51%),radial-gradient(1px_1px_at_85%_55%,#fff_50%,transparent_51%),radial-gradient(1px_1px_at_55%_15%,#fff_50%,transparent_51%)]" />
          )}

          <div className="relative flex items-start justify-between gap-3 [transform:translateZ(30px)]">
            <div>
              <p className="eyebrow opacity-70">{forecast.place.country}</p>
              <p className="display mt-1 text-2xl sm:text-3xl">{forecast.place.name}</p>
            </div>
            <WeatherIcon
              code={forecast.current.code}
              isDay={forecast.current.isDay}
              className={`h-8 w-8 shrink-0 opacity-90 ${reduce ? "" : "float"}`}
              strokeWidth={1.5}
            />
          </div>
          <div className="relative mt-8 flex items-end justify-between [transform:translateZ(40px)]">
            <div>
              <p className="display num text-6xl">
                <CountUp value={forecast.current.temp} format={fmt} delay={index * 0.08} />
              </p>
              <p className="mt-1 text-sm" style={{ color: sky.colors.textMuted }}>
                {cond.label} · {timeLabel(forecast.current.time)} local
              </p>
            </div>
            <span
              className="grid h-10 w-10 place-items-center rounded-full border transition-all duration-500 group-hover:rotate-45 group-hover:bg-solar group-hover:text-ink"
              style={{ borderColor: sky.colors.surfaceBorder, background: sky.colors.surface }}
              aria-hidden
            >
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
      </TiltCard>
    </motion.li>
  );
}
