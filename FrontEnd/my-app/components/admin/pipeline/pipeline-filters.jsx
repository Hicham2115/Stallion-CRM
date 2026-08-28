"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SegmentedControl } from "@/components/deck/segmented-control";
import { PRODUCT_TYPES } from "@/lib/validations/lead";

const TRACK_OPTIONS = [
  { value: "all", label: "All" },
  { value: "low_ticket", label: "Low ticket" },
  { value: "high_ticket", label: "High ticket" },
];

// Only Track and Product Type — both real columns on `leads`. Country,
// Community and Assigned Sales aren't in the schema (Prompt 1 didn't add
// them, and inventing filter data isn't in scope here), so there's nothing
// to filter by for those yet.
export function PipelineFilters({ track, onTrackChange, productType, onProductTypeChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <SegmentedControl
        tone="quiet"
        label="Track"
        value={track}
        onValueChange={onTrackChange}
        options={TRACK_OPTIONS}
      />

      <Select
        value={productType}
        onValueChange={onProductTypeChange}
      >
        <SelectTrigger className="h-9 w-[10rem] bg-white/[0.03] text-[0.8125rem]">
          <SelectValue placeholder="Product type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All product types</SelectItem>
          {PRODUCT_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {type.replaceAll("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
