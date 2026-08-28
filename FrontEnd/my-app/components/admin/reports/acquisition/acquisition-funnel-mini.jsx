"use client";
import { PanelHeader } from "@/components/deck/panel";
import { formatNumber, formatPercent } from "@/lib/format";

// A separate, smaller funnel from FunnelView (components/admin/pipeline/
// funnel-view.jsx) on purpose — that one draws pipeline STAGE reach and
// needs stage-history tracking this app doesn't have. This one draws the
// acquisition application funnel (Leads -> App Started -> App Completed ->
// Consult Booked), which the /api/analytics/kpis `acquisition` block
// already returns as exact counts — no reach/history math needed, so
// reusing FunnelView's more complex reach-walk logic would be the wrong
// tool, not a shortcut.
export function AcquisitionFunnelMini({ acquisition }) {
  const steps = [
    { label: "Leads", value: acquisition.leads },
    { label: "Applications Started", value: acquisition.applications_started },
    { label: "Applications Completed", value: acquisition.applications_completed },
    { label: "Consult Booked", value: acquisition.consult_booked },
  ];
  const widest = steps[0].value || 1;

  return (
    <div className="deck-inset rounded-2xl border border-hairline bg-deck-surface">
      <PanelHeader
        title="Application Funnel"
        hint="Leads → Started → Completed → Booked"
      />
      <div className="p-5 pt-4 sm:p-6 sm:pt-4">
        <ol className="flex flex-col gap-4">
          {steps.map((step, index) => {
            const width = (step.value / widest) * 100;
            const previous = index > 0 ? steps[index - 1].value : null;
            const conversion =
              previous && previous > 0 ? (step.value / previous) * 100 : null;
            return (
              <li key={step.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-[0.875rem] text-ink-soft">
                    {step.label}
                  </span>
                  <span className="flex shrink-0 items-baseline gap-3">
                    {conversion !== null && (
                      <span className="deck-nums font-mono text-[0.625rem] tracking-[0.06em] text-ink-muted">
                        {formatPercent(conversion, 1)} of previous
                      </span>
                    )}
                    <span className="deck-nums font-display text-[1.0625rem] font-semibold text-ink">
                      {formatNumber(step.value)}
                    </span>
                  </span>
                </div>
                <div
                  aria-hidden
                  className="mt-2 flex h-7 justify-center overflow-hidden rounded-md bg-white/[0.03]"
                >
                  <div
                    className="h-full rounded-md bg-[var(--stage-4)] transition-[width] duration-700 ease-out"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
