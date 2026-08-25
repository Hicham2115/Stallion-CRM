"use client";
import { KpiCard } from "@/components/admin/dashboard/kpi-card";
import { TickRuler } from "@/components/deck/tick-ruler";
import { repConfig } from "@/config/rep";
const { content, features, kpis } = repConfig;
// Same KpiCard/tick ruler/reveal choreography as the admin dashboard's
// cluster, with a first-person metric set from config/rep.ts. Doesn't reuse
// KpiCluster directly since that component passes one captionValue for the
// whole row, but a rep's cards each need a different supporting figure.
function captionFor(key, values) {
    if (key === "dialsToday")
        return values.dials;
    if (key === "appointments")
        return values.totalLeads;
    return undefined;
}
export function RepKpiCluster({ values }) {
    if (!features.kpiCluster)
        return null;
    return (<section aria-label={content.dashboard.kpiClusterLabel}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((definition, index) => (<KpiCard key={definition.key} definition={definition} value={values[definition.key]} captionValue={captionFor(definition.key, values)} revealDelay={60 + index * 70}/>))}
      </div>

      {features.clusterRuler && <TickRuler className="mt-5"/>}
    </section>);
}
