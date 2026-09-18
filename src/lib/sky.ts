import { type ConditionFamily, describeCode, dayFraction } from "./weather";

/** Everything the art layer needs to paint a sky. Derived, never hand-picked per city. */
export interface SkyState {
  family: ConditionFamily;
  /** 0 = deep night, 1 = full day. */
  light: number;
  /** "dawn" | "day" | "dusk" | "night" */
  phase: "dawn" | "day" | "dusk" | "night";
  /** Sun position along its arc, 0 = rise, 1 = set. <0 or >1 = below horizon. */
  sunProgress: number;
  isDay: boolean;
  colors: {
    top: string;
    mid: string;
    horizon: string;
    text: string;
    textMuted: string;
    glow: string;
    /** Chip / card background in rgba on top of the sky. */
    surface: string;
    surfaceBorder: string;
  };
}

interface Args {
  code: number;
  isDay: boolean;
  /** Local ISO time e.g. 2026-09-18T14:00 */
  localTime: string;
  sunrise: string;
  sunset: string;
}

function mix(a: string, b: string, t: number): string {
  const pa = hex(a);
  const pb = hex(b);
  const r = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${r.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
function hex(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/* Base palettes per phase for a clear sky. Conditions desaturate / darken from here. */
const PHASES = {
  night: { top: "#050914", mid: "#0B1631", horizon: "#1B2A4F", glow: "#C7D6F5" },
  dawn: { top: "#1E2A5A", mid: "#8C5B7E", horizon: "#FFB27A", glow: "#FFD8A8" },
  day: { top: "#2A6FD6", mid: "#6FB2F2", horizon: "#CFE7FA", glow: "#FFF1C9" },
  dusk: { top: "#25214F", mid: "#B0507A", horizon: "#FF9A5C", glow: "#FFC48A" },
};

export function computeSky({ code, isDay, localTime, sunrise, sunset }: Args): SkyState {
  const { family } = describeCode(code);
  const now = dayFraction(localTime);
  const rise = sunrise ? dayFraction(sunrise) : 0.25;
  const set = sunset ? dayFraction(sunset) : 0.75;
  const dayLen = Math.max(0.01, set - rise);
  const sunProgress = (now - rise) / dayLen;

  // Twilight band: ±~50 minutes around sunrise/sunset.
  const band = 0.035;
  let phase: SkyState["phase"];
  let light: number;
  let base = PHASES.day;
  if (now < rise - band || now > set + band) {
    phase = "night";
    light = 0.08;
    base = PHASES.night;
  } else if (now < rise + band) {
    phase = "dawn";
    const t = (now - (rise - band)) / (2 * band); // 0..1 across the band
    light = 0.25 + t * 0.5;
    base = {
      top: mix(PHASES.night.top, PHASES.dawn.top, Math.min(1, t * 1.6)),
      mid: mix(PHASES.night.mid, PHASES.dawn.mid, Math.min(1, t * 1.4)),
      horizon: mix(PHASES.night.horizon, PHASES.dawn.horizon, Math.min(1, t * 1.4)),
      glow: PHASES.dawn.glow,
    };
  } else if (now > set - band) {
    phase = "dusk";
    const t = (now - (set - band)) / (2 * band);
    light = 0.75 - t * 0.5;
    base = {
      top: mix(PHASES.dusk.top, PHASES.night.top, t),
      mid: mix(PHASES.dusk.mid, PHASES.night.mid, t),
      horizon: mix(PHASES.dusk.horizon, PHASES.night.horizon, t),
      glow: PHASES.dusk.glow,
    };
  } else {
    phase = "day";
    // Slightly warmer near the edges of the day.
    const edge = Math.min(sunProgress, 1 - sunProgress);
    const warm = Math.max(0, 1 - edge / 0.2);
    light = 1;
    base = {
      top: mix(PHASES.day.top, PHASES.dawn.top, warm * 0.35),
      mid: mix(PHASES.day.mid, PHASES.dawn.mid, warm * 0.35),
      horizon: mix(PHASES.day.horizon, PHASES.dawn.horizon, warm * 0.5),
      glow: PHASES.day.glow,
    };
  }
  if (!isDay && phase === "day") phase = "night";

  // Condition overlay: cloud/rain/snow grey the sky and drop the light.
  const grey = phase === "night" ? "#151B26" : "#8A96A6";
  const greyLight = phase === "night" ? "#1A2230" : "#C9D1DB";
  const cover: Record<ConditionFamily, number> = {
    clear: 0,
    partly: 0.25,
    cloudy: 0.7,
    fog: 0.75,
    drizzle: 0.7,
    rain: 0.8,
    snow: 0.65,
    storm: 0.9,
  };
  const c = cover[family];
  let top = mix(base.top, grey, c);
  let mid = mix(base.mid, grey, c * 0.9);
  let horizon = mix(base.horizon, greyLight, c * 0.8);
  if (family === "snow") {
    top = mix(top, "#9FB0C4", 0.25);
    mid = mix(mid, "#C4D2E0", 0.3);
    horizon = mix(horizon, "#E8EEF4", 0.4);
  }
  if (family === "storm") {
    top = mix(top, "#0E1220", 0.5);
    mid = mix(mid, "#1D2436", 0.4);
  }
  light = light * (1 - c * 0.45);

  const dark = light < 0.45;
  return {
    family,
    light,
    phase,
    sunProgress,
    isDay,
    colors: {
      top,
      mid,
      horizon,
      text: dark ? "#F4F6FA" : "#0B1220",
      textMuted: dark ? "rgba(244,246,250,0.72)" : "rgba(11,18,32,0.74)",
      glow: base.glow,
      surface: dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.42)",
      surfaceBorder: dark ? "rgba(255,255,255,0.16)" : "rgba(11,18,32,0.10)",
    },
  };
}
