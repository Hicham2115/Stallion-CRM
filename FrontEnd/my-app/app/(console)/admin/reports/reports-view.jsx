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
import { findRange, reportsConfig } from "@/config/reports";
import { downloadCsv, stampedFilename } from "@/lib/export";
import { formatDelta, formatDeltaPoints, template } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import { kpisOf, selectInPreviousRange, selectInRange, selectRevenueEstimate, selectSourceBreakdown, } from "@/lib/store/selectors";
const { content, features, kpis } = reportsConfig;
/** Which KPIs are percentages, and so move in POINTS rather than percent. */
const POINT_KPIS = new Set([
    "conversionRate",
    "attendingRate",
]);
// selectInRange is the one place the date-range filter is applied — every
// panel below reads its slice from `view` rather than the store directly, so
// no panel can show a different period than its neighbour.
//
// Range state is local, not a URL search param, so a report can't be linked
// or bookmarked. Worth revisiting once the backend lands (a shareable report
// URL needs server-side data to be worth anything).
export function ReportsView() {
    const { state } = useCrm();
    const [rangeDays, setRangeDays] = useState(reportsConfig.defaultRangeDays);
    const range = findRange(rangeDays);
    const view = useMemo(() => {
        const leads = selectInRange(state, rangeDays);
        const previous = selectInPreviousRange(state, rangeDays);
        const current = kpisOf(leads, state.reps, state.stageOrder);
        const prior = kpisOf(previous, state.reps, state.stageOrder);
        const clientLeads = leads.filter((lead) => lead.stageId === pipelineConfig.wonStageId);
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
    function valueOf(key, which) {
        if (key === "revenue") {
            return which === "current" ? view.revenue : view.priorRevenue;
        }
        return which === "current" ? view.current[key] : view.prior[key];
    }
    // No chip (undefined) for the all-time range, which has no preceding
    // period, and for an empty preceding period, where a percentage change
    // would be a division by zero.
    function deltaOf(key) {
        if (!features.periodDeltas || rangeDays <= 0)
            return undefined;
        if (view.previous.length === 0)
            return undefined;
        const now = valueOf(key, "current");
        const before = valueOf(key, "prior");
        // Percentages move in points; counts and money move in percent.
        const isPoints = POINT_KPIS.has(key);
        const change = isPoints
            ? now - before
            : before === 0
                ? 0
                : ((now - before) / before) * 100;
        if (!Number.isFinite(change))
            return undefined;
        const rounded = Number(change.toFixed(1));
        return {
            label: isPoints ? formatDeltaPoints(change) : formatDelta(change),
            direction: rounded > 0
                ? "up"
                : rounded < 0
                    ? "down"
                    : "flat",
            title: template(content.deltaTooltip, { range: range.comparisonLabel }),
        };
    }
    // Exports the leads behind the report, not the four KPI figures already
    // on screen — the rows are what's actually worth pivoting/filtering.
    function handleExportCsv() {
        const rows = view.leads.map((lead) => {
            return [
                lead.name,
                lead.company,
                lead.email,
                lead.phone,
                lead.source,
                findStage(pipelineConfig.stages, lead.stageId)?.label ?? lead.stageId,
                state.reps.find((rep) => rep.id === lead.assignedRepId)?.name ?? "Unassigned",
                lead.createdDaysAgo,
                lead.daysInStage,
                lead.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
            ];
        });
        downloadCsv(stampedFilename(content.csvFilePrefix), [
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
        ], rows);
        toast.success(template(content.exportToast, { n: String(rows.length) }), {
            description: template(content.exportToastDetail, { range: range.label }),
        });
    }
    const empty = view.leads.length === 0;
    return (<PageShell>
      <ReportToolbar rangeDays={rangeDays} onRangeChange={setRangeDays} onExportCsv={handleExportCsv} exportCount={view.leads.length}/>

      {empty ? (
        <Panel>
          <EmptyState icon={FileBarChart} title={content.emptyTitle} description={content.emptyDescription}/>
        </Panel>) : (<>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((definition, index) => (<KpiCard key={definition.key} definition={definition} value={valueOf(definition.key, "current")} captionValue={definition.key === "revenue"
                    ? view.clientCount
                    : view.current.totalLeads} delta={deltaOf(definition.key)} revealDelay={index * 60}/>))}
          </div>

          {(features.sourceBreakdown || features.dialsPerRep) && (<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {features.sourceBreakdown && (<SourceBreakdown rows={view.sources}/>)}
              {features.dialsPerRep && <DialsPerRep />}
            </div>)}
        </>)}

      <p className="text-[0.75rem] text-ink-muted">{content.rangeFootnote}</p>
    </PageShell>);
}
