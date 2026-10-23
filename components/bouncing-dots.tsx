// The "…" after Skaffen's Thinking / Writing status: three dots that hop one after
// another, one hop cycle every `duration` seconds. Reduced motion leaves them still
// (globals.css). Used by the reply status and the /admin motion preview.
export function BouncingDots({ duration }: { duration: number }) {
  return (
    <span className="inline-flex">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="status-dot inline-block"
          style={{ animationDuration: `${duration}s`, animationDelay: `${dot * duration * 0.15}s` }}
        >
          .
        </span>
      ))}
    </span>
  );
}
