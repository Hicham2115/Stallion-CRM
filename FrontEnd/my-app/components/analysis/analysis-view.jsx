"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { AdSpendPanel } from "@/components/analysis/ad-spend-panel";
import { AnalysisToolbar } from "@/components/analysis/analysis-toolbar";
import { PerformanceTable } from "@/components/analysis/performance-table";
import { KpiCard, KpiCardSkeleton } from "@/components/admin/dashboard/kpi-card";
import { PageShell } from "@/components/console/page-shell";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel } from "@/components/deck/panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/components/console/session-provider";
import { analysisConfig, forAudience, rangeParams } from "@/config/analysis";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/lib/get-error-message";
const { content, features, kpis, campaignColumns, creativeColumns } = analysisConfig;
/**
 * ============================================================================
 *  ANALYSIS — what the pipeline cost and what it earned
 * ============================================================================
 *  Mounted at BOTH /admin/analysis and /rep/analysis. One component, because
 *  a rep and their manager reading two different implementations of "cost per
 *  customer" is how two numbers that should agree stop agreeing. The API
 *  (GET /api/analytics/kpis) is already gated to admin + sales and returns
 *  the same company-wide payload to both — this screen is not rep-scoped.
 *
 *  IT RENDERS, IT DOES NOT COMPUTE. Every figure here is calculated
 *  server-side in app/Services/KpiService.php, which is the one place any of
 *  this math is allowed to live. Reports (/admin/reports) is the older,
 *  separate screen that derives four simpler numbers client-side from
 *  /api/leads — the two are not meant to be merged.
 *
 *  NULL IS NOT ZERO. KpiService deliberately returns null, never 0, for any
 *  ratio whose denominator it does not know. Those render as "—". Do not add
 *  a `?? 0` anywhere in this file: it would turn "we have not imported any ad
 *  spend" into "our customers cost nothing".
 * ============================================================================
 */
export function AnalysisView() {
    const [rangeDays, setRangeDays] = useState(analysisConfig.defaultRangeDays);
    const params = rangeParams(rangeDays);
    // Safe to read without waiting on useSessionHydrated(): the /admin and
    // /rep layout guards both render nothing until the session has hydrated,
    // so this component never mounts before `role` is settled. (useSession()
    // falls back to "admin" when the store is empty, which is exactly the
    // value that must not be trusted early — hence the note.)
    const { role } = useSession();
    // The server has ALREADY removed anything this role may not see (see
    // AnalyticsController::withoutAdminOnlyFigures). Filtering here as well
    // is what stops a redacted figure rendering as a permanent "—" card.
    const visibleKpis = forAudience(kpis, role);

    const { data, isPending, isError, error } = useQuery({
        // The "analytics" prefix is what ad-spend-panel.jsx invalidates after
        // an import, so a new upload refreshes these figures immediately.
        queryKey: ["analytics", "kpis", params],
        queryFn: async () => (await api.get("/api/analytics/kpis", { params })).data,
    });

    useEffect(() => {
        if (isError) toast.error(getErrorMessage(error));
    }, [isError, error]);

    const campaigns = data?.campaigns ?? [];
    const creatives = data?.creatives ?? [];
    // Surfaced only when it is the reason a card is empty — see
    // KpiService::economics().
    const ltvNote = data?.economics?.ltv === null ? data?.economics?.ltv_note : null;

    return (<PageShell>
      <Tabs defaultValue="economics">
        {/* h-auto: the shadcn list is a fixed 2rem tall, which clips a
            trigger that carries its own bottom padding for the underline. */}
        <TabsList variant="line" className="h-auto gap-4 p-0">
          <TabsTrigger value="economics" className={TAB_TRIGGER}>
            {content.economicsTab}
          </TabsTrigger>

          {features.adSpendImport && (<TabsTrigger value="ad-spend" className={TAB_TRIGGER}>
              {content.adSpendTab}
            </TabsTrigger>)}
        </TabsList>

        <TabsContent value="economics" className="flex flex-col gap-5 pt-5">
          <AnalysisToolbar rangeDays={rangeDays} onRangeChange={setRangeDays}/>

          {isError ? (<Panel>
              <EmptyState icon={TriangleAlert} title={content.loadErrorTitle} description={getErrorMessage(error)}/>
            </Panel>) : (<>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {isPending
                    ? visibleKpis.map((definition) => <KpiCardSkeleton key={definition.key}/>)
                    : visibleKpis.map((definition, index) => (<KpiCard key={definition.key} definition={definition} value={valueFor(data, definition)} emptyHint={content.noDataSr} revealDelay={index * 60}/>))}
              </div>

              {ltvNote && (<Hint label={content.ltvNoteLabel} text={ltvNote}/>)}

              {features.campaignTable && !isPending && (<PerformanceTable title={content.campaignTitle} hint={content.campaignHint} caption={content.campaignCaption} columns={forAudience(campaignColumns, role)} rows={campaigns} emptyTitle={content.emptyCampaigns} note={content.attributionNote} rowKey={(row) => row.campaign}/>)}

              {/* No `note` here on purpose: the attribution caveat is stated
                  once, under the first table it applies to. Repeating it
                  verbatim makes both copies easier to stop reading. */}
              {features.creativeTable && !isPending && (<PerformanceTable title={content.creativeTitle} hint={content.creativeHint} caption={content.creativeCaption} columns={forAudience(creativeColumns, role)} rows={creatives} emptyTitle={content.emptyCreatives} rowKey={(row) => `${row.creative}·${row.ad_set ?? ""}·${row.campaign ?? ""}`}/>)}
            </>)}
        </TabsContent>

        {features.adSpendImport && (<TabsContent value="ad-spend" className="flex flex-col gap-5 pt-5">
            <AdSpendPanel />
          </TabsContent>)}
      </Tabs>
    </PageShell>);
}
/* A lime HAIRLINE under the active tab, never a lime fill. The screen's one
   lime fill is the Import button on the other tab (the One Lime Answer
   Rule); a filled segment here would be a second one. */
const TAB_TRIGGER = "h-auto flex-none px-0.5 pb-2 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted transition-colors hover:text-ink-soft data-active:text-ink data-active:after:bg-brand";
/** A quiet explanation beside the figures, for the things that are empty on
 *  purpose. Neutral, not a warning: nothing here is wrong.
 *
 *  A Panel, not a bespoke bordered div — the One Container Rule is that every
 *  block on a console screen is a Panel, so that restyling the app's surfaces
 *  stays one file. */
function Hint({ label, text }) {
    return (<Panel className="flex items-start gap-3 px-5 py-4 sm:px-6">
      <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-muted"/>
      <p className="text-[0.8125rem] leading-relaxed text-ink-muted">
        <span className="font-mono uppercase tracking-[0.14em] text-ink-soft">{label}</span>
        {" — "}
        {text}
      </p>
    </Panel>);
}
/**
 * Reads a card's figure out of the KPI payload by its declared `path`, and
 * applies the card's `scale` (gross_margin arrives as a 0-1 ratio and is
 * displayed as whole percents).
 *
 * Returns null — not 0 — for anything missing, so the card renders "—".
 */
function valueFor(payload, definition) {
    const raw = definition.path.reduce((node, key) => (node == null ? undefined : node[key]), payload);
    if (raw === null || raw === undefined) return null;
    return definition.scale ? raw * definition.scale : raw;
}
