"use client";
import { SegmentedControl } from "@/components/deck/segmented-control";
import { DateInput } from "@/components/deck/date-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fieldBase, fieldLabel } from "@/components/deck/field";
import { PRODUCT_TYPES } from "@/lib/validations/lead";
import { cn } from "@/lib/utils";

const TRACK_OPTIONS = [
  { value: "all", label: "All" },
  { value: "low_ticket", label: "Low ticket" },
  { value: "high_ticket", label: "High ticket" },
];

// Country/community/campaign/ad set/creative have no fixed value list
// anywhere in the app (no endpoint enumerates them — see the Prompt 5
// report), so these stay free-text inputs, debounced by the parent before
// they hit the API, rather than a fake client-side-only filter.
function TextFilter({ label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className={fieldLabel}>{label}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(fieldBase, "h-10 w-[9.5rem] px-3 text-[0.8125rem]")}
      />
    </div>
  );
}

export function AcquisitionFilters({ filters, onChange, salesOptions = [] }) {
  function set(key, value) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <p className={fieldLabel}>From</p>
        <DateInput
          value={filters.date_from}
          onChange={(e) => set("date_from", e.target.value)}
          placeholder="Any"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <p className={fieldLabel}>To</p>
        <DateInput
          value={filters.date_to}
          onChange={(e) => set("date_to", e.target.value)}
          placeholder="Any"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <p className={fieldLabel}>Track</p>
        <SegmentedControl
          tone="quiet"
          label="Track"
          value={filters.track}
          onValueChange={(v) => set("track", v)}
          options={TRACK_OPTIONS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <p className={fieldLabel}>Product type</p>
        <Select
          value={filters.product_type}
          onValueChange={(v) => set("product_type", v)}
        >
          <SelectTrigger className="h-10 w-[9.5rem] bg-white/[0.03] text-[0.8125rem]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {PRODUCT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type.replaceAll("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className={fieldLabel}>Assigned sales</p>
        <Select
          value={filters.assigned_sales}
          onValueChange={(v) => set("assigned_sales", v)}
        >
          <SelectTrigger className="h-10 w-[9.5rem] bg-white/[0.03] text-[0.8125rem]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {salesOptions.map((rep) => (
              <SelectItem key={rep.assigned_sales_id} value={String(rep.assigned_sales_id)}>
                {rep.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TextFilter
        label="Country"
        value={filters.country}
        onChange={(v) => set("country", v)}
        placeholder="e.g. FR"
      />
      <TextFilter
        label="Community"
        value={filters.segment_community}
        onChange={(v) => set("segment_community", v)}
        placeholder="Any"
      />
      <TextFilter
        label="Campaign"
        value={filters.campaign}
        onChange={(v) => set("campaign", v)}
        placeholder="Any"
      />
      <TextFilter
        label="Ad set"
        value={filters.ad_set}
        onChange={(v) => set("ad_set", v)}
        placeholder="Any"
      />
      <TextFilter
        label="Creative"
        value={filters.creative}
        onChange={(v) => set("creative", v)}
        placeholder="Any"
      />
    </div>
  );
}
