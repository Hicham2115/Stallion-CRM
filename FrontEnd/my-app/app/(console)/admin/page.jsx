import { ClientStatus } from "@/components/admin/dashboard/client-status";
import { KpiCluster } from "@/components/admin/dashboard/kpi-cluster";
import { PipelineBreakdown } from "@/components/admin/dashboard/pipeline-breakdown";
import { RepLeaderboard } from "@/components/admin/dashboard/rep-leaderboard";
import { adminConfig } from "@/config/admin";
import { PageShell } from "@/components/console/page-shell";
export const metadata = {
  title: "Dashboard",
  description:
    "Pipeline overview for the Stallion Advertising sales team — clients, attending rate, conversion and rep performance.",
};
const { features } = adminConfig.dashboard;
// Server Component owning only layout; each widget is a Client Component
// reading the CRM store since the mock data lives in the browser.
//
// TODO(backend): once the API is live, this page should await the data
// server-side and pass it down as props instead. See lib/store/selectors.ts
// for every figure the API would need to return.
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
