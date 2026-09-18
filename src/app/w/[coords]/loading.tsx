export default function Loading() {
  return (
    <div className="sky-bg min-h-[100svh] pt-24" aria-busy="true" aria-label="Loading forecast">
      <div className="mx-auto max-w-7xl animate-pulse px-4 sm:px-6">
        <div className="h-10 w-28 rounded-full bg-ink/10" />
        <div className="mt-24 h-4 w-48 rounded bg-ink/10" />
        <div className="mt-4 h-20 w-3/4 max-w-xl rounded-2xl bg-ink/10" />
        <div className="mt-8 h-40 w-64 rounded-3xl bg-ink/10" />
        <div className="mt-24 h-72 rounded-3xl bg-ink/10" />
      </div>
    </div>
  );
}
