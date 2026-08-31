"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAlert, LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  fieldAlert,
  fieldBase,
  fieldErrorText,
  fieldInvalid,
  fieldLabel,
} from "@/components/deck/field";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/lib/get-error-message";
import {
  BUDGET_BANDS,
  BUDGET_BANDS_BY_TRACK,
  DESIRED_LAUNCH_OPTIONS,
  PRODUCT_TYPES,
  trackForProductType,
} from "@/lib/validations/lead";
import { cn } from "@/lib/utils";

const inputBase = cn(fieldBase, "h-11 px-3.5");
const errorText = cn("mt-1.5", fieldErrorText);
const FIELD_ORDER = ["full_name", "email", "phone"];

const PRODUCT_TYPE_LABELS = {
  static_website: "Static website",
  online_store: "Online store",
  crm: "CRM",
  platform: "Platform",
  mobile_app: "Mobile app",
  saas: "SaaS product",
};

const DESIRED_LAUNCH_LABELS = {
  asap: "ASAP",
  "1-3mo": "1–3 months",
  "3-6mo": "3–6 months",
  "6mo+": "6+ months",
  exploring: "Just exploring",
};

// The CRM's own "Add Client" — POST /api/leads/manual, not the public site
// intake route. A sales user's lead lands assigned to themselves the moment
// it's created (see LeadController::storeManual) — no separate admin
// "assign this to a rep" step required. Same form on /admin/clients and
// /rep/clients; both read the same unscoped ["leads"] list, so one
// invalidation covers every screen (Clients, Pipeline, dashboard) on both
// sides.
export function AddLeadDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [isDecisionMaker, setIsDecisionMaker] = useState(false);
  const [businessType, setBusinessType] = useState("");
  const [productType, setProductType] = useState("");
  const [budgetBand, setBudgetBand] = useState("");
  const [needDescription, setNeedDescription] = useState("");
  const [desiredLaunch, setDesiredLaunch] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  // Same BANT questions as the public intake form (lead-intake-form.jsx) —
  // budget options narrow to whichever track the picked project type maps
  // to, same as trackForProductType() there.
  const track = productType ? trackForProductType(productType) : null;
  const budgetOptions = track ? BUDGET_BANDS_BY_TRACK[track] : BUDGET_BANDS;

  function close() {
    setOpen(false);
    setFullName("");
    setEmail("");
    setPhone("");
    setRole("");
    setIsDecisionMaker(false);
    setBusinessType("");
    setProductType("");
    setBudgetBand("");
    setNeedDescription("");
    setDesiredLaunch("");
    setFieldErrors({});
    setFormError(null);
  }

  const create = useMutation({
    mutationFn: async (payload) => (await api.post("/api/leads/manual", payload)).data,
    onSuccess: (lead) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`Added ${lead.full_name}`);
      close();
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  function validate() {
    const errors = {};
    if (fullName.trim().length < 2) errors.full_name = "Enter the client's full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errors.email = "Enter a valid email address.";
    if (phone.trim().length < 7) errors.phone = "Enter a phone number.";
    return errors;
  }

  function focusFirstError(errors) {
    const first = FIELD_ORDER.find((key) => errors[key]);
    if (first) document.getElementById(`lead-${first}`)?.focus();
  }

  function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      focusFirstError(errors);
      return;
    }
    create.mutate({
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: role.trim() || undefined,
      is_decision_maker: isDecisionMaker,
      business_type: businessType.trim() || undefined,
      product_type: productType || undefined,
      budget_band: budgetBand || undefined,
      need_description: needDescription.trim() || undefined,
      desired_launch: desiredLaunch || undefined,
    });
  }

  function field(key, label, placeholder, value, onChange, extra) {
    const error = fieldErrors[key];
    const id = `lead-${key}`;
    return (
      <div>
        <label htmlFor={id} className={fieldLabel}>
          {label}
        </label>
        <input
          id={id}
          name={key}
          type={extra?.type ?? "text"}
          inputMode={extra?.inputMode}
          autoComplete={extra?.autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(inputBase, "mt-2", error && fieldInvalid)}
        />
        {error && (
          <p id={`${id}-error`} role="alert" className={errorText}>
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (create.isPending) return;
        if (next) setOpen(true);
        else close();
      }}
    >
      <DialogTrigger render={<Button size="lg" className="h-10 rounded-md font-semibold" />}>
        <Plus aria-hidden />
        Add Client
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto border border-hairline bg-deck-card p-6 sm:max-w-lg">
        <header>
          <DialogTitle className="font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
            Add a client
          </DialogTitle>
          <DialogDescription className="mt-2 text-[0.8125rem] leading-relaxed text-ink-muted">
            Creates a lead assigned to you, staged at New Lead.
          </DialogDescription>
        </header>

        <div aria-live="polite">
          {formError && (
            <div role="alert" className={cn("mt-5", fieldAlert)}>
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          {field("full_name", "Full name", "Soukaina Berrada", fullName, setFullName, {
            autoComplete: "name",
          })}
          {field("email", "Email", "soukaina@example.com", email, setEmail, {
            type: "email",
            inputMode: "email",
            autoComplete: "email",
          })}
          {field("phone", "Phone", "+212 6 12 34 56 78", phone, setPhone, {
            type: "tel",
            inputMode: "tel",
            autoComplete: "tel",
          })}
          {field("role", "Role (optional)", "Owner, Marketing Manager...", role, setRole)}

          <div className="flex items-center justify-between rounded-md border border-hairline bg-white/[0.03] px-4 py-3.5">
            <div>
              <p className="text-[0.875rem] font-medium text-ink">Decision maker?</p>
              <p className="text-[0.75rem] text-ink-muted">For this project or purchase</p>
            </div>
            <Switch checked={isDecisionMaker} onCheckedChange={setIsDecisionMaker} />
          </div>

          {field("business_type", "Business (optional)", "Rif Organics", businessType, setBusinessType, {
            autoComplete: "organization",
          })}

          <div>
            <label htmlFor="lead-product_type" className={fieldLabel}>
              Project type (optional)
            </label>
            <Select value={productType} onValueChange={setProductType}>
              <SelectTrigger id="lead-product_type" className={cn(inputBase, "mt-2 w-full")}>
                <SelectValue placeholder="Select a project type" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {PRODUCT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="lead-budget_band" className={fieldLabel}>
              Budget range (optional)
            </label>
            <Select value={budgetBand} onValueChange={setBudgetBand}>
              <SelectTrigger id="lead-budget_band" className={cn(inputBase, "mt-2 w-full")}>
                <SelectValue placeholder="Select a budget range" />
              </SelectTrigger>
              <SelectContent>
                {budgetOptions.map((band) => (
                  <SelectItem key={band} value={band}>
                    {band}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="lead-need_description" className={fieldLabel}>
              What problem are they solving? (optional)
            </label>
            <Textarea
              id="lead-need_description"
              value={needDescription}
              onChange={(event) => setNeedDescription(event.target.value)}
              rows={3}
              placeholder="Tell us what's not working today..."
              className={cn(inputBase, "mt-2 h-auto py-2.5")}
            />
          </div>

          <div>
            <label htmlFor="lead-desired_launch" className={fieldLabel}>
              Desired launch (optional)
            </label>
            <Select value={desiredLaunch} onValueChange={setDesiredLaunch}>
              <SelectTrigger id="lead-desired_launch" className={cn(inputBase, "mt-2 w-full")}>
                <SelectValue placeholder="Select a timeline" />
              </SelectTrigger>
              <SelectContent>
                {DESIRED_LAUNCH_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {DESIRED_LAUNCH_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" size="lg" disabled={create.isPending} onClick={close}>
              Cancel
            </Button>

            <Button type="submit" size="lg" disabled={create.isPending} className="font-semibold">
              {create.isPending ? (
                <>
                  <LoaderCircle aria-hidden className="deck-spin size-4" />
                  Adding…
                </>
              ) : (
                "Add client"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
