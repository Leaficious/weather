"use client";

import { useEffect, useRef } from "react";
import type { SkyState } from "@/lib/sky";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  seed: number;
}

/**
 * Paints the live sky: sun/moon on its arc, stars at night, drifting cloud masses,
 * rain streaks, snowflakes, fog and the occasional lightning flash.
 * Everything is driven by the SkyState — no hand-picked scene per city.
 */
export function SkyCanvas({ sky, className = "" }: { sky: SkyState; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const skyRef = useRef(sky);

  useEffect(() => {
    skyRef.current = sky;
  }, [sky]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let last = performance.now();
    let t = 0;
    let flash = 0;
    let nextFlash = 2 + Math.random() * 6;

    const stars: Particle[] = [];
    const clouds: Particle[] = [];
    // Cloud sprites are expensive (many radial gradients); render once per size/family and blit.
    const spriteCache = new Map<string, HTMLCanvasElement>();
    function cloudSprite(size: number, light: string, dark: string, seed: number): HTMLCanvasElement {
      const key = `${Math.round(size)}|${light}|${dark}|${seed.toFixed(2)}`;
      const hit = spriteCache.get(key);
      if (hit) return hit;
      const pad = size * 0.4;
      const cw = Math.ceil(size * 1.4 + pad * 2);
      const ch = Math.ceil(size * 0.9 + pad * 2);
      const off = document.createElement("canvas");
      off.width = cw;
      off.height = ch;
      const oc = off.getContext("2d");
      if (oc) {
        const cx = cw / 2;
        const cy = ch / 2;
        for (let k = 0; k < 4; k++) {
          const ox = (k - 1.5) * size * 0.28;
          const oy = Math.sin(seed + k) * size * 0.06;
          const r = size * (0.28 + (k % 2) * 0.08);
          const g = oc.createRadialGradient(cx + ox, cy + oy, r * 0.1, cx + ox, cy + oy, r);
          g.addColorStop(0, hexA(light, 0.9));
          g.addColorStop(0.55, hexA(dark, 0.45));
          g.addColorStop(1, hexA(dark, 0));
          oc.fillStyle = g;
          oc.fillRect(cx + ox - r, cy + oy - r, r * 2, r * 2);
        }
      }
      if (spriteCache.size > 24) spriteCache.clear();
      spriteCache.set(key, off);
      return off;
    }
    const drops: Particle[] = [];
    const flakes: Particle[] = [];

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    function seed() {
      stars.length = 0;
      clouds.length = 0;
      drops.length = 0;
      flakes.length = 0;
      const area = (w * h) / 10000;
      for (let i = 0; i < area * 1.4; i++) {
        stars.push({ x: rand(0, w), y: rand(0, h * 0.75), vx: 0, vy: 0, size: rand(0.5, 1.6), alpha: rand(0.3, 1), seed: rand(0, 6.28) });
      }
      for (let i = 0; i < 7; i++) {
        clouds.push({
          x: rand(-0.2 * w, 1.2 * w),
          y: rand(0.05 * h, 0.55 * h),
          vx: rand(6, 16),
          vy: 0,
          size: rand(0.22, 0.42) * Math.max(w, 600),
          alpha: rand(0.5, 0.95),
          seed: rand(0, 6.28),
        });
      }
      for (let i = 0; i < area * 2.2; i++) {
        drops.push({ x: rand(0, w), y: rand(0, h), vx: rand(-60, -30), vy: rand(700, 1000), size: rand(8, 18), alpha: rand(0.25, 0.6), seed: 0 });
      }
      for (let i = 0; i < area * 1.1; i++) {
        flakes.push({ x: rand(0, w), y: rand(0, h), vx: 0, vy: rand(25, 55), size: rand(1.2, 3.4), alpha: rand(0.5, 0.95), seed: rand(0, 6.28) });
      }
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      // 1.5x is visually indistinguishable for soft gradients and halves fill cost on 3x phones.
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      spriteCache.clear();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function drawSun(s: SkyState) {
      if (s.sunProgress < -0.05 || s.sunProgress > 1.05) return;
      const p = Math.min(1, Math.max(0, s.sunProgress));
      const x = w * (0.1 + p * 0.8);
      const y = h * (0.78 - Math.sin(p * Math.PI) * 0.62);
      const r = Math.min(w, h) * 0.07;
      const isLow = Math.min(p, 1 - p) < 0.15;
      const core = isLow ? "#FFB27A" : "#FFF4D6";
      const glow = s.colors.glow;
      const pulse = reduce ? 0 : Math.sin(t * 0.8) * 0.04;
      const g = ctx!.createRadialGradient(x, y, r * 0.2, x, y, r * (4.2 + pulse * 10));
      g.addColorStop(0, hexA(glow, 0.9 * (s.family === "clear" ? 1 : 0.65)));
      g.addColorStop(0.35, hexA(glow, 0.22));
      g.addColorStop(1, hexA(glow, 0));
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, w, h);
      ctx!.beginPath();
      ctx!.arc(x, y, r * (1 + pulse), 0, Math.PI * 2);
      ctx!.fillStyle = core;
      ctx!.globalAlpha = s.family === "clear" || s.family === "partly" ? 1 : 0.35;
      ctx!.fill();
      ctx!.globalAlpha = 1;
    }

    function drawMoon(s: SkyState) {
      if (s.phase !== "night") return;
      const x = w * 0.78;
      const y = h * 0.22;
      const r = Math.min(w, h) * 0.05;
      const g = ctx!.createRadialGradient(x, y, r * 0.5, x, y, r * 5);
      g.addColorStop(0, "rgba(199,214,245,0.28)");
      g.addColorStop(1, "rgba(199,214,245,0)");
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, w, h);
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fillStyle = "#E9EEF8";
      ctx!.fill();
      // crescent shadow
      ctx!.beginPath();
      ctx!.arc(x - r * 0.45, y - r * 0.15, r * 0.92, 0, Math.PI * 2);
      ctx!.fillStyle = s.colors.top;
      ctx!.fill();
    }

    function drawStars(s: SkyState) {
      if (s.phase !== "night" || s.family === "cloudy" || s.family === "rain" || s.family === "storm" || s.family === "fog") return;
      const dim = s.family === "partly" || s.family === "snow" || s.family === "drizzle" ? 0.5 : 1;
      for (const st of stars) {
        const tw = reduce ? 1 : 0.6 + 0.4 * Math.sin(t * 1.3 + st.seed);
        ctx!.globalAlpha = st.alpha * tw * dim;
        ctx!.fillStyle = "#FFFFFF";
        ctx!.beginPath();
        ctx!.arc(st.x, st.y, st.size, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    }

    function cloudColor(s: SkyState): [string, string] {
      switch (s.family) {
        case "storm":
          return ["#2A3244", "#111827"];
        case "rain":
        case "drizzle":
          return s.phase === "night" ? ["#2B3442", "#171D28"] : ["#9AA6B6", "#6F7C8E"];
        case "cloudy":
        case "fog":
          return s.phase === "night" ? ["#2E3746", "#1B2230"] : ["#D9E0E8", "#A9B4C2"];
        case "snow":
          return s.phase === "night" ? ["#3A4454", "#242C3A"] : ["#F1F4F8", "#C9D3DF"];
        default:
          return s.phase === "night" ? ["#3B4660", "#222B40"] : ["#FFFFFF", "#DCE7F3"];
      }
    }

    function drawClouds(s: SkyState, dt: number) {
      if (s.family === "clear") return;
      const count = s.family === "partly" ? 3 : s.family === "fog" ? 4 : 7;
      const [light, dark] = cloudColor(s);
      for (let i = 0; i < count; i++) {
        const c = clouds[i];
        if (!reduce) c.x += c.vx * dt;
        if (c.x - c.size > w) c.x = -c.size;
        const y = c.y + (reduce ? 0 : Math.sin(t * 0.3 + c.seed) * 6);
        const sprite = cloudSprite(c.size, light, dark, c.seed);
        ctx!.globalAlpha = c.alpha;
        ctx!.drawImage(sprite, c.x - sprite.width / 2, y - sprite.height / 2);
        ctx!.globalAlpha = 1;
      }
    }

    function drawFog(s: SkyState) {
      if (s.family !== "fog") return;
      const g = ctx!.createLinearGradient(0, h * 0.3, 0, h);
      const col = s.phase === "night" ? "#2A3140" : "#DFE6EE";
      g.addColorStop(0, hexA(col, 0));
      g.addColorStop(1, hexA(col, 0.85));
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, w, h);
    }

    function drawRain(s: SkyState, dt: number) {
      if (!(s.family === "rain" || s.family === "drizzle" || s.family === "storm")) return;
      const count = s.family === "drizzle" ? drops.length * 0.4 : drops.length;
      ctx!.strokeStyle = s.phase === "night" ? "rgba(200,215,240,0.55)" : "rgba(255,255,255,0.65)";
      ctx!.lineWidth = s.family === "drizzle" ? 0.8 : 1.2;
      ctx!.lineCap = "round";
      ctx!.beginPath();
      for (let i = 0; i < count; i++) {
        const d = drops[i];
        if (!reduce) {
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          if (d.y > h + 20) {
            d.y = -20;
            d.x = rand(0, w + 100);
          }
        }
        ctx!.globalAlpha = d.alpha;
        ctx!.moveTo(d.x, d.y);
        ctx!.lineTo(d.x + d.vx * 0.02, d.y - d.size);
      }
      ctx!.stroke();
      ctx!.globalAlpha = 1;
    }

    function drawSnow(s: SkyState, dt: number) {
      if (s.family !== "snow") return;
      ctx!.fillStyle = "#FFFFFF";
      for (const f of flakes) {
        if (!reduce) {
          f.y += f.vy * dt;
          f.x += Math.sin(t * 0.9 + f.seed) * 18 * dt;
          if (f.y > h + 10) {
            f.y = -10;
            f.x = rand(0, w);
          }
        }
        ctx!.globalAlpha = f.alpha;
        ctx!.beginPath();
        ctx!.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    }

    function drawLightning(s: SkyState, dt: number) {
      if (s.family !== "storm" || reduce) return;
      nextFlash -= dt;
      if (nextFlash <= 0) {
        flash = 1;
        nextFlash = 3 + Math.random() * 7;
      }
      if (flash > 0) {
        ctx!.fillStyle = `rgba(230,236,255,${flash * 0.55})`;
        ctx!.fillRect(0, 0, w, h);
        flash = Math.max(0, flash - dt * 4);
      }
    }

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      const s = skyRef.current;
      ctx!.clearRect(0, 0, w, h);
      drawStars(s);
      drawSun(s);
      drawMoon(s);
      drawClouds(s, dt);
      drawFog(s);
      drawRain(s, dt);
      drawSnow(s, dt);
      drawLightning(s, dt);
      if (!reduce) raf = requestAnimationFrame(frame);
    }

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) frame(performance.now());
    });
    ro.observe(canvas);
    raf = requestAnimationFrame(frame);

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden />;
}

function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`;
}
