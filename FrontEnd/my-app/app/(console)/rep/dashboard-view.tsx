"use client";

import { PipelineBreakdown } from "@/components/admin/dashboard/pipeline-breakdown";
import { PageShell } from "@/components/console/page-shell";
import { MyClientsPanel } from "@/components/rep/my-clients-panel";
import { RepKpiCluster } from "@/components/rep/rep-kpi-cluster";
import { RepMissing, RepSkeleton } from "@/components/rep/rep-states";
import { useRepScope } from "@/components/rep/use-rep-scope";
import { repConfig } from "@/config/rep";

const { content, features } = repConfig;

/**
 * ============================================================================
 *  /rep — A REP'S OWN DASHBOARD
 * ============================================================================
 *  The agency dashboard, narrowed to one person and rewritten in the first
 *  person:
 *
 *    what I did today, and what it produced      RepKpiCluster
 *    where my leads sit                          PipelineBreakdown (scoped)
 *    who I have converted                        MyClientsPanel
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  THE STAGE BREAKDOWN IS THE ADMIN'S COMPONENT
 *  ─────────────────────────────────────────────────────────────────────────
 *  Same bars, same lime ramp, same "Lost sits below the rule" treatment — with
 *  a `leads` prop and a different heading. That is deliberate beyond saving
 *  code: a rep and their manager discussing the same pipeline need to be
 *  looking at the same chart, or half the conversation is spent establishing
 *  that they are.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  WHAT IS DELIBERATELY ABSENT
 *  ─────────────────────────────────────────────────────────────────────────
 *  The rep leaderboard. It is the admin dashboard's fourth panel and it ranks
 *  the whole team by dials — genuinely useful to a manager, and on a rep's own
 *  screen it turns a workspace into a scoreboard they did not ask to be on.
 *  If the agency wants that, it should be a deliberate product decision with a
 *  flag, not something inherited by reusing a layout.
 *
 *  LAYOUT is asymmetric for the same reason the admin's is: the bars need width
 *  to stay comparable, the client list does not.
 * ============================================================================
 */
export function RepDashboardView() {
  const { leads, clients, kpis, loading, rep } = useRepScope();

  if (loading) return <RepSkeleton />;
  if (!rep) return <RepMissing />;

  return (
    <PageShell>
      <RepKpiCluster values={kpis} />

      {(features.leadsByStage || features.clientsPanel) && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {features.leadsByStage && (
            <div className="lg:col-span-7 xl:col-span-8">
              <PipelineBreakdown
                leads={leads}
                title={content.dashboard.leadsByStageTitle}
                hint={content.dashboard.leadsByStageHint}
              />
            </div>
          )}

          {features.clientsPanel && (
            <div className="lg:col-span-5 xl:col-span-4">
              <MyClientsPanel clients={clients} />
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
