/** Slow-moving blurred colour fields for dark sections. Pure CSS, layered under content. */
export function Aurora({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <span className="aurora aurora-a" />
      <span className="aurora aurora-b" />
      <span className="aurora aurora-c" />
    </div>
  );
}
