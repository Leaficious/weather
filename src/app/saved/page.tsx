import type { Metadata } from "next";
import { SkyTheme } from "@/components/SkyTheme";
import { SavedList } from "@/components/SavedList";

export const metadata: Metadata = { title: "Saved places", description: "Your saved skies, side by side." };

export default function SavedPage() {
  return (
    <div className="bg-paper pt-24 text-ink">
      <SkyTheme sky={null} />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
        <p className="eyebrow text-ink/50">Saved places</p>
        <h1 className="display mt-2 text-4xl sm:text-6xl">Your skies.</h1>
        <SavedList />
      </div>
    </div>
  );
}
