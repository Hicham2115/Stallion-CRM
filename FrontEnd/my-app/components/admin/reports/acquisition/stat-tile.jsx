"use client";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

// KpiCard (components/admin/dashboard/kpi-card.jsx) assumes a real number
// and animates it with useCountUp — it has no way to render "this figure
// doesn't exist yet" versus "this figure is genuinely zero". Acquisition
// needs both: impressions/clicks are null because there's no ad-platform
// integration (UNAVAILABLE, not zero); ad_spend/applications can be a real
// 0 (NO DATA, still a fact). This is a separate, smaller component rather
// than a KpiCard variant because the null-handling is the entire point of
// it, not an add-on prop.
function display(value, format) {
  if (value === null || value === undefined) return null;
  switch (format) {
    case "currency":
      return formatCurrency(Math.round(value));
    case "percent":
      return formatPercent(value * 100, 1);
    case "minutes":
      return `${formatNumber(Math.round(value))} min`;
    default:
      return formatNumber(Math.round(value));
  }
}

export function StatTile({
  label,
  value,
  format = "number",
  unavailable = false,
  hint,
  emphasis = false,
}) {
  const shown = display(value, format);
  const isMissing = shown === null;

  return (
    <div
      className={cn(
        "deck-inset relative flex flex-col gap-2 rounded-2xl border border-hairline bg-deck-surface p-4",
        emphasis && "sm:p-5",
      )}
    >
      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </p>
      <p
        className={cn(
          "deck-nums font-display font-semibold leading-none tracking-[-0.03em]",
          emphasis ? "text-[2rem]" : "text-[1.5rem]",
          isMissing ? "text-ink-muted" : "text-ink",
        )}
        title={
          isMissing
            ? unavailable
              ? "Not connected — no ad-platform integration yet"
              : "Not enough data for this range"
            : undefined
        }
      >
        {isMissing ? (unavailable ? "Not connected" : "—") : shown}
      </p>
      {hint && <p className="text-[0.75rem] text-ink-muted">{hint}</p>}
    </div>
  );
}
