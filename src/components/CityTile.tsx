"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { computeSky } from "@/lib/sky";
import { describeCode, fmtTemp, placeHref, timeLabel, type Forecast } from "@/lib/weather";
import { useUnits } from "./Providers";
import { WeatherIcon } from "./WeatherIcon";

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
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: index * 0.07 }}
      className="list-none"
    >
      <Link
        href={placeHref(forecast.place)}
        className="tile group relative block overflow-hidden rounded-3xl p-5 outline-offset-4"
        style={{
          background: `linear-gradient(170deg, ${sky.colors.top} 0%, ${sky.colors.mid} 60%, ${sky.colors.horizon} 100%)`,
          color: sky.colors.text,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow opacity-70">{forecast.place.country}</p>
            <p className="display mt-1 text-2xl sm:text-3xl">{forecast.place.name}</p>
          </div>
          <WeatherIcon code={forecast.current.code} isDay={forecast.current.isDay} className="h-8 w-8 shrink-0 opacity-90" strokeWidth={1.5} />
        </div>
        <div className="mt-8 flex items-end justify-between">
          <div>
            <p className="display num text-6xl">{fmtTemp(forecast.current.temp, units)}</p>
            <p className="mt-1 text-sm" style={{ color: sky.colors.textMuted }}>
              {cond.label} · {timeLabel(forecast.current.time)} local
            </p>
          </div>
          <span
            className="grid h-10 w-10 place-items-center rounded-full border transition-transform duration-500 group-hover:rotate-45"
            style={{ borderColor: sky.colors.surfaceBorder, background: sky.colors.surface }}
            aria-hidden
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </motion.li>
  );
}
