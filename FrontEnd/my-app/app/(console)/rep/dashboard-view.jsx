"use client";
import { PipelineBreakdown } from "@/components/admin/dashboard/pipeline-breakdown";
import { PageShell } from "@/components/console/page-shell";
import { MyClientsPanel } from "@/components/rep/my-clients-panel";
import { RepKpiCluster } from "@/components/rep/rep-kpi-cluster";
import { RepMissing, RepSkeleton } from "@/components/rep/rep-states";
import { useRepScope } from "@/components/rep/use-rep-scope";
import { repConfig } from "@/config/rep";
const { content, features } = repConfig;
// The agency dashboard narrowed to one rep. PipelineBreakdown is the admin's
// same component (leads prop + different heading) so a rep and their manager
// are looking at the same chart. Deliberately omits the rep leaderboard —
// ranking the whole team by dials belongs on the admin dashboard, not
// inherited into a rep's own workspace as an uninvited scoreboard.
export function RepDashboardView() {
    const { leads, clients, kpis, loading, rep } = useRepScope();
    if (loading)
        return <RepSkeleton />;
    if (!rep)
        return <RepMissing />;
    return (<PageShell>
      <RepKpiCluster values={kpis}/>

      {(features.leadsByStage || features.clientsPanel) && (<div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {features.leadsByStage && (<div className="lg:col-span-7 xl:col-span-8">
              <PipelineBreakdown leads={leads} title={content.dashboard.leadsByStageTitle} hint={content.dashboard.leadsByStageHint}/>
            </div>)}

          {features.clientsPanel && (<div className="lg:col-span-5 xl:col-span-4">
              <MyClientsPanel clients={clients}/>
            </div>)}
        </div>)}
    </PageShell>);
}
