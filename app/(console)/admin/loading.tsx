import { PageShell } from "@/components/console/page-shell";
import { consoleConfig } from "@/config/console";

/**
 * Streamed placeholder for the dashboard.
 *
 * Next renders this instantly while `page.tsx` resolves. The blocks match the
 * real layout's proportions on purpose — a skeleton that is the wrong shape
 * makes the page visibly jump when the content arrives, which reads as slower
 * than showing nothing at all.
 *
 * It shares `PageShell` with the real page for the same reason: if the two
 * disagreed about the content width, every load would end with a sideways
 * shift.
 */
function Block({ className }: { className?: string }) {
  return (
    <div
      className={`deck-inset animate-pulse rounded-2xl border border-hairline bg-deck-surface ${className ?? ""}`}
    />
  );
}

export default function AdminDashboardLoading() {
  return (
    <PageShell aria-busy aria-label={consoleConfig.content.loadingLabel}>
      {/* KPI cluster */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Block className="h-[10.5rem]" />
        <Block className="h-[10.5rem]" />
        <Block className="h-[10.5rem]" />
        <Block className="h-[10.5rem]" />
      </div>

      {/* Breakdown + status */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Block className="h-[24rem] lg:col-span-7 xl:col-span-8" />
        <Block className="h-[24rem] lg:col-span-5 xl:col-span-4" />
      </div>

      {/* Leaderboard */}
      <Block className="h-[28rem]" />
    </PageShell>
  );
}
