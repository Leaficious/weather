import Link from "next/link";
import { SkyTheme } from "@/components/SkyTheme";
import { SearchBox } from "@/components/SearchBox";

export default function NotFound() {
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center bg-paper px-4 pt-24 text-center text-ink">
      <SkyTheme sky={null} />
      <p className="eyebrow text-ink/50">404</p>
      <h1 className="display mt-3 text-5xl sm:text-7xl">Off the map.</h1>
      <p className="mt-4 max-w-md text-ink/65">That page isn&apos;t here. Search for a place instead.</p>
      <div className="mt-8 w-full max-w-lg text-left">
        <SearchBox size="sm" />
      </div>
      <Link href="/" className="mt-6 text-sm font-semibold underline underline-offset-4">
        Back to the sky
      </Link>
    </div>
  );
}
