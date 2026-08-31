"use client";
import { useQuery } from "@tanstack/react-query";
import { KpiCard } from "@/components/admin/dashboard/kpi-card";
import { TickRuler } from "@/components/deck/tick-ruler";
import { adminConfig } from "@/config/admin";
import { liveKpisOf } from "@/config/pipeline-live";
import { api } from "@/lib/axios";
const { content, features, kpis } = adminConfig.dashboard;
// Cards sit above a hairline tick ruler, same as the login footer, so the
// row reads as one instrument cluster. All four figures come from
// liveKpisOf() (config/pipeline-live.js) — the same function Reports uses,
// just over the whole lead set instead of a date-ranged slice, so the two
// pages can never show two different numbers for "the same" KPI again (see
// the earlier session bug: this card used to read the all-time mock
// crm-store while Reports used real data — Attending Rate showed 65% here
// and 100% there, for no reason a person could explain).
export function KpiCluster() {
  const { data: leads } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => (await api.get("/api/leads")).data,
  });
  if (!features.kpiCluster) return null;
  const values = liveKpisOf(leads ?? []);
  return (
    <section aria-label={content.kpiClusterLabel}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((definition, index) => (
          <KpiCard
            key={definition.key}
            definition={definition}
            value={values[definition.key]}
            captionValue={values.totalLeads}
            revealDelay={60 + index * 70}
          />
        ))}
      </div>

      {features.clusterRuler && <TickRuler className="mt-5" />}
    </section>
  );
}
