"use client";
import { useQuery } from "@tanstack/react-query";
import { KpiCard } from "@/components/admin/dashboard/kpi-card";
import { TickRuler } from "@/components/deck/tick-ruler";
import { adminConfig } from "@/config/admin";
import { api } from "@/lib/axios";
import { useCrm } from "@/lib/store/crm-store";
import { selectKpis } from "@/lib/store/selectors";
const { content, features, kpis } = adminConfig.dashboard;
// Cards sit above a hairline tick ruler, same as the login footer, so the
// row reads as one instrument cluster. Every figure is derived in
// selectKpis(), never stored — except Total Clients, which is real: the
// other three (attending rate, conversion, dials) have no backend yet and
// stay sourced from the mock pipeline until they do.
export function KpiCluster() {
  const { state } = useCrm();
  const values = selectKpis(state);
  const { data: leads } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => (await api.get("/api/leads")).data,
  });
  if (!features.kpiCluster) return null;
  const realValues = leads ? { ...values, totalClients: leads.length } : values;
  return (
    <section aria-label={content.kpiClusterLabel}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((definition, index) => (
          <KpiCard
            key={definition.key}
            definition={
              definition.key === "totalClients"
                ? { ...definition, caption: "Captured from the site" }
                : definition
            }
            value={realValues[definition.key]}
            captionValue={realValues.totalLeads}
            sparkline={state.teamDialsHistory}
            revealDelay={60 + index * 70}
          />
        ))}
      </div>

      {features.clusterRuler && <TickRuler className="mt-5" />}
    </section>
  );
}
