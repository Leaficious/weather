"use client";

import Link from "next/link";
import { describeCode, fmtTemp, placeHref, type Forecast } from "@/lib/weather";
import { useUnits } from "../Providers";
import { WeatherIcon } from "../WeatherIcon";

/** Endless marquee of live readings. Pauses on hover so links are catchable. */
export function Ticker({ forecasts }: { forecasts: Forecast[] }) {
  const { units } = useUnits();
  if (!forecasts.length) return null;
  const items = [...forecasts, ...forecasts];
  return (
    <div className="marquee-wrap relative overflow-hidden border-y border-line bg-paper-2/70 py-3 backdrop-blur" aria-label="Live readings">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-paper-2 to-transparent" aria-hidden />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-paper-2 to-transparent" aria-hidden />
      <ul className="marquee flex w-max items-center gap-10 whitespace-nowrap px-4">
        {items.map((f, i) => (
          <li key={`${f.place.name}-${i}`} aria-hidden={i >= forecasts.length}>
            <Link
              href={placeHref(f.place)}
              className="group flex items-center gap-3 text-sm text-ink/80 transition-colors hover:text-ink"
              tabIndex={i >= forecasts.length ? -1 : 0}
            >
              <WeatherIcon code={f.current.code} isDay={f.current.isDay} className="h-4 w-4 text-solar" strokeWidth={1.8} />
              <span className="font-semibold">{f.place.name}</span>
              <span className="num">{fmtTemp(f.current.temp, units)}</span>
              <span className="text-ink/55">{describeCode(f.current.code).label}</span>
              <span className="h-1 w-1 rounded-full bg-solar opacity-60 transition-transform group-hover:scale-150" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
