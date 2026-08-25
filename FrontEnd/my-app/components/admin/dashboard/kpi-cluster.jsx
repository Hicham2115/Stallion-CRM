"use client";
import { KpiCard } from "@/components/admin/dashboard/kpi-card";
import { TickRuler } from "@/components/deck/tick-ruler";
import { adminConfig } from "@/config/admin";
import { useCrm } from "@/lib/store/crm-store";
import { selectKpis } from "@/lib/store/selectors";
const { content, features, kpis } = adminConfig.dashboard;
// Cards sit above a hairline tick ruler, same as the login footer, so the
// row reads as one instrument cluster. Every figure is derived in
// selectKpis(), never stored.
export function KpiCluster() {
    const { state } = useCrm();
    const values = selectKpis(state);
    if (!features.kpiCluster)
        return null;
    return (<section aria-label={content.kpiClusterLabel}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((definition, index) => (<KpiCard key={definition.key} definition={definition} value={values[definition.key]} captionValue={values.totalLeads} sparkline={state.teamDialsHistory} revealDelay={60 + index * 70}/>))}
      </div>

      {features.clusterRuler && <TickRuler className="mt-5"/>}
    </section>);
}
