"use client";
import { FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

const backendUrl =
  process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://localhost:8000";

function Field({ label, value }) {
  return (
    <div>
      <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </p>
      <p className="mt-1 text-[0.875rem] text-ink">{value || "—"}</p>
    </div>
  );
}

const ATTRIBUTION_FIELDS = [
  ["utm_source", "UTM source"],
  ["utm_medium", "UTM medium"],
  ["utm_campaign", "UTM campaign"],
  ["utm_content", "UTM content"],
  ["utm_term", "UTM term"],
  ["gclid", "Google click ID"],
  ["fbclid", "Facebook click ID"],
  ["referrer", "Referrer"],
  ["landing_page", "Landing page"],
];

export function LeadDetailsDialog({ lead, open, onOpenChange }) {
  if (!lead) return null;

  const attribution = ATTRIBUTION_FIELDS.filter(
    ([key]) => lead.attribution?.[key],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{lead.full_name}</DialogTitle>
          <DialogDescription>
            Submitted {formatDate(lead.created_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{lead.status}</Badge>
            {lead.track && <Badge variant="outline">{lead.track}</Badge>}
            {lead.is_decision_maker && (
              <Badge variant="outline">Decision maker</Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Email" value={lead.email} />
            <Field label="Phone" value={lead.phone} />
            <Field label="Role" value={lead.role} />
            <Field label="Business type" value={lead.business_type} />
            <Field label="Product type" value={lead.product_type} />
            <Field label="Budget band" value={lead.budget_band} />
            <Field label="Desired launch" value={lead.desired_launch} />
          </div>

          {lead.need_description && (
            <Field label="Need description" value={lead.need_description} />
          )}

          {lead.brief_file_path && (
            <a
              href={`${backendUrl}/storage/${lead.brief_file_path}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-hairline bg-white/[0.03] px-3 py-2 text-[0.8125rem] text-ink-soft transition-colors hover:border-hairline-strong hover:text-ink"
            >
              <FileText aria-hidden className="size-3.5" />
              View attached brief
            </a>
          )}

          {attribution.length > 0 && (
            <div>
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted">
                Attribution
              </p>
              <div className="mt-2 grid grid-cols-2 gap-4">
                {attribution.map(([key, label]) => (
                  <Field key={key} label={label} value={lead.attribution[key]} />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
