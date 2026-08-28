"use client";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PanelHeader } from "@/components/deck/panel";
import { EmptyState } from "@/components/deck/empty-state";
import { formatNumber } from "@/lib/format";
import { LineChart as LineChartIcon } from "lucide-react";

// Three count series sharing one unit (leads) share one axis, per the
// dataviz skill's "never dual-axis" rule — that's also why ad_spend (a
// money series) isn't plotted here alongside them; it stays a KPI figure
// instead of forcing a second scale onto this chart. Colors reuse the
// app's own --stage-1..5 ramp (already shipped, already validated) rather
// than a new categorical palette: the three series ARE the funnel steps in
// order, so brightness tracking funnel position is the right read, not an
// arbitrary reuse.
const SERIES = [
  { key: "leads", label: "Leads", color: "var(--stage-5)" },
  { key: "applications_completed", label: "Applications Completed", color: "var(--stage-3)" },
  { key: "consult_booked", label: "Consult Booked", color: "var(--stage-1)" },
];

function formatBucketLabel(dateStr, granularity) {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (granularity === "monthly") {
    return new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" }).format(date);
  }
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(date);
}

function ChartTooltip({ active, payload, label, granularity }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-hairline bg-deck-card/95 px-3 py-2 shadow-[0_18px_44px_-18px_rgb(0_0_0/0.9)] backdrop-blur-md">
      <p className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ink-muted">
        {formatBucketLabel(label, granularity)}
      </p>
      <div className="mt-1.5 flex flex-col gap-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-[0.75rem]">
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-ink-muted">{entry.name}</span>
            <span className="deck-nums ml-auto font-medium text-ink">
              {formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AcquisitionTrendChart({ trend }) {
  const points = trend?.points ?? [];
  const granularity = trend?.granularity ?? "daily";

  return (
    <div className="deck-inset rounded-2xl border border-hairline bg-deck-surface">
      <PanelHeader
        title="Acquisition Trend"
        hint={`${granularity} · real counts, never divided from a total`}
      />
      <div className="p-5 pt-4 sm:p-6 sm:pt-4">
        {points.length === 0 ? (
          <EmptyState
            icon={LineChartIcon}
            title="No activity in this range"
            description="No leads, applications or bookings were recorded in the selected filters."
          />
        ) : (
          <div className="h-[18rem] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="var(--deck-hairline)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => formatBucketLabel(d, granularity)}
                  tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--deck-hairline)" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<ChartTooltip granularity={granularity} />} cursor={{ stroke: "var(--deck-hairline-strong)" }} />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "var(--ink-muted)" }}
                  iconType="circle"
                  iconSize={8}
                />
                {SERIES.map((series) => (
                  <Line
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    name={series.label}
                    stroke={series.color}
                    strokeWidth={2}
                    dot={points.length <= 14}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
