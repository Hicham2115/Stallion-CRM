import { cn } from "@/lib/utils";
// Hand-drawn SVG rather than Recharts — a sparkline is a shape, not a chart,
// and this renders on the server as plain markup with no measurement pass.
// aria-hidden since it's decorative context for the figure beside it.
export function Sparkline({ data, className, strokeWidth = 1.75,
/** Adds a soft fill under the line. Off inside dense cards. */
fill = true, }) {
    if (data.length < 2)
        return null;
    // Fixed 100x32 viewBox, stretched by CSS, so callers just size it with a class.
    const width = 100;
    const height = 32;
    const pad = strokeWidth;
    const min = Math.min(...data);
    const max = Math.max(...data);
    // A flat series would divide by zero; render a centred straight line instead.
    const span = max - min || 1;
    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - pad - ((value - min) / span) * (height - pad * 2);
        return [x, y];
    });
    const line = points
        .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
        .join(" ");
    const area = `${line} L${width} ${height} L0 ${height} Z`;
    return (<svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden className={cn("w-full", className)}>
      {fill && (<>
          <defs>
            {/* One shared id is correct since this gradient is identical
                everywhere it's used — avoids a useId() call that would force
                this component client-side. */}
            <linearGradient id="deck-spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand-lime)" stopOpacity="0.28"/>
              <stop offset="100%" stopColor="var(--brand-lime)" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={area} fill="url(#deck-spark-fill)"/>
        </>)}
      <path d={line} fill="none" stroke="var(--brand-lime)" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
    </svg>);
}
