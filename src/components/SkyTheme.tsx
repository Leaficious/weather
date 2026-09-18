"use client";

import { useEffect } from "react";
import type { SkyState } from "@/lib/sky";

const DEFAULTS: Record<string, string> = {
  "--sky-top": "#dfe6ee",
  "--sky-mid": "#e8edf2",
  "--sky-horizon": "#eef1f4",
  "--sky-text": "#0b1220",
  "--sky-text-muted": "rgba(11,18,32,0.62)",
  "--sky-surface": "rgba(255,255,255,0.55)",
  "--sky-surface-border": "rgba(11,18,32,0.10)",
  "--sky-glow": "#fff1c9",
};

/** Pushes the computed sky palette into CSS variables on <html>, resets on unmount. */
export function SkyTheme({ sky }: { sky: SkyState | null }) {
  useEffect(() => {
    const root = document.documentElement;
    const vars = sky
      ? {
          "--sky-top": sky.colors.top,
          "--sky-mid": sky.colors.mid,
          "--sky-horizon": sky.colors.horizon,
          "--sky-text": sky.colors.text,
          "--sky-text-muted": sky.colors.textMuted,
          "--sky-surface": sky.colors.surface,
          "--sky-surface-border": sky.colors.surfaceBorder,
          "--sky-glow": sky.colors.glow,
        }
      : DEFAULTS;
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", vars["--sky-top"]);
    return () => {
      for (const [k, v] of Object.entries(DEFAULTS)) root.style.setProperty(k, v);
    };
  }, [sky]);
  return null;
}
