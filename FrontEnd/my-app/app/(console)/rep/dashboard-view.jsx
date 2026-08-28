"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PipelineBreakdown } from "@/components/admin/dashboard/pipeline-breakdown";
import { LeadDetailsDialog } from "@/components/console/lead-details-dialog";
import { PageShell } from "@/components/console/page-shell";
import { MyClientsPanel } from "@/components/rep/my-clients-panel";
import { RepKpiCluster } from "@/components/rep/rep-kpi-cluster";
import { RepSkeleton } from "@/components/rep/rep-states";
import { WON_STAGE_IDS, liveKpisOf } from "@/config/pipeline-live";
import { repConfig } from "@/config/rep";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/lib/get-error-message";
const { content, features } = repConfig;
// The agency dashboard, same real leads as /admin (GET /api/leads,
// unscoped — matches My Pipeline, which shows every lead too, not just
// this rep's own), same liveKpisOf()/PipelineBreakdown the admin dashboard
// already uses for its own real KpiCluster. Deliberately omits the rep
// leaderboard — ranking the whole team by dials belongs on the admin
// dashboard, not inherited into a rep's own workspace as an uninvited
// scoreboard.
export function RepDashboardView() {
    const [selectedLead, setSelectedLead] = useState(null);
    const {
        data: leads = [],
        isPending,
        isError,
        error,
    } = useQuery({
        queryKey: ["leads"],
        queryFn: async () => (await api.get("/api/leads")).data,
    });

    useEffect(() => {
        if (isError) toast.error(getErrorMessage(error));
    }, [isError, error]);

    if (isPending) return <RepSkeleton />;

    const kpis = liveKpisOf(leads);
    const clients = leads
        .filter((lead) => WON_STAGE_IDS.includes(lead.stage))
        .map((lead) => ({ id: lead.id, name: lead.full_name, company: lead.business_type, lead }));

    return (<PageShell>
      <RepKpiCluster values={kpis}/>

      {(features.leadsByStage || features.clientsPanel) && (<div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {features.leadsByStage && (<div className="lg:col-span-7 xl:col-span-8">
              <PipelineBreakdown leads={leads} live title={content.dashboard.leadsByStageTitle} hint={content.dashboard.leadsByStageHint}/>
            </div>)}

          {features.clientsPanel && (<div className="lg:col-span-5 xl:col-span-4">
              <MyClientsPanel clients={clients} onSelect={setSelectedLead}/>
            </div>)}
        </div>)}

      <LeadDetailsDialog lead={selectedLead} open={selectedLead !== null} onOpenChange={(open) => {
            if (!open) setSelectedLead(null);
        }}/>
    </PageShell>);
}
