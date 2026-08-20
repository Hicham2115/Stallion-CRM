"use client";

import { useMemo, useState } from "react";
import { FileBarChart } from "lucide-react";
import { toast } from "sonner";

import { KpiCard } from "@/components/admin/dashboard/kpi-card";
import { PageShell } from "@/components/console/page-shell";
import { DialsPerRep } from "@/components/admin/reports/dials-per-rep";
import { SourceBreakdown } from "@/components/admin/reports/source-breakdown";
import { ReportToolbar } from "@/components/admin/reports/report-toolbar";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel } from "@/components/deck/panel";
import { adminConfig } from "@/config/admin";
import { findStage, pipelineConfig } from "@/config/pipeline";
import { findRange, reportsConfig, type ReportKpiKey } from "@/config/reports";
import { downloadCsv, stampedFilename } from "@/lib/export";
import { formatDelta, formatDeltaPoints, template } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import {
  kpisOf,
  selectInPreviousRange,
  selectInRange,
  selectRevenueEstimate,
  selectSourceBreakdown,
} from "@/lib/store/selectors";

const { content, features, kpis } = reportsConfig;

/** Which KPIs are percentages, and so move in POINTS rather than percent. */
const POINT_KPIS: ReadonlySet<ReportKpiKey> = new Set<ReportKpiKey>([
  "conversionRate",
  "attendingRate",
]);

/**
 * ============================================================================
 *  REPORTS
 * ============================================================================
 *  The analysis screen: a date range, two exports, four KPIs and two ranked
 *  lists — every figure derived from the range rather than from the whole
 *  database.
 *
 *  THE RANGE IS THE SCREEN. In the prototype it changed nothing: leads carried
 *  no creation date, so a 7-day report and a 90-day report printed identical
 *  numbers, and the numbers were the dashboard's. `Lead.createdDaysAgo` (see
 *  lib/mock/seed.ts) is what makes it real, and `selectInRange` is the one
 *  place the filter is applied — every panel below reads its slice from here
 *  rather than reaching into the store itself, so no panel can be showing a
 *  different period than its neighbour.
 *
 *  Range state is local rather than a URL search param. That is a deliberate
 *  limit: it means a report cannot be linked to or bookmarked. Worth revisiting
 *  when the backend lands, since a shareable report URL is most of the value of
 *  a report — but it needs server-side data to be worth anything, because today
 *  the figures live in the reader's own browser.
 * ============================================================================
 */
export function ReportsView() {
  const { state } = useCrm();
  const [rangeDays, setRangeDays] = useState(reportsConfig.defaultRangeDays);

  const range = findRange(rangeDays);

  const view = useMemo(() => {
    const leads = selectInRange(state, rangeDays);
    const previous = selectInPreviousRange(state, rangeDays);

    const current = kpisOf(leads, state.reps, state.stageOrder);
    const prior = kpisOf(previous, state.reps, state.stageOrder);

    const clientLeads = leads.filter(
      (lead) => lead.stageId === pipelineConfig.wonStageId,
    );

    return {
      leads,
      previous,
      current,
      prior,
      revenue: selectRevenueEstimate(leads),
      priorRevenue: selectRevenueEstimate(previous),
      clientCount: clientLeads.length,
      sources: selectSourceBreakdown(leads),
    };
  }, [state, rangeDays]);

  /** The figure behind one KPI card, for a given set. */
  function valueOf(key: ReportKpiKey, which: "current" | "prior"): number {
    if (key === "revenue") {
      return which === "current" ? view.revenue : view.priorRevenue;
    }
    return which === "current" ? view.current[key] : view.prior[key];
  }

  /**
   * The period-over-period chip for one card.
   *
   * Returns undefined — meaning "no chip" — in the two cases where a comparison
   * would be dishonest rather than merely absent: the all-time range, which has
   * no preceding period at all, and an empty preceding period, where any
   * percentage change would be a division by zero dressed up as growth.
   */
  function deltaOf(key: ReportKpiKey) {
    if (!features.periodDeltas || rangeDays <= 0) return undefined;
    if (view.previous.length === 0) return undefined;

    const now = valueOf(key, "current");
    const before = valueOf(key, "prior");

    // Percentages move in points; counts and money move in percent. Conflating
    // the two is the standard way a dashboard overstates itself — see
    // formatDeltaPoints in lib/format.ts.
    const isPoints = POINT_KPIS.has(key);
    const change = isPoints
      ? now - before
      : before === 0
        ? 0
        : ((now - before) / before) * 100;

    if (!Number.isFinite(change)) return undefined;

    const rounded = Number(change.toFixed(1));

    return {
      label: isPoints ? formatDeltaPoints(change) : formatDelta(change),
      direction:
        rounded > 0
          ? ("up" as const)
          : rounded < 0
            ? ("down" as const)
            : ("flat" as const),
      title: template(content.deltaTooltip, { range: range.comparisonLabel }),
    };
  }

  /**
   * Export the leads behind this report, not the rendered summary.
   *
   * A CSV of the four KPI figures would be four numbers someone already has on
   * screen. The rows underneath them are what a spreadsheet is actually for —
   * they can be pivoted, filtered and charted, which is the reason to leave
   * this screen at all.
   */
  function handleExportCsv() {
    const rows = view.leads.map((lead) => [
      lead.name,
      lead.company,
      lead.email,
      lead.phone,
      lead.source,
      findStage(pipelineConfig.stages, lead.stageId)?.label ?? lead.stageId,
      state.reps.find((rep) => rep.id === lead.assignedRepId)?.name ??
        "Unassigned",
      lead.createdDaysAgo,
      lead.daysInStage,
      lead.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
    ]);

    downloadCsv(
      stampedFilename(content.csvFilePrefix),
      [
        "Name",
        "Company",
        "Email",
        "Phone",
        "Source",
        "Stage",
        "Assigned rep",
        "Days since created",
        "Days in stage",
        `Invoiced (${adminConfig.currency})`,
      ],
      rows,
    );

    toast.success(template(content.exportToast, { n: String(rows.length) }), {
      description: template(content.exportToastDetail, { range: range.label }),
    });
  }

  const empty = view.leads.length === 0;

  return (
    <PageShell>
      <ReportToolbar
        rangeDays={rangeDays}
        onRangeChange={setRangeDays}
        onExportCsv={handleExportCsv}
        exportCount={view.leads.length}
      />

      {empty ? (
        // A range with nothing in it gets a designed state, not two blank
        // panels that look like a failed load.
        <Panel>
          <EmptyState
            icon={FileBarChart}
            title={content.emptyTitle}
            description={content.emptyDescription}
          />
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((definition, index) => (
              <KpiCard
                key={definition.key}
                definition={definition}
                value={valueOf(definition.key, "current")}
                // "from {n} leads in range" for the client count; "all invoices
                // on {n} clients" for revenue. Both name their own denominator,
                // which is what the prototype's bare figures were missing.
                captionValue={
                  definition.key === "revenue"
                    ? view.clientCount
                    : view.current.totalLeads
                }
                delta={deltaOf(definition.key)}
                revealDelay={index * 60}
              />
            ))}
          </div>

          {(features.sourceBreakdown || features.dialsPerRep) && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {features.sourceBreakdown && (
                <SourceBreakdown rows={view.sources} />
              )}
              {features.dialsPerRep && <DialsPerRep />}
            </div>
          )}
        </>
      )}

      {/* Names what the figures are drawn from. The dial caveat in particular
          has to be on the screen, not just in a config comment. */}
      <p className="text-[0.75rem] text-ink-muted">{content.rangeFootnote}</p>
    </PageShell>
  );
}
