"use client";

import { KpiCard } from "@/components/admin/dashboard/kpi-card";
import { TickRuler } from "@/components/deck/tick-ruler";
import { repConfig, type RepKpiKey } from "@/config/rep";
import type { RepKpiValues } from "@/lib/store/selectors";

const { content, features, kpis } = repConfig;

/**
 * ============================================================================
 *  A REP'S FOUR GAUGES
 * ============================================================================
 *  The same instrument cluster as the admin dashboard — same `KpiCard`, same
 *  tick ruler underneath, same reveal choreography — carrying a first-person
 *  metric set declared in config/rep.ts.
 *
 *  WHY NOT REUSE `KpiCluster` DIRECTLY. That component reads `selectKpis()`
 *  itself and passes ONE `captionValue` for the whole row. A rep's cards need
 *  different supporting figures per card: the dials card carries the all-time
 *  total, the appointments card carries the lead count. Threading a
 *  per-card lookup through the admin cluster would make it worse at its own
 *  job; a fourteen-line sibling that maps its own captions is the cheaper half
 *  of the trade, and the CARD — the part with all the design in it — is still
 *  shared.
 *
 *  Every figure is DERIVED in `selectRepKpis()` from the rep's own leads, using
 *  the same formulas the admin dashboard uses over the whole database. That is
 *  what stops a rep and their manager reading two different conversion rates
 *  for the same person.
 * ============================================================================
 */

/**
 * The supporting figure each card's `{n}` caption needs.
 *
 * A lookup rather than a prop, so adding a card to `repConfig.kpis` with a
 * caption means adding one line here — and forgetting to shows up as a "0" in
 * review rather than as a crash in production.
 */
function captionFor(key: RepKpiKey, values: RepKpiValues): number | undefined {
  if (key === "dialsToday") return values.dials;
  if (key === "appointments") return values.totalLeads;
  return undefined;
}

export function RepKpiCluster({ values }: { values: RepKpiValues }) {
  if (!features.kpiCluster) return null;

  return (
    <section aria-label={content.dashboard.kpiClusterLabel}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((definition, index) => (
          <KpiCard
            key={definition.key}
            definition={definition}
            value={values[definition.key]}
            captionValue={captionFor(definition.key, values)}
            // 70ms apart, matching the admin cluster: enough to read as a sweep
            // left-to-right, short enough that the row lands in under a third
            // of a second.
            revealDelay={60 + index * 70}
          />
        ))}
      </div>

      {features.clusterRuler && <TickRuler className="mt-5" />}
    </section>
  );
}
