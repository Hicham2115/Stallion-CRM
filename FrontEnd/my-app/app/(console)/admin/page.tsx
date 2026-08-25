import type { Metadata } from "next";

import { ClientStatus } from "@/components/admin/dashboard/client-status";
import { KpiCluster } from "@/components/admin/dashboard/kpi-cluster";
import { PipelineBreakdown } from "@/components/admin/dashboard/pipeline-breakdown";
import { RepLeaderboard } from "@/components/admin/dashboard/rep-leaderboard";
import { adminConfig } from "@/config/admin";
import { PageShell } from "@/components/console/page-shell";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Pipeline overview for the Stallion Advertising sales team — clients, attending rate, conversion and rep performance.",
};

const { features } = adminConfig.dashboard;

/**
 * /admin — the console home.
 *
 * The page itself is a Server Component and owns nothing but layout. Each
 * widget is a Client Component that reads from the CRM store, because the mock
 * data lives in the browser.
 *
 * TODO(backend): once the API is live, the natural shape is the reverse — this
 * page awaits the data on the server and passes it down as props, so the
 * widgets stop needing the store at all. The selectors in
 * lib/store/selectors.ts document every figure the API would need to return.
 *
 * LAYOUT is deliberately asymmetric. A 12-column grid gives the breakdown 7
 * and the status list 5, rather than splitting them evenly: the bars need the
 * width to stay comparable, the list does not. Symmetry here would be the
 * generic-dashboard default and would make both panels slightly wrong.
 *
 * The page heading lives in the topbar (it is looked up from the route in
 * config/navigation.ts), which is why there is no <h1> here.
 */
export default function AdminDashboardPage() {
  return (
    <PageShell>
      <KpiCluster />

      {(features.pipelineBreakdown || features.clientStatus) && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {features.pipelineBreakdown && (
            <div className="lg:col-span-7 xl:col-span-8">
              <PipelineBreakdown />
            </div>
          )}
          {features.clientStatus && (
            <div className="lg:col-span-5 xl:col-span-4">
              <ClientStatus />
            </div>
          )}
        </div>
      )}

      {features.repLeaderboard && <RepLeaderboard />}
    </PageShell>
  );
}
