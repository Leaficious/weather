"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Bookmark, BookmarkCheck, Check, Droplets, Eye, Gauge, Navigation, Share2, Sun, Wind } from "lucide-react";
import { computeSky } from "@/lib/sky";
import { usePointerParallax } from "@/lib/motion";
import {
  compass,
  dayLabel,
  describeCode,
  fmtDistance,
  fmtSpeed,
  fmtTemp,
  timeLabel,
  toUnitTemp,
  type Forecast,
} from "@/lib/weather";
import { SkyCanvas } from "./SkyCanvas";
import { SkyTheme } from "./SkyTheme";
import { Reveal } from "./Reveal";
import { WeatherIcon } from "./WeatherIcon";
import { useFavorites, useToast, useUnits } from "./Providers";
import { HourlyChart } from "./HourlyChart";
import { SunArc } from "./SunArc";
import { CountUp } from "./motion/CountUp";
import { CursorGlow } from "./motion/CursorGlow";
import { Horizon } from "./motion/Horizon";
import { SpotCard } from "./motion/SpotCard";
import { TiltCard } from "./motion/TiltCard";

export function ForecastView({ forecast }: { forecast: Forecast }) {
  const { units } = useUnits();
  const { isSaved, toggleSave, hydrated } = useFavorites();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [hovering, setHovering] = useState(false);
  const { current, place } = forecast;
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { px, py } = usePointerParallax(heroRef);
  const skyX = useTransform(px, (v) => v * -10);
  const skyY = useTransform(py, (v) => v * -6);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 120]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const skyScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.08]);
  const dim = useTransform(scrollYProgress, [0, 1], [0, 0.45]);
  const fmtWhole = (n: number) => `${Math.round(toUnitTemp(n, units))}°`;

  const sky = useMemo(
    () =>
      computeSky({
        code: current.code,
        isDay: current.isDay,
        localTime: current.time,
        sunrise: forecast.sunrise,
        sunset: forecast.sunset,
      }),
    [current, forecast.sunrise, forecast.sunset],
  );
  const cond = describeCode(current.code);
  const saved = hydrated && isSaved(place);

  async function share() {
    const url = window.location.href;
    const title = `${place.name}: ${fmtTemp(current.temp, units)} and ${cond.label.toLowerCase()} · Skyfield`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Link copied to clipboard", "success");
      window.setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      toast("Couldn't copy the link. Copy it from the address bar.", "error");
    }
  }

  function save() {
    const nowSaved = toggleSave(place);
    toast(nowSaved ? `Saved ${place.name}` : `Removed ${place.name}`, nowSaved ? "success" : "neutral");
  }

  /** CSS entrance (not JS): content is visible even before hydration or in throttled tabs. */
  const rise = (i: number) => ({ animationDelay: `${0.1 + i * 0.08}s` });

  const details = [
    {
      icon: Wind,
      label: "Wind",
      value: fmtSpeed(current.windSpeed, units),
      sub: `from ${compass(current.windDir)} · gusts ${fmtSpeed(current.windGust, units)}`,
      extra: (
        <Navigation
          className="h-4 w-4 text-solar"
          style={{ transform: `rotate(${current.windDir + 135}deg)` }}
          aria-label={`Wind blowing toward ${compass((current.windDir + 180) % 360)}`}
          role="img"
        />
      ),
    },
    { icon: Droplets, label: "Humidity", value: `${current.humidity}%`, sub: humidityLabel(current.humidity) },
    { icon: Sun, label: "UV index", value: current.uv.toFixed(1), sub: uvLabel(current.uv) },
    { icon: Gauge, label: "Pressure", value: `${Math.round(current.pressure)} hPa`, sub: pressureLabel(current.pressure) },
    { icon: Eye, label: "Visibility", value: fmtDistance(current.visibility, units), sub: `${current.cloudCover}% cloud cover` },
  ];

  return (
    <>
      <SkyTheme sky={sky} />

      {/* HERO */}
      <section
        ref={heroRef}
        className="sky-bg sticky top-0 z-0 overflow-hidden pt-24"
        style={{ color: "var(--sky-text)" }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <motion.div className="absolute inset-[-3%]" style={{ x: skyX, y: skyY, scale: skyScale }} aria-hidden>
          <SkyCanvas sky={sky} />
        </motion.div>
        <CursorGlow px={px} py={py} color={sky.colors.glow} active={hovering && !reduce} />
        <div className="isobars pointer-events-none absolute inset-0 opacity-[0.12] [mask-image:linear-gradient(to_top,black,transparent_70%)]" aria-hidden />
        <Horizon sky={sky} px={px} py={py} scroll={scrollYProgress} className="h-[18svh]" />
        <motion.div className="pointer-events-none absolute inset-0 bg-ink" style={{ opacity: dim }} aria-hidden />
        <motion.div
          className="relative mx-auto flex max-w-7xl flex-col px-4 pb-20 sm:px-6 lg:min-h-[78svh]"
          style={{ y: copyY, opacity: copyOpacity }}
        >
          <div className="rise flex flex-wrap items-center justify-between gap-3" style={rise(0)}>
            <Link href="/" className="btn btn-ghost h-10 px-4 text-sm">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Search
            </Link>
            <div className="flex gap-2">
              <button type="button" onClick={share} className="btn btn-ghost h-10 px-4 text-sm" aria-label="Share this forecast">
                {copied ? <Check className="h-4 w-4 text-success" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
                <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
              </button>
              <button
                type="button"
                onClick={save}
                aria-pressed={saved}
                className={`btn h-10 px-4 text-sm ${saved ? "btn-solar" : "btn-ghost"}`}
              >
                {saved ? <BookmarkCheck className="h-4 w-4" aria-hidden /> : <Bookmark className="h-4 w-4" aria-hidden />}
                {saved ? "Saved" : "Save"}
              </button>
            </div>
          </div>

          <div className="grid gap-8 pt-10 sm:pt-14 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-12 lg:pt-16">
            <div className="min-w-0">
              <p className="rise eyebrow" style={{ color: "var(--sky-text-muted)", ...rise(1) }}>
                {[place.admin, place.country].filter(Boolean).join(" · ") || "Coordinates"}
              </p>
              <h1 className="rise display mt-3 text-[clamp(3rem,9vw,8rem)]" style={rise(2)}>
                {place.name}
              </h1>
              <div className="rise mt-6 flex flex-wrap items-end gap-x-6 gap-y-3" style={rise(3)}>
                <p className="display num text-[clamp(6rem,18vw,13rem)] leading-[0.82]">
                  <CountUp value={current.temp} format={fmtWhole} duration={1.6} delay={0.3} />
                </p>
                <div className="pb-1">
                  <p className="flex items-center gap-2 text-xl font-medium sm:text-2xl">
                    <WeatherIcon code={current.code} isDay={current.isDay} className={`h-7 w-7 ${reduce ? "" : "float"}`} strokeWidth={1.5} />
                    {cond.label}
                  </p>
                  <p className="mt-1.5 text-base" style={{ color: "var(--sky-text-muted)" }}>
                    Feels like {fmtTemp(current.feelsLike, units)} · High {fmtTemp(forecast.daily[0]?.max ?? current.temp, units)} · Low{" "}
                    {fmtTemp(forecast.daily[0]?.min ?? current.temp, units)}
                  </p>
                </div>
              </div>
              <p className="rise num mt-6 text-sm" style={{ color: "var(--sky-text-muted)", ...rise(4) }}>
                {longDate(current.time)} · {timeLabel(current.time)} local
              </p>
            </div>

            <div className="rise w-full max-w-sm lg:w-80" style={rise(5)}>
              <TiltCard className="surface rounded-3xl p-5" max={5} glare={false}>
                <SunArc sunrise={forecast.sunrise} sunset={forecast.sunset} progress={sky.sunProgress} now={current.time} />
              </TiltCard>
            </div>
          </div>
        </motion.div>
      </section>

      <div className="sheet bg-paper text-ink">

      {/* HOURLY */}
      <section className="relative" aria-labelledby="hourly-heading">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-ink/50">Next 24 hours</p>
              <h2 id="hourly-heading" className="display mt-2 text-3xl sm:text-5xl">
                The curve.
              </h2>
            </div>
            <p className="hidden max-w-xs text-sm text-ink/60 sm:block">Temperature as the line, chance of rain as the bars beneath.</p>
          </Reveal>
          <Reveal index={1} className="mt-8">
            <HourlyChart hours={forecast.hourly} units={units} />
          </Reveal>
        </div>
      </section>

      {/* DAILY + DETAILS */}
      <section className="relative rounded-t-[2.5rem] bg-paper-2 sm:rounded-t-[3.5rem]" aria-labelledby="daily-heading">
        <div className="isobars pointer-events-none absolute inset-0 opacity-30" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <Reveal>
              <p className="eyebrow text-ink/50">Seven days</p>
              <h2 id="daily-heading" className="display mt-2 text-3xl sm:text-5xl">
                The week.
              </h2>
            </Reveal>
            <ol className="mt-8 divide-y divide-line rounded-3xl border border-line bg-paper/70 backdrop-blur">
              {forecast.daily.map((d, i) => {
                const range = tempRange(forecast.daily);
                return (
                  <Reveal as="li" index={i} key={d.date} className="group grid grid-cols-[3.5rem_1.75rem_1fr_auto] items-center gap-3 px-4 py-3.5 transition-colors first:rounded-t-3xl last:rounded-b-3xl hover:bg-solar/10 sm:grid-cols-[4.5rem_2rem_6rem_1fr_auto] sm:gap-4 sm:px-5">
                    <span className="font-semibold">{dayLabel(d.date, i)}</span>
                    <WeatherIcon code={d.code} isDay className="h-5 w-5 text-ink/80 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:scale-110" strokeWidth={1.6} />
                    <span className="num hidden text-xs text-ink/55 sm:block">
                      {d.precipProb > 0 ? `${d.precipProb}% rain` : describeCode(d.code).label}
                    </span>
                    <TempBar min={d.min} max={d.max} lo={range[0]} hi={range[1]} units={units} />
                    <span className="num text-right text-sm">
                      <span className="text-ink/50">{fmtTemp(d.min, units)}</span>{" "}
                      <span className="font-semibold">{fmtTemp(d.max, units)}</span>
                    </span>
                  </Reveal>
                );
              })}
            </ol>
          </div>

          <div>
            <Reveal>
              <p className="eyebrow text-ink/50">Right now</p>
              <h2 className="display mt-2 text-3xl sm:text-5xl">The instruments.</h2>
            </Reveal>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {details.map((d, i) => (
                <SpotCard as="li" index={i} key={d.label} className="group rounded-3xl border border-line bg-paper/70 p-5 backdrop-blur transition-transform duration-500 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <p className="eyebrow text-ink/55">{d.label}</p>
                    <span className="flex items-center gap-2">
                      {"extra" in d ? d.extra : null}
                      <d.icon className="h-4 w-4 text-ink/40 transition-colors group-hover:text-solar" aria-hidden />
                    </span>
                  </div>
                  <p className="display num mt-4 text-3xl">{d.value}</p>
                  <p className="mt-1 text-xs text-ink/60">{d.sub}</p>
                </SpotCard>
              ))}
              <SpotCard as="li" index={5} className="grain relative overflow-hidden rounded-3xl bg-ink p-5 text-paper">
                <span className="aurora aurora-b !h-48 !w-48 !right-[-3rem] !top-[-3rem] !opacity-70" aria-hidden />
                <p className="eyebrow relative text-paper/55">Precipitation</p>
                <p className="display num relative mt-4 text-3xl">
                  <CountUp value={current.precipitation} format={(n) => `${n.toFixed(1)} mm`} />
                </p>
                <p className="relative mt-1 text-xs text-paper/60">in the last hour · {forecast.hourly[0]?.precipProb ?? 0}% chance next hour</p>
              </SpotCard>
            </ul>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}

function TempBar({ min, max, lo, hi, units }: { min: number; max: number; lo: number; hi: number; units: "metric" | "imperial" }) {
  const span = Math.max(1, hi - lo);
  const left = ((min - lo) / span) * 100;
  const width = ((max - min) / span) * 100;
  return (
    <div
      className="relative h-2 w-full rounded-full bg-ink/10"
      role="img"
      aria-label={`Low ${toUnitTemp(min, units)}°, high ${toUnitTemp(max, units)}°`}
    >
      <motion.span
        className="absolute inset-y-0 rounded-full"
        style={{ left: `${left}%`, background: "linear-gradient(90deg, var(--ice), var(--solar))" }}
        initial={{ width: 0 }}
        whileInView={{ width: `${Math.max(6, width)}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

function tempRange(days: Forecast["daily"]): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const d of days) {
    lo = Math.min(lo, d.min);
    hi = Math.max(hi, d.max);
  }
  return [lo, hi];
}

function longDate(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function uvLabel(uv: number): string {
  if (uv < 3) return "Low — no protection needed";
  if (uv < 6) return "Moderate — shade at midday";
  if (uv < 8) return "High — cover up";
  if (uv < 11) return "Very high — limit sun";
  return "Extreme — stay indoors at noon";
}
function pressureLabel(p: number): string {
  if (p >= 1022) return "High — settled";
  if (p <= 1005) return "Low — unsettled";
  return "Normal — steady";
}
function humidityLabel(h: number): string {
  if (h < 30) return "Dry";
  if (h < 60) return "Comfortable";
  if (h < 80) return "Humid";
  return "Muggy";
}
