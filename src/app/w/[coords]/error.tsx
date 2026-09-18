"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function ForecastError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center bg-paper px-4 pt-24 text-center text-ink">
      <p className="eyebrow text-ink/50">Forecast unavailable</p>
      <h1 className="display mt-3 text-4xl sm:text-6xl">The weather service didn&apos;t answer.</h1>
      <p className="mt-4 max-w-md text-ink/65">
        This is usually a brief network hiccup. Try again, or search for a different place.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-solar h-12 px-6">
          <RefreshCw className="h-4 w-4" aria-hidden /> Try again
        </button>
        <Link href="/" className="btn btn-ink h-12 px-6">
          Back to search
        </Link>
      </div>
    </div>
  );
}
