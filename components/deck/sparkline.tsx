import { cn } from "@/lib/utils";

/**
 * A bare trend line — no axes, no labels, no dots.
 *
 * Hand-drawn SVG rather than Recharts on purpose: a sparkline is a shape, not a
 * chart, and it appears inside KPI cards where a `ResponsiveContainer` would
 * add a measurement pass and client JavaScript for eight points. This renders
 * on the server as plain markup.
 *
 * It is decorative context for the figure beside it, so it is aria-hidden — the
 * number is the information, and screen-reader users get that in full.
 */
export function Sparkline({
  data,
  className,
  strokeWidth = 1.75,
  /** Adds a soft fill under the line. Off inside dense cards. */
  fill = true,
}: {
  data: number[];
  className?: string;
  strokeWidth?: number;
  fill?: boolean;
}) {
  if (data.length < 2) return null;

  // Drawn in a fixed 100x32 viewBox and stretched by CSS, so callers size it
  // with a class and never have to think about coordinates.
  const width = 100;
  const height = 32;
  const pad = strokeWidth;

  const min = Math.min(...data);
  const max = Math.max(...data);
  // A flat series would divide by zero; render it as a centred straight line.
  const span = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - pad - ((value - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });

  const line = points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");

  const area = `${line} L${width} ${height} L0 ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
      className={cn("w-full", className)}
    >
      {fill && (
        <>
          <defs>
            {/* Ids must be unique per document, but this gradient is identical
                everywhere it is used, so one shared id is correct and avoids
                a useId() call that would force the component client-side. */}
            <linearGradient id="deck-spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand-lime)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--brand-lime)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#deck-spark-fill)" />
        </>
      )}
      <path
        d={line}
        fill="none"
        stroke="var(--brand-lime)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
