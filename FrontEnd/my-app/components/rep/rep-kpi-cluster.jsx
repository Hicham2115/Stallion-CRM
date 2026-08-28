"use client";
import { KpiCard } from "@/components/admin/dashboard/kpi-card";
import { DialsTodayCard } from "@/components/rep/dials-today-card";
import { TickRuler } from "@/components/deck/tick-ruler";
import { repConfig } from "@/config/rep";
const { content, features, kpis } = repConfig;
// Same KpiCard/tick ruler/reveal choreography as the admin dashboard's
// cluster, with a first-person metric set from config/rep.ts. Doesn't reuse
// KpiCluster directly since that component passes one captionValue for the
// whole row, but a rep's cards each need a different supporting figure.
//
// "dialsToday" is real (GET/PATCH /api/dials/today) and editable — a rep
// types their own count in, no phone-system integration exists to read it
// from. Every other card here stays on the mock crm-store for now.
function captionFor(key, values) {
    if (key === "appointments")
        return values.totalLeads;
    return undefined;
}
export function RepKpiCluster({ values }) {
    if (!features.kpiCluster)
        return null;
    return (<section aria-label={content.dashboard.kpiClusterLabel}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((definition, index) => definition.key === "dialsToday" ? (<DialsTodayCard key={definition.key} definition={definition} revealDelay={60 + index * 70}/>) : (<KpiCard key={definition.key} definition={definition} value={values[definition.key]} captionValue={captionFor(definition.key, values)} revealDelay={60 + index * 70}/>))}
      </div>

      {features.clusterRuler && <TickRuler className="mt-5"/>}
    </section>);
}
