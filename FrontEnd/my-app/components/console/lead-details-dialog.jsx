"use client";
import {
  Briefcase,
  Calendar,
  FileText,
  Mail,
  Phone,
  Rocket,
  Wallet,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, initialsOf } from "@/lib/format";
import { cn } from "@/lib/utils";

const backendUrl =
  process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://localhost:8000";

const STATUS_STYLES = {
  new: "bg-brand/15 text-brand",
  gate: "bg-white/[0.06] text-ink-muted",
  won: "bg-emerald-400/15 text-emerald-300",
  lost: "bg-red-400/15 text-red-300",
};

function Pill({ children, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border border-hairline px-2.5 py-0.5 text-[0.75rem] font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Field({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      {Icon && (
        <Icon aria-hidden className="mt-0.5 size-3.5 shrink-0 text-ink-muted" />
      )}
      <div className="min-w-0">
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted">
          {label}
        </p>
        <p className="mt-0.5 break-words text-[0.875rem] text-ink">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="min-w-0 rounded-xl border border-hairline bg-white/[0.02] p-4">
      <p className="mb-3 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
        {title}
      </p>
      {children}
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
      <DialogContent className="min-w-0 sm:max-w-3xl gap-0 p-0">
        <div className="max-h-[85vh] min-w-0 overflow-y-auto p-6">
          <DialogHeader className="flex-row items-center gap-3.5 space-y-0 text-left">
            <span
              aria-hidden
              className="grid size-11 shrink-0 place-items-center rounded-full bg-brand/15 font-mono text-[0.8125rem] font-semibold text-brand"
            >
              {initialsOf(lead.full_name)}
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-[1.0625rem]">
                {lead.full_name}
              </DialogTitle>
              <p className="mt-0.5 flex items-center gap-1.5 text-[0.8125rem] text-ink-muted">
                <Calendar aria-hidden className="size-3.5" />
                Submitted {formatDate(lead.created_at) || "—"}
              </p>
            </div>
          </DialogHeader>

          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <Pill className={STATUS_STYLES[lead.status] ?? "bg-white/[0.06] text-ink-soft"}>
              {lead.status}
            </Pill>
            {lead.track && (
              <Pill className="bg-white/[0.04] text-ink-soft">{lead.track}</Pill>
            )}
            {lead.is_decision_maker && (
              <Pill className="bg-white/[0.04] text-ink-soft">
                Decision maker
              </Pill>
            )}
          </div>

          <div className="mt-5 flex min-w-0 flex-col gap-3">
            <Section title="Contact">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field icon={Mail} label="Email" value={lead.email} />
                <Field icon={Phone} label="Phone" value={lead.phone} />
                <Field icon={Briefcase} label="Role" value={lead.role} />
                <Field
                  icon={Briefcase}
                  label="Business type"
                  value={lead.business_type}
                />
              </div>
            </Section>

            <Section title="Project">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="Product type" value={lead.product_type} />
                <Field
                  icon={Wallet}
                  label="Budget band"
                  value={lead.budget_band}
                />
                <Field
                  icon={Rocket}
                  label="Desired launch"
                  value={lead.desired_launch}
                />
              </div>

              {lead.need_description && (
                <div className="mt-4 min-w-0 border-t border-hairline pt-4">
                  <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted">
                    Need description
                  </p>
                  <p className="mt-1.5 wrap-anywhere text-[0.875rem] leading-relaxed text-ink-soft">
                    {lead.need_description}
                  </p>
                </div>
              )}
            </Section>

            {lead.brief_file_path && (
              <a
                href={`${backendUrl}/storage/${lead.brief_file_path}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-xl border border-hairline bg-white/[0.02] p-4 text-[0.8125rem] font-medium text-ink-soft transition-colors hover:border-brand/40 hover:bg-brand/[0.06] hover:text-brand"
              >
                <FileText aria-hidden className="size-4 shrink-0" />
                View attached brief
              </a>
            )}

            {attribution.length > 0 && (
              <Section title="Attribution">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {attribution.map(([key, label]) => (
                    <Field
                      key={key}
                      label={label}
                      value={lead.attribution[key]}
                    />
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
