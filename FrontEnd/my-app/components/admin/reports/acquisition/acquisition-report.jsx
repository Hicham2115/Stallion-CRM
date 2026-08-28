"use client";
import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { AcquisitionFilters } from "@/components/admin/reports/acquisition/acquisition-filters";
import { StatTile } from "@/components/admin/reports/acquisition/stat-tile";
import { AcquisitionFunnelMini } from "@/components/admin/reports/acquisition/acquisition-funnel-mini";
import { AcquisitionTrendChart } from "@/components/admin/reports/acquisition/acquisition-trend-chart";
import { CampaignTable } from "@/components/admin/reports/acquisition/campaign-table";
import { CreativeTable } from "@/components/admin/reports/acquisition/creative-table";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel } from "@/components/deck/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/lib/get-error-message";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const DEFAULT_FILTERS = {
  date_from: "",
  date_to: "",
  track: "all",
  product_type: "all",
  assigned_sales: "all",
  country: "",
  segment_community: "",
  campaign: "",
  ad_set: "",
  creative: "",
};

// Same "leave the unset ones out" contract AnalyticsController::kpis
// validates against — "all"/"" mean no filter, not a literal value to send.
function toQueryParams(filters) {
  const params = {};
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  if (filters.track !== "all") params.track = filters.track;
  if (filters.product_type !== "all") params.product_type = filters.product_type;
  if (filters.assigned_sales !== "all") params.assigned_sales = filters.assigned_sales;
  if (filters.country.trim()) params.country = filters.country.trim();
  if (filters.segment_community.trim()) params.segment_community = filters.segment_community.trim();
  if (filters.campaign.trim()) params.campaign = filters.campaign.trim();
  if (filters.ad_set.trim()) params.ad_set = filters.ad_set.trim();
  if (filters.creative.trim()) params.creative = filters.creative.trim();
  return params;
}

// The Reports page (reports-view.jsx) keeps its filter state local to the
// component, not in the URL — no shareable-report-link pattern exists
// anywhere in this app yet, so per the brief this reuses that same local-
// state pattern instead of introducing a second, URL-based one.
export function AcquisitionReport() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Only the free-text fields are debounced — Select/SegmentedControl/
  // DateInput changes are already discrete user actions, not keystrokes.
  const debouncedCountry = useDebouncedValue(filters.country);
  const debouncedCommunity = useDebouncedValue(filters.segment_community);
  const debouncedCampaign = useDebouncedValue(filters.campaign);
  const debouncedAdSet = useDebouncedValue(filters.ad_set);
  const debouncedCreative = useDebouncedValue(filters.creative);

  const { date_from, date_to, track, product_type, assigned_sales } = filters;
  const queryParams = useMemo(
    () =>
      toQueryParams({
        date_from,
        date_to,
        track,
        product_type,
        assigned_sales,
        country: debouncedCountry,
        segment_community: debouncedCommunity,
        campaign: debouncedCampaign,
        ad_set: debouncedAdSet,
        creative: debouncedCreative,
      }),
    [
      date_from,
      date_to,
      track,
      product_type,
      assigned_sales,
      debouncedCountry,
      debouncedCommunity,
      debouncedCampaign,
      debouncedAdSet,
      debouncedCreative,
    ],
  );

  const { data, isPending, isError, error, isFetching } = useQuery({
    queryKey: ["analytics-kpis", queryParams],
    queryFn: async () => (await api.get("/api/analytics/kpis", { params: queryParams })).data,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error));
  }, [isError, error]);

  if (isPending) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-[4.5rem] w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[6.5rem] rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[22rem] w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <Panel>
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load acquisition data"
          description={getErrorMessage(error)}
        />
      </Panel>
    );
  }

  const { acquisition, middle_funnel: middleFunnel, sales, campaigns, creatives } = data;

  return (
    <div className={`flex flex-col gap-5 transition-opacity ${isFetching ? "opacity-70" : ""}`}>
      <AcquisitionFilters filters={filters} onChange={setFilters} salesOptions={sales} />

      <div>
        <p className="mb-2 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
          Cost &amp; volume
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Ad Spend" value={acquisition.ad_spend} format="currency" emphasis />
          <StatTile label="Leads" value={acquisition.leads} format="number" emphasis />
          <StatTile label="Cost per Lead" value={acquisition.cpl} format="currency" emphasis />
          <StatTile
            label="Cost per Booking"
            value={middleFunnel.cost_per_booking}
            format="currency"
            emphasis
          />
        </div>
      </div>

      <div>
        <p className="mb-2 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
          Application funnel
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Applications Started" value={acquisition.applications_started} format="number" />
          <StatTile label="Applications Completed" value={acquisition.applications_completed} format="number" />
          <StatTile label="Completion Rate" value={acquisition.completion_rate} format="percent" />
          <StatTile label="Speed to Lead" value={acquisition.speed_to_lead_minutes} format="minutes" />
        </div>
      </div>

      <div>
        <p className="mb-2 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
          Ad platform
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile
            label="Impressions"
            value={acquisition.impressions}
            unavailable={acquisition.impressions === null}
            hint="No ad-platform integration yet"
          />
          <StatTile
            label="Clicks"
            value={acquisition.clicks}
            unavailable={acquisition.clicks === null}
            hint="No ad-platform integration yet"
          />
          <StatTile label="Consult Booked" value={acquisition.consult_booked} format="number" />
        </div>
      </div>

      <AcquisitionFunnelMini acquisition={acquisition} />

      <AcquisitionTrendChart trend={acquisition.trend} />

      <CampaignTable campaigns={campaigns} />

      <CreativeTable creatives={creatives} />
    </div>
  );
}
