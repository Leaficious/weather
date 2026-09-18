"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { computeSky } from "@/lib/sky";
import { describeCode, fmtTemp, placeHref, timeLabel, type Forecast } from "@/lib/weather";
import { SearchBox } from "./SearchBox";
import { SkyCanvas } from "./SkyCanvas";
import { SkyTheme } from "./SkyTheme";
import { useUnits } from "./Providers";

const ROTATE_MS = 9000;

export function HomeHero({ forecasts }: { forecasts: Forecast[] }) {
  const { units } = useUnits();
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const f = forecasts[i];

  useEffect(() => {
    if (forecasts.length < 2 || paused) return;
    const id = window.setInterval(() => setI((x) => (x + 1) % forecasts.length), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [forecasts.length, paused]);

  const sky = useMemo(
    () =>
      f
        ? computeSky({ code: f.current.code, isDay: f.current.isDay, localTime: f.current.time, sunrise: f.sunrise, sunset: f.sunset })
        : null,
    [f],
  );

  const cond = f ? describeCode(f.current.code) : null;

  return (
    <section
      className="sky-bg relative flex min-h-[100svh] flex-col justify-end overflow-hidden pt-24"
      style={{ color: "var(--sky-text)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <SkyTheme sky={sky} />
      {/* Cross-fading gradient layers: CSS can't animate between gradients, so we stack them. */}
      <AnimatePresence initial={false}>
        {sky && (
          <motion.div
            key={`${f?.place.name}-bg`}
            className="absolute inset-0"
            style={{ background: `linear-gradient(180deg, ${sky.colors.top} 0%, ${sky.colors.mid} 55%, ${sky.colors.horizon} 100%)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 1.4, ease: "easeInOut" }}
            aria-hidden
          />
        )}
      </AnimatePresence>
      {sky && <SkyCanvas sky={sky} />}
      <div className="isobars pointer-events-none absolute inset-0 opacity-[0.12] [mask-image:linear-gradient(to_top,black,transparent_70%)]" aria-hidden />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 sm:pb-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="eyebrow"
              style={{ color: "var(--sky-text-muted)" }}
            >
              Live · painted from measurements, not stock photos
            </motion.p>
            <h1 className="display mt-4 text-[clamp(3rem,10vw,8.5rem)]">
              <motion.span
                initial={reduce ? false : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                The sky,
              </motion.span>
              <motion.span
                initial={reduce ? false : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                as it is right now.
              </motion.span>
            </h1>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 max-w-xl"
            >
              <SearchBox size="lg" />
            </motion.div>
          </div>

          {f && cond && (
            <div className="relative min-h-[9.5rem] lg:justify-self-end lg:text-right" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${f.place.name}-${i}`}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="eyebrow" style={{ color: "var(--sky-text-muted)" }}>
                    Over {f.place.name} · {timeLabel(f.current.time)} local
                  </p>
                  <p className="display num mt-2 text-7xl sm:text-8xl">{fmtTemp(f.current.temp, units)}</p>
                  <p className="mt-2 text-lg">{cond.label}</p>
                  <Link
                    href={placeHref(f.place)}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
                  >
                    Full forecast <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </motion.div>
              </AnimatePresence>

              <div className="mt-5 flex gap-1.5 lg:justify-end" role="tablist" aria-label="Featured skies">
                {forecasts.map((x, k) => (
                  <button
                    key={x.place.name}
                    type="button"
                    role="tab"
                    aria-selected={k === i}
                    aria-label={`Show ${x.place.name}`}
                    onClick={() => setI(k)}
                    className="group relative h-6 w-8 outline-offset-2"
                  >
                    <span
                      className={`block h-1 rounded-full transition-all duration-300 ${k === i ? "bg-solar" : "bg-current opacity-30 group-hover:opacity-60"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
