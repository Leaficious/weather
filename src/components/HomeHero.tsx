"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { computeSky } from "@/lib/sky";
import { usePointerParallax } from "@/lib/motion";
import { describeCode, placeHref, timeLabel, toUnitTemp, type Forecast } from "@/lib/weather";
import { SearchBox } from "./SearchBox";
import { SkyCanvas } from "./SkyCanvas";
import { SkyTheme } from "./SkyTheme";
import { WeatherIcon } from "./WeatherIcon";
import { useUnits } from "./Providers";
import { CountUp } from "./motion/CountUp";
import { CursorGlow } from "./motion/CursorGlow";
import { Horizon } from "./motion/Horizon";
import { Magnetic } from "./motion/Magnetic";

const ROTATE_MS = 9000;

export function HomeHero({ forecasts }: { forecasts: Forecast[] }) {
  const { units } = useUnits();
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const f = forecasts[i];
  const ref = useRef<HTMLElement>(null);
  // Remember which city was shown last so the temperature counts from its value, not from zero.
  const [track, setTrack] = useState<{ i: number; from?: number }>({ i });
  if (track.i !== i) setTrack({ i, from: forecasts[track.i]?.current.temp });
  const countFrom = track.i === i ? track.from : forecasts[track.i]?.current.temp;

  // Pointer depth: sky drifts a little, horizon more, glow follows the cursor.
  const { px, py } = usePointerParallax(ref);
  const skyX = useTransform(px, (v) => v * -10);
  const skyY = useTransform(py, (v) => v * -6);

  // Scroll depth: as the sheet slides over the hero, copy sinks and fades.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 140]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const skyScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.08]);
  const dim = useTransform(scrollYProgress, [0, 1], [0, 0.45]);

  const autoRotate = forecasts.length > 1 && !paused && !reduce;
  useEffect(() => {
    if (!autoRotate) return;
    const id = window.setInterval(() => setI((x) => (x + 1) % forecasts.length), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [autoRotate, forecasts.length]);

  const sky = useMemo(
    () =>
      f
        ? computeSky({ code: f.current.code, isDay: f.current.isDay, localTime: f.current.time, sunrise: f.sunrise, sunset: f.sunset })
        : null,
    [f],
  );

  const cond = f ? describeCode(f.current.code) : null;
  const fmt = (n: number) => `${Math.round(toUnitTemp(n, units))}°`;

  return (
    <section
      ref={ref}
      className="sky-bg sticky top-0 z-0 flex min-h-[100svh] flex-col justify-end overflow-hidden pt-24"
      style={{ color: "var(--sky-text)" }}
      onMouseEnter={() => {
        setPaused(true);
        setHovering(true);
      }}
      onMouseLeave={() => {
        setPaused(false);
        setHovering(false);
      }}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <SkyTheme sky={sky} />

      {/* Layer 0 — gradient sky, cross-fading between cities. */}
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

      {/* Layer 1 — weather canvas, drifting with the pointer and zooming on scroll. */}
      {sky && (
        <motion.div className="absolute inset-[-3%]" style={{ x: skyX, y: skyY, scale: skyScale }} aria-hidden>
          <SkyCanvas sky={sky} />
        </motion.div>
      )}

      {/* Layer 2 — cursor light + isobar texture. */}
      {sky && <CursorGlow px={px} py={py} color={sky.colors.glow} active={hovering && !reduce} />}
      <div className="isobars pointer-events-none absolute inset-0 opacity-[0.12] [mask-image:linear-gradient(to_top,black,transparent_70%)]" aria-hidden />

      {/* Layer 3 — terrain silhouettes. */}
      {sky && <Horizon sky={sky} px={px} py={py} scroll={scrollYProgress} />}

      {/* Layer 4 — darkening as the sheet covers the hero. */}
      <motion.div className="pointer-events-none absolute inset-0 bg-ink" style={{ opacity: dim }} aria-hidden />

      {/* Layer 5 — copy. */}
      <motion.div className="relative mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24" style={{ y: copyY, opacity: copyOpacity }}>
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div className="min-w-0">
            <p className="eyebrow rise flex items-center gap-2" style={{ color: "var(--sky-text-muted)", animationDelay: "0.1s" }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-solar opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-solar" />
              </span>
              Live · painted from measurements
            </p>
            <h1 className="display mt-4 text-[clamp(3rem,10vw,8.5rem)]">
              <span className="rise block" style={{ animationDelay: "0.2s" }}>
                The sky,
              </span>
              <span className="rise block" style={{ animationDelay: "0.32s" }}>
                as it is right now.
              </span>
            </h1>
            <div className="rise mt-8 max-w-xl" style={{ animationDelay: "0.5s" }}>
              <SearchBox size="lg" />
            </div>
          </div>

          {f && cond && (
            <div className="relative min-h-[9.5rem] min-w-0 lg:justify-self-end lg:text-right">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${f.place.name}-${i}`}
                  initial={reduce ? false : { opacity: 0, y: 14, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="eyebrow" style={{ color: "var(--sky-text-muted)" }}>
                    Over {f.place.name} · {timeLabel(f.current.time)} local
                  </p>
                  <p className="display num mt-2 flex items-baseline gap-3 text-7xl sm:text-8xl lg:justify-end">
                    <CountUp value={f.current.temp} from={countFrom} format={fmt} duration={1.1} />
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-lg lg:justify-end">
                    <WeatherIcon code={f.current.code} isDay={f.current.isDay} className="float h-5 w-5" strokeWidth={1.6} />
                    {cond.label}
                  </p>
                  <Magnetic>
                    <Link
                      href={placeHref(f.place)}
                      className="link-draw mt-3 inline-flex items-center gap-1.5 text-sm font-semibold"
                    >
                      Full forecast <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  </Magnetic>
                </motion.div>
              </AnimatePresence>

              <div className="mt-5 flex gap-1.5 lg:justify-end" role="group" aria-label="Featured skies">
                {forecasts.map((x, k) => (
                  <button
                    key={x.place.name}
                    type="button"
                    aria-pressed={k === i}
                    aria-label={`Show ${x.place.name}`}
                    onClick={() => setI(k)}
                    className="group relative h-6 w-8 outline-offset-2"
                  >
                    <span className="block h-1 overflow-hidden rounded-full bg-current opacity-30 transition-opacity group-hover:opacity-60" />
                    {k === i && (
                      <motion.span
                        key={`${k}-${autoRotate}`}
                        className="absolute inset-x-0 top-0 h-1 origin-left rounded-full bg-solar"
                        initial={{ scaleX: autoRotate ? 0 : 1 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: autoRotate ? ROTATE_MS / 1000 : 0.3, ease: "linear" }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <motion.a
          href="#world"
          className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-xs font-medium opacity-70 hover:opacity-100 sm:flex"
          style={{ color: "var(--sky-text-muted)" }}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 1.4 }}
          aria-label="Scroll to the featured skies"
        >
          <ChevronDown className={reduce ? "h-4 w-4" : "float h-4 w-4"} aria-hidden />
        </motion.a>
      </motion.div>
    </section>
  );
}
