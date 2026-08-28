import { PageShell } from "@/components/console/page-shell";
import { consoleConfig } from "@/config/console";
// Streamed placeholder; blocks match the real layout's proportions and
// PageShell so the content doesn't jump or shift sideways when it arrives.
function Block({ className }) {
  return (
    <div
      className={`deck-inset animate-pulse rounded-2xl border border-hairline bg-deck-surface ${className ?? ""}`}
    />
  );
}
export default function AdminDashboardLoading() {
  return (
    <PageShell aria-busy aria-label={consoleConfig.content.loadingLabel}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Block className="h-[10.5rem]" />
        <Block className="h-[10.5rem]" />
        <Block className="h-[10.5rem]" />
        <Block className="h-[10.5rem]" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Block className="h-[24rem] lg:col-span-7 xl:col-span-8" />
        <Block className="h-[24rem] lg:col-span-5 xl:col-span-4" />
      </div>

      <Block className="h-[28rem]" />
    </PageShell>
  );
}
