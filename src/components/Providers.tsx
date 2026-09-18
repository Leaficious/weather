"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createStore } from "@/lib/store";
import type { Place, Units } from "@/lib/weather";
import { placeKey } from "@/lib/weather";

/* ---------------- Units ---------------- */
interface UnitsCtx {
  units: Units;
  setUnits: (u: Units) => void;
  toggle: () => void;
}
const UnitsContext = createContext<UnitsCtx | null>(null);

/* ---------------- Favorites ---------------- */
interface FavCtx {
  favorites: Place[];
  isSaved: (p: Place) => boolean;
  toggleSave: (p: Place) => boolean;
  remove: (p: Place) => void;
  hydrated: boolean;
}
const FavContext = createContext<FavCtx | null>(null);

/* ---------------- Toasts ---------------- */
export interface Toast {
  id: number;
  message: string;
  tone: "neutral" | "success" | "error";
}
interface ToastCtx {
  toasts: Toast[];
  toast: (message: string, tone?: Toast["tone"]) => void;
  dismiss: (id: number) => void;
}
const ToastContext = createContext<ToastCtx | null>(null);

const unitsStore = createStore<Units>("skyfield:units", "metric");
const favStore = createStore<Place[]>("skyfield:favorites", []);
const noopSubscribe = () => () => {};

export function Providers({ children }: { children: ReactNode }) {
  const units = useSyncExternalStore(unitsStore.subscribe, unitsStore.read, unitsStore.getServerSnapshot);
  const favorites = useSyncExternalStore(favStore.subscribe, favStore.read, favStore.getServerSnapshot);
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const setUnits = useCallback((u: Units) => unitsStore.write(u), []);
  const toggle = useCallback(() => setUnits(units === "metric" ? "imperial" : "metric"), [units, setUnits]);

  const isSaved = useCallback((p: Place) => favorites.some((f) => placeKey(f) === placeKey(p)), [favorites]);
  const toggleSave = useCallback(
    (p: Place): boolean => {
      const key = placeKey(p);
      const exists = favorites.some((f) => placeKey(f) === key);
      favStore.write(exists ? favorites.filter((f) => placeKey(f) !== key) : [...favorites, p]);
      return !exists;
    },
    [favorites],
  );
  const remove = useCallback(
    (p: Place) => {
      favStore.write(favorites.filter((f) => placeKey(f) !== placeKey(p)));
    },
    [favorites],
  );

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (message: string, tone: Toast["tone"] = "neutral") => {
      const id = ++idRef.current;
      setToasts((t) => [...t.slice(-3), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 3800);
    },
    [dismiss],
  );

  const unitsValue = useMemo(() => ({ units, setUnits, toggle }), [units, setUnits, toggle]);
  const favValue = useMemo(
    () => ({ favorites, isSaved, toggleSave, remove, hydrated }),
    [favorites, isSaved, toggleSave, remove, hydrated],
  );
  const toastValue = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);

  return (
    <UnitsContext.Provider value={unitsValue}>
      <FavContext.Provider value={favValue}>
        <ToastContext.Provider value={toastValue}>{children}</ToastContext.Provider>
      </FavContext.Provider>
    </UnitsContext.Provider>
  );
}

export function useUnits(): UnitsCtx {
  const ctx = useContext(UnitsContext);
  if (!ctx) throw new Error("useUnits must be used inside <Providers>");
  return ctx;
}
export function useFavorites(): FavCtx {
  const ctx = useContext(FavContext);
  if (!ctx) throw new Error("useFavorites must be used inside <Providers>");
  return ctx;
}
export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <Providers>");
  return ctx;
}
