"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/components/console/session-provider";
import { DateInput } from "@/components/deck/date-input";
import { fieldBase, fieldLabel } from "@/components/deck/field";
import { adminConfig } from "@/config/admin";
import { liveStageLabel } from "@/config/pipeline-live";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/lib/get-error-message";
import { formatCurrency, formatDate, initialsOf } from "@/lib/format";
import { PRODUCT_TYPES } from "@/lib/validations/lead";
import { cn } from "@/lib/utils";

/** true/false -> "Yes"/"No"; anything else (null/undefined) -> null, so
 * Field's `value || "—"` shows "—" only for a genuinely unset value, not
 * for `false`. */
function boolLabel(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return null;
}

const backendUrl =
  process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://localhost:8000";

const STATUS_STYLES = {
  new: "bg-brand/15 text-brand",
  gate: "bg-white/[0.06] text-ink-muted",
  won: "bg-emerald-400/15 text-emerald-300",
  lost: "bg-red-400/15 text-red-300",
};

const CONSULT_OUTCOMES = [
  { value: "agreed_mvp", label: "Agreed on MVP" },
  { value: "need_another_meeting", label: "Needs another meeting" },
  { value: "lost", label: "Lost" },
];

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

/** A labeled input/select for the editable sections — same visual language
 * as Field above, just with a control instead of static text. */
function EditRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className={fieldLabel}>{label}</p>
      {children}
    </div>
  );
}

function SwitchRow({ label, checked, onCheckedChange }) {
  return (
    <label className="flex items-center justify-between gap-2 rounded-lg border border-hairline bg-white/[0.02] px-3 py-2.5">
      <span className="text-[0.8125rem] text-ink-soft">{label}</span>
      <Switch checked={checked === true} onCheckedChange={onCheckedChange} size="sm" />
    </label>
  );
}

// ISO datetime <-> the value <input type="datetime-local"> needs (no
// seconds/timezone). "" both ways for an unset value.
function toDateTimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateOnly(iso) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

/** "15 Sep, 14:30" — formatDate (lib/format.js) only carries the day, and
 * two stage moves on the same day need the time to tell them apart. */
