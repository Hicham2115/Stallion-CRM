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
import {
  fieldAlert,
  fieldBase,
  fieldErrorText,
  fieldInvalid,
  fieldLabel,
} from "@/components/deck/field";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/lib/get-error-message";
import { cn } from "@/lib/utils";

const inputBase = cn(fieldBase, "h-11 px-3.5");
const errorText = cn("mt-1.5", fieldErrorText);
const FIELD_ORDER = ["full_name", "email", "phone"];

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
  const [businessType, setBusinessType] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  function close() {
    setOpen(false);
    setFullName("");
    setEmail("");
    setPhone("");
    setBusinessType("");
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
      business_type: businessType.trim() || undefined,
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
      <DialogTrigger render={<Button size="lg" className="h-10 rounded-xl font-semibold" />}>
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
          {field("business_type", "Business (optional)", "Rif Organics", businessType, setBusinessType, {
            autoComplete: "organization",
          })}

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
