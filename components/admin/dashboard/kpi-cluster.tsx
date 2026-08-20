"use client";

import { KpiCard } from "@/components/admin/dashboard/kpi-card";
import { TickRuler } from "@/components/deck/tick-ruler";
import { adminConfig } from "@/config/admin";
import { useCrm } from "@/lib/store/crm-store";
import { selectKpis } from "@/lib/store/selectors";

const { content, features, kpis } = adminConfig.dashboard;

/**
 * The four headline gauges.
 *
 * THE SIGNATURE MOMENT: the cards sit above a hairline tick ruler — the same
 * ruler as the login footer — so the row reads as one instrument cluster rather
 * than four cards that happen to be next to each other. It is the cheapest
 * possible piece of chrome and it does most of the work of making this screen
 * feel like the same product as the sign-in page.
 *
 * Every figure is DERIVED in `selectKpis()`, never stored. That file documents
 * each formula for whoever serves these from the API later.
 */
export function KpiCluster() {
  const { state } = useCrm();
  const values = selectKpis(state);

  if (!features.kpiCluster) return null;

  return (
    <section aria-label={content.kpiClusterLabel}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((definition, index) => (
          <KpiCard
            key={definition.key}
            definition={definition}
            value={values[definition.key]}
            // Only the "of N total leads" caption needs a second figure.
            captionValue={values.totalLeads}
            sparkline={state.teamDialsHistory}
            // 70ms apart: enough to read as a sweep left-to-right, short enough
            // that the whole row has landed in under a third of a second.
            revealDelay={60 + index * 70}
          />
        ))}
      </div>

      {features.clusterRuler && <TickRuler className="mt-5" />}
    </section>
  );
}