function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(adminConfig.locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
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

// Only these sections have any editable fields — everything else
// (identity, project, attribution) has no write path being added here
// either, per the brief's scope.
function emptyWorkflowState(lead) {
  return {
    consult_scheduled_for: toDateTimeLocal(lead?.consult_scheduled_for),
    consult_attended: lead?.consult_attended ?? null,
    consult_outcome: lead?.consult_outcome ?? "",
    needs_second_meeting: lead?.needs_second_meeting ?? null,
    second_meeting_scheduled_for: toDateTimeLocal(lead?.second_meeting_scheduled_for),
    second_meeting_outcome_good: lead?.second_meeting_outcome_good ?? null,
    mvp_type: lead?.mvp_type ?? "",
    mvp_deadline: toDateOnly(lead?.mvp_deadline),
    mvp_delivered_at: toDateTimeLocal(lead?.mvp_delivered_at),
    closing_meeting_scheduled_for: toDateTimeLocal(lead?.closing_meeting_scheduled_for),
    closing_meeting_attended: lead?.closing_meeting_attended ?? null,
    deposit_collected: lead?.deposit_collected ?? null,
    project_cost: lead?.project_cost ?? "",
    developer_id: lead?.developers?.[0]?.id ?? null,
  };
}

// Keyed by lead.id from the wrapper below, so switching to a different lead
// remounts this (fresh `form` state from that lead) instead of needing an
// effect to resync state that was initialized for the previous one.
function LeadDetailsContent({ lead }) {
  const { role } = useSession();
  // Same role gate as the API (routes/api.php: role:admin,sales) — a dev or
  // client would never actually reach this dialog (they can't open the
  // Clients/Pipeline pages it lives on), but this keeps the control visible
  // only where the write would actually succeed.
  const canEdit = role === "admin" || role === "sales";
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();

  const [form, setForm] = useState(() => emptyWorkflowState(lead));
  const [portalEmail, setPortalEmail] = useState("");
  const [portalPassword, setPortalPassword] = useState("");

  // Developer assignment — admin-only. Picking one only updates local form
  // state (so the Select reflects the pick immediately); it's sent to the
  // server together with the rest of the form when "Save" is clicked, not
  // on every selection.
  const { data: developers = [] } = useQuery({
    queryKey: ["users", "dev"],
    queryFn: async () => (await api.get("/api/users", { params: { role: "dev" } })).data,
    enabled: isAdmin,
  });

  const assignDeveloper = useMutation({
    mutationFn: async (developerId) =>
      (await api.patch(`/api/leads/${lead.id}/developer`, { developer_id: developerId })).data,
  });

  const save = useMutation({
    mutationFn: async (values) =>
      (await api.patch(`/api/leads/${lead.id}`, values)).data,
  });

  // Turns on /portal for this lead's client — admin-only, separate from the
  // rest of the form (it isn't a lead field, it creates a User). See
  // LeadController::createPortalAccount.
  const createPortalAccount = useMutation({
    mutationFn: async (values) =>
      (await api.post(`/api/leads/${lead.id}/portal-account`, values)).data,
  });

  async function handleCreatePortalAccount() {
    try {
      await createPortalAccount.mutateAsync({ email: portalEmail.trim(), password: portalPassword });
      toast.success("Portal login created");
      setPortalEmail("");
      setPortalPassword("");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const saving = save.isPending || assignDeveloper.isPending;

  const attribution = ATTRIBUTION_FIELDS.filter(
    ([key]) => lead.attribution?.[key],
  );

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    try {
      await Promise.all([
        save.mutateAsync({
          consult_scheduled_for: form.consult_scheduled_for || null,
          consult_attended: form.consult_attended,
          consult_outcome: form.consult_outcome || null,
          needs_second_meeting: form.needs_second_meeting,
          second_meeting_scheduled_for: form.second_meeting_scheduled_for || null,
          second_meeting_outcome_good: form.second_meeting_outcome_good,
          mvp_type: form.mvp_type || null,
          mvp_deadline: form.mvp_deadline || null,
          mvp_delivered_at: form.mvp_delivered_at || null,
          closing_meeting_scheduled_for: form.closing_meeting_scheduled_for || null,
          closing_meeting_attended: form.closing_meeting_attended,
          deposit_collected: form.deposit_collected,
          project_cost: form.project_cost === "" ? null : Number(form.project_cost),
        }),
        // Only sent when the picker actually changed something worth
        // writing — an admin who never touched it shouldn't fire a
        // no-op sync every time they save the rest of the form.
        isAdmin && form.developer_id !== (lead.developers?.[0]?.id ?? null)
          ? assignDeveloper.mutateAsync(form.developer_id)
          : Promise.resolve(),
      ]);
      toast.success("Saved");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
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
            {lead.stage ? (
              <Pill className={lead.stage === "lost" ? "bg-red-400/15 text-red-300" : "bg-brand/15 text-brand"}>
                {liveStageLabel(lead.stage)}
              </Pill>
            ) : (
              <Pill className={STATUS_STYLES[lead.status] ?? "bg-white/[0.06] text-ink-soft"}>
                {lead.status}
              </Pill>
            )}
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

            {/* Only real columns on `leads`. Community/country aren't in the
                schema yet, so there's no Segmentation section to show until
                they are — nothing here is ever fabricated. */}

            <Section title="Pipeline">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="Stage" value={liveStageLabel(lead.stage)} />
                {lead.stage === "lost" && (
                  <Field label="Lost reason" value={lead.lost_reason} />
                )}
                <Field
                  label="First contact"
                  value={formatDate(lead.first_contact_at)}
                />
                <Field
                  label="Consult booked"
                  value={formatDate(lead.consult_booked_at)}
                />
                <Field label="Closed" value={formatDate(lead.closed_at)} />
              </div>
            </Section>

            {/* Full move-by-move audit trail (lead_stage_history) — separate
                from the few key dates above. Pre-existing leads show nothing
                here (history only started logging from when this shipped),
                never a fabricated backfill. */}
            {lead.stage_history?.length > 0 && (
              <Section title="Stage History">
                <ol className="flex flex-col gap-2">
                  {lead.stage_history.map((entry, index) => (
                    <li
                      key={entry.id}
                      className="flex items-center gap-3 text-[0.8125rem]"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          index === lead.stage_history.length - 1
                            ? "bg-brand"
                            : "bg-ink-muted",
                        )}
                      />
                      <span className="text-ink-soft">
                        {liveStageLabel(entry.stage)}
                      </span>
                      <span className="deck-nums ml-auto text-ink-muted">
                        {formatDateTime(entry.entered_at)}
                      </span>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {/* Consult / MVP / Closing: editable for admin & sales — the
                write path Prompt 4 adds via PATCH /api/leads/{id}. A
                dev/client viewer (who in practice can't reach this dialog
                at all) sees the same read-only cards as before. */}
            {canEdit ? (
              <Section title="Consult">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <EditRow label="Scheduled for">
                    <DateInput
                      withTime
                      value={form.consult_scheduled_for}
                      onChange={(e) => set("consult_scheduled_for", e.target.value)}
                    />
                  </EditRow>
                  <EditRow label="Outcome">
                    <Select
                      value={form.consult_outcome || undefined}
                      onValueChange={(v) => set("consult_outcome", v)}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Not recorded" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONSULT_OUTCOMES.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </EditRow>
                  <div className="flex items-end">
                    <SwitchRow
                      label="Attended"
                      checked={form.consult_attended}
                      onCheckedChange={(v) => set("consult_attended", v)}
                    />
                  </div>
                </div>
              </Section>
            ) : (
              (lead.consult_scheduled_for ||
                lead.consult_attended !== null ||
                lead.consult_outcome) && (
                <Section title="Consult">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <Field
                      label="Scheduled for"
                      value={formatDate(lead.consult_scheduled_for)}
                    />
                    <Field
                      label="Attended"
                      value={boolLabel(lead.consult_attended)}
                    />
                    <Field label="Outcome" value={lead.consult_outcome} />
                  </div>
                </Section>
              )
            )}

            {/* Second Meeting — a follow-up after the consult, distinct
                from the later Closing meeting below. Three simple switches/
                a date, nothing else. */}
            {canEdit ? (
              <Section title="Second Meeting">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex items-end">
                    <SwitchRow
                      label="Needs a second meeting?"
                      checked={form.needs_second_meeting}
                      onCheckedChange={(v) => set("needs_second_meeting", v)}
                    />
                  </div>
                  <EditRow label="Scheduled for">
                    <DateInput
                      withTime
                      value={form.second_meeting_scheduled_for}
                      onChange={(e) => set("second_meeting_scheduled_for", e.target.value)}
                    />
                  </EditRow>
                  <div className="flex items-end">
                    <SwitchRow
                      label="Went well?"
                      checked={form.second_meeting_outcome_good}
                      onCheckedChange={(v) => set("second_meeting_outcome_good", v)}
                    />
                  </div>
                </div>
              </Section>
            ) : (
              (lead.needs_second_meeting !== null ||
                lead.second_meeting_scheduled_for ||
                lead.second_meeting_outcome_good !== null) && (
                <Section title="Second Meeting">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <Field
                      label="Needed"
                      value={boolLabel(lead.needs_second_meeting)}
                    />
                    <Field
                      label="Scheduled for"
                      value={formatDate(lead.second_meeting_scheduled_for)}
                    />
                    <Field
                      label="Went well"
                      value={boolLabel(lead.second_meeting_outcome_good)}
                    />
                  </div>
                </Section>
              )
            )}

            {canEdit ? (
              <Section title="MVP">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <EditRow label="Type">
                    <Select
                      value={form.mvp_type || undefined}
                      onValueChange={(v) => set("mvp_type", v)}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Not set" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replaceAll("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </EditRow>
                  <EditRow label="Deadline">
                    <DateInput
                      value={form.mvp_deadline}
                      onChange={(e) => set("mvp_deadline", e.target.value)}
                    />
                  </EditRow>
                  <EditRow label="Delivered">
                    <DateInput
                      withTime
                      value={form.mvp_delivered_at}
                      onChange={(e) => set("mvp_delivered_at", e.target.value)}
                    />
                  </EditRow>
                </div>
              </Section>
            ) : (
              (lead.mvp_type || lead.mvp_deadline) && (
                <Section title="MVP">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <Field label="Type" value={lead.mvp_type} />
                    <Field label="Deadline" value={formatDate(lead.mvp_deadline)} />
                  </div>
                </Section>
              )
            )}

            {canEdit ? (
              <Section title="Closing">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <EditRow label="Meeting scheduled for">
                    <DateInput
                      withTime
                      value={form.closing_meeting_scheduled_for}
                      onChange={(e) =>
                        set("closing_meeting_scheduled_for", e.target.value)
                      }
                    />
                  </EditRow>
                  <div className="flex items-end">
                    <SwitchRow
                      label="Meeting attended"
                      checked={form.closing_meeting_attended}
                      onCheckedChange={(v) => set("closing_meeting_attended", v)}
                    />
                  </div>
                  <div className="flex items-end">
                    <SwitchRow
                      label="Deposit collected"
                      checked={form.deposit_collected}
                      onCheckedChange={(v) => set("deposit_collected", v)}
                    />
                  </div>
                  <EditRow label={`Project cost (${adminConfig.currency})`}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.project_cost}
                      onChange={(e) => set("project_cost", e.target.value)}
                      className={cn(fieldBase, "h-10 px-3 text-[0.8125rem]")}
                    />
                  </EditRow>
                </div>
              </Section>
            ) : (
              (lead.closing_meeting_scheduled_for ||
                lead.closing_meeting_attended !== null ||
                lead.deposit_collected !== null ||
                lead.project_cost) && (
                <Section title="Closing">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <Field
                      label="Meeting scheduled for"
                      value={formatDate(lead.closing_meeting_scheduled_for)}
                    />
                    <Field
                      label="Meeting attended"
                      value={boolLabel(lead.closing_meeting_attended)}
                    />
                    <Field
                      label="Deposit collected"
                      value={boolLabel(lead.deposit_collected)}
                    />
                    <Field
                      label="Project cost"
                      value={lead.project_cost ? formatCurrency(Number(lead.project_cost)) : null}
                    />
                  </div>
                </Section>
              )
            )}

            {isAdmin && (
              <Section title="Delivery">
                <EditRow label="Assigned developer">
                  <Select
                    value={form.developer_id ? String(form.developer_id) : "unassigned"}
                    onValueChange={(v) =>
                      set("developer_id", v === "unassigned" ? null : Number(v))
                    }
                    disabled={saving}
                  >
                    <SelectTrigger className="h-10 w-full sm:w-64">
                      <SelectValue>
                        {(value) =>
                          value === "unassigned" || !value
                            ? "Unassigned"
                            : developers.find((dev) => String(dev.id) === value)?.name ?? "Unassigned"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {developers.map((dev) => (
                        <SelectItem key={dev.id} value={String(dev.id)}>
                          {dev.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </EditRow>
              </Section>
            )}

            {isAdmin && (
              <Section title="Client portal access">
                <p className="mb-3 text-[0.8125rem] text-ink-muted">
                  {lead.clientUser?.email ? (
                    <>
                      Signed in as <span className="text-ink">{lead.clientUser.email}</span>. Creating a new login
                      below replaces it.
                    </>
                  ) : (
                    "No portal login yet — the client can't see this project on /portal."
                  )}
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <EditRow label="Email">
                    <input
                      type="email"
                      value={portalEmail}
                      onChange={(e) => setPortalEmail(e.target.value)}
                      className={cn(fieldBase, "h-10 px-3 text-[0.8125rem]")}
                    />
                  </EditRow>
                  <EditRow label="Password">
                    <input
                      type="text"
                      value={portalPassword}
                      onChange={(e) => setPortalPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className={cn(fieldBase, "h-10 px-3 text-[0.8125rem]")}
                    />
                  </EditRow>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={handleCreatePortalAccount}
                      disabled={createPortalAccount.isPending || !portalEmail.trim() || portalPassword.length < 8}
                      className="h-10 w-full font-semibold"
                    >
                      {createPortalAccount.isPending ? "Creating…" : "Create login"}
                    </Button>
                  </div>
                </div>
              </Section>
            )}

            {canEdit && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="h-10"
                >
                  {saving ? "Saving…" : "Save workflow fields"}
                </Button>
              </div>
            )}
          </div>
        </div>
    </DialogContent>
  );
}

export function LeadDetailsDialog({ lead, open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {lead && <LeadDetailsContent key={lead.id} lead={lead} />}
    </Dialog>
  );
}
