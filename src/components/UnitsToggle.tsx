"use client";

import { motion } from "framer-motion";
import { useUnits } from "./Providers";

export function UnitsToggle() {
  const { units, setUnits } = useUnits();
  const options = [
    { id: "metric", label: "°C", name: "Celsius" },
    { id: "imperial", label: "°F", name: "Fahrenheit" },
  ] as const;

  return (
    <div
      role="radiogroup"
      aria-label="Temperature units"
      className="surface relative flex h-9 items-center rounded-full p-1 text-xs font-semibold"
    >
      {options.map((o) => {
        const active = units === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.name}
            onClick={() => setUnits(o.id)}
            className="relative z-10 grid h-7 w-10 place-items-center rounded-full transition-colors"
            style={{ color: active ? "var(--ink)" : "var(--sky-text)" }}
          >
            {active && (
              <motion.span
                layoutId="units-pill"
                className="absolute inset-0 -z-10 rounded-full bg-solar"
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
              />
            )}
            <span className="num">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
