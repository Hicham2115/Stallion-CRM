"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileBarChart } from "lucide-react";
import { toast } from "sonner";
import { KpiCard } from "@/components/admin/dashboard/kpi-card";
import { PageShell } from "@/components/console/page-shell";
import { SourceBreakdown } from "@/components/admin/reports/source-breakdown";
import { ReportToolbar } from "@/components/admin/reports/report-toolbar";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel } from "@/components/deck/panel";
import { adminConfig } from "@/config/admin";
import { daysInStage, liveKpisOf, liveStageLabel } from "@/config/pipeline-live";
import { findRange, reportsConfig } from "@/config/reports";
import { api } from "@/lib/axios";
import { downloadCsv, stampedFilename } from "@/lib/export";
import { formatDelta, formatDeltaPoints, template } from "@/lib/format";
import { getErrorMessage } from "@/lib/get-error-message";
const { content, features, kpis } = reportsConfig;
/** Which KPIs are percentages, and so move in POINTS rather than percent. */
const POINT_KPIS = new Set(["conversionRate", "attendingRate", "consultToMvpRate"]);

function daysAgo(iso) {
  if (!iso) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

function inRange(leads, days) {
  if (days <= 0) return leads;
  return leads.filter((lead) => (daysAgo(lead.created_at) ?? Infinity) <= days);
}

function inPreviousRange(leads, days) {
  if (days <= 0) return [];
  return leads.filter((lead) => {
    const age = daysAgo(lead.created_at);
    return age !== null && age > days && age <= days * 2;
  });
}

/** Where the leads came from — real lead_attributions.utm_source, "Direct"
 *  for none (same fallback the Pipeline card uses). Scaled to the total,
 *  not the top source — see the removed selectSourceBreakdown's comment
 *  for why that distinction matters (a bar's width must match its %). */
function sourceBreakdownOf(leads) {
  const total = leads.length;
  const counts = new Map();
  for (const lead of leads) {
    const source = lead.attribution?.utm_source || "Direct";
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([source, count]) => ({ source, count, share: total === 0 ? 0 : (count / total) * 100 }))
    .sort((a, b) => b.count - a.count);
}

// Range state is local, not a URL search param — no shareable-report-link
// pattern exists anywhere in this app yet.
export function ReportsView() {
  const [rangeDays, setRangeDays] = useState(reportsConfig.defaultRangeDays);
  const range = findRange(rangeDays);

  const { data: allLeads = [], isPending, isError, error } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => (await api.get("/api/leads")).data,
  });

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error));
  }, [isError, error]);

  const view = useMemo(() => {
    const leads = inRange(allLeads, rangeDays);
    const previous = inPreviousRange(allLeads, rangeDays);
    return {
      leads,
      previous,
      current: liveKpisOf(leads),
      prior: liveKpisOf(previous),
      sources: sourceBreakdownOf(leads),
    };
  }, [allLeads, rangeDays]);

  function valueOf(key, which) {
    return which === "current" ? view.current[key] : view.prior[key];
  }

  // No chip (undefined) for the all-time range, which has no preceding
  // period, and for an empty preceding period, where a percentage change
  // would be a division by zero.
  function deltaOf(key) {
    if (!features.periodDeltas || rangeDays <= 0) return undefined;
    if (view.previous.length === 0) return undefined;
    const now = valueOf(key, "current");
    const before = valueOf(key, "prior");
    const isPoints = POINT_KPIS.has(key);
    const change = isPoints ? now - before : before === 0 ? 0 : ((now - before) / before) * 100;
    if (!Number.isFinite(change)) return undefined;
    const rounded = Number(change.toFixed(1));
    return {
      label: isPoints ? formatDeltaPoints(change) : formatDelta(change),
      direction: rounded > 0 ? "up" : rounded < 0 ? "down" : "flat",
      title: template(content.deltaTooltip, { range: range.comparisonLabel }),
    };
  }

  function handleExportCsv() {
    const rows = view.leads.map((lead) => [
      lead.full_name,
      lead.business_type,
      lead.email,
      lead.phone,
      lead.attribution?.utm_source || "Direct",
      liveStageLabel(lead.stage),
      lead.assigned_sales?.name ?? "Unassigned",
      daysAgo(lead.created_at) ?? "",
      daysInStage(lead),
      lead.project_cost ?? "",
    ]);
    downloadCsv(
      stampedFilename(content.csvFilePrefix),
      [
        "Name",
        "Business",
        "Email",
        "Phone",
        "Source",
        "Stage",
        "Assigned rep",
        "Days since created",
        "Days in stage",
        `Project cost (${adminConfig.currency})`,
      ],
      rows,
    );
    toast.success(template(content.exportToast, { n: String(rows.length) }), {
      description: template(content.exportToastDetail, { range: range.label }),
    });
  }

  const empty = !isPending && view.leads.length === 0;

  return (
    <PageShell>
      <ReportToolbar
        rangeDays={rangeDays}
        onRangeChange={setRangeDays}
        onExportCsv={handleExportCsv}
        exportCount={view.leads.length}
      />

      {isPending ? null : empty ? (
        <Panel>
          <EmptyState icon={FileBarChart} title={content.emptyTitle} description={content.emptyDescription} />
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((definition, index) => (
              <KpiCard
                key={definition.key}
                definition={definition}
                value={valueOf(definition.key, "current")}
                captionValue={view.current.totalLeads}
                delta={deltaOf(definition.key)}
                revealDelay={index * 60}
              />
            ))}
          </div>

          {features.sourceBreakdown && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SourceBreakdown rows={view.sources} />
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
