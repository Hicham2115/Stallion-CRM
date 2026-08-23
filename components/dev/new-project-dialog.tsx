"use client";

import { useState, type FormEvent } from "react";
import { CircleAlert, Info, LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  fieldAlert,
  fieldBase,
  fieldErrorText,
  fieldInvalid,
  fieldLabel,
} from "@/components/deck/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { devConfig } from "@/config/dev";
import { loginConfig } from "@/config/login";
import { template } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import { cn } from "@/lib/utils";

const copy = devConfig.content.newProject;

/** Console dialogs run 2.75rem fields. Everything else is shared — see
 *  components/deck/field.ts. */
const inputBase = cn(fieldBase, "h-11 px-3.5");
const errorText = cn("mt-1.5", fieldErrorText);

type FieldKey = "name" | "company" | "email";
type FieldErrors = Partial<Record<FieldKey, string>>;

/**
 * ============================================================================
 *  NEW PROJECT
 * ============================================================================
 *  The dev workspace's version of "Add Client".
 *
 *  IT ASKS FOR LESS THAN THE ADMIN DIALOG, ON PURPOSE. The admin form collects
 *  a lead SOURCE and a sales note, because an admin knows where the client came
 *  from. A developer does not, and a guessed source is not a harmless blank —
 *  it quietly skews the Reports source breakdown, which is the screen the
 *  agency uses to decide where to spend its marketing budget. So `source` is
 *  left empty and renders as "Not recorded" wherever it appears.
 *
 *  IT SAYS WHERE THE RECORD GOES. Creating a project also creates a client in
 *  the agency console. A developer finding that out later, from an admin asking
 *  who added a row, is a worse way to learn it than one line of footnote.
 *
 *  Validation follows the same contract as every other form in the product —
 *  see the note at the top of components/admin/clients/add-client-dialog.tsx.
 * ============================================================================
 */
export function NewProjectDialog() {
  const { actions } = useCrm();

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [summary, setSummary] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function reset() {
    setName("");
    setCompany("");
    setEmail("");
    setSummary("");
    setFieldErrors({});
    setFormError(null);
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (!name.trim()) errors.name = copy.errors.nameRequired;
    if (!company.trim()) errors.company = copy.errors.companyRequired;

    // Email is optional here — a project can start before anyone has the
    // client's address — but a value that IS given has to be plausible.
    if (email.trim() && !loginConfig.validation.emailPattern.test(email.trim())) {
      errors.email = copy.errors.emailInvalid;
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Focus the first failure, so a keyboard or screen-reader user lands on
      // the problem rather than hunting for it.
      const first = (["name", "company", "email"] as FieldKey[]).find(
        (key) => errors[key],
      );
      document.getElementById(`new-project-${first}`)?.focus();
      return;
    }

    setPending(true);

    const result = await actions.addClient({
      name: name.trim(),
      company: company.trim(),
      phone: "",
      email: email.trim(),
      // Deliberately omitted: see the note at the top of this file.
      projectSummary: summary.trim(),
    });

    setPending(false);

    if (!result.ok) {
      if (result.field === "email") setFieldErrors({ email: result.message });
      else setFormError(result.message);
      return;
    }

    toast.success(template(copy.toast, { name: result.data.name }));
    setOpen(false);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Clearing on close rather than on open: a half-typed form that
        // reappears intact after an accidental Esc is a gift; one that
        // reappears intact three days later is confusing.
        if (!next) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button size="lg" className="h-10 rounded-xl font-semibold" />
        }
      >
        <Plus aria-hidden className="size-4" />
        {copy.trigger}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[30rem]">
        <DialogTitle className="font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
          {copy.title}
        </DialogTitle>
        <DialogDescription className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-muted">
          {copy.description}
        </DialogDescription>

        <div aria-live="polite">
          {formError && (
            <div role="alert" className={cn(fieldAlert, "mt-5")}>
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div>
            <label htmlFor="new-project-name" className={fieldLabel}>
              {copy.nameLabel}
            </label>
            <input
              id="new-project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={copy.namePlaceholder}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "new-project-name-error" : undefined}
              className={cn(inputBase, "mt-2", fieldErrors.name && fieldInvalid)}
            />
            {fieldErrors.name && (
              <p id="new-project-name-error" role="alert" className={errorText}>
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="new-project-company" className={fieldLabel}>
              {copy.companyLabel}
            </label>
            <input
              id="new-project-company"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder={copy.companyPlaceholder}
              aria-invalid={Boolean(fieldErrors.company)}
              aria-describedby={
                fieldErrors.company ? "new-project-company-error" : undefined
              }
              className={cn(inputBase, "mt-2", fieldErrors.company && fieldInvalid)}
            />
            {fieldErrors.company && (
              <p id="new-project-company-error" role="alert" className={errorText}>
                {fieldErrors.company}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="new-project-email" className={fieldLabel}>
              {copy.emailLabel}
            </label>
            <input
              id="new-project-email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={copy.emailPlaceholder}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={
                fieldErrors.email ? "new-project-email-error" : undefined
              }
              className={cn(inputBase, "mt-2", fieldErrors.email && fieldInvalid)}
            />
            {fieldErrors.email && (
              <p id="new-project-email-error" role="alert" className={errorText}>
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="new-project-summary" className={fieldLabel}>
              {copy.summaryLabel}
            </label>
            <input
              id="new-project-summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder={copy.summaryPlaceholder}
              className={cn(inputBase, "mt-2")}
            />
          </div>

          {/* Not a warning, a fact. It sits in the quiet info treatment the
              stage editor uses for the same kind of statement. */}
          <p className="flex items-start gap-2.5 rounded-xl border border-hairline bg-white/[0.02] px-3.5 py-3 text-[0.75rem] leading-relaxed text-ink-muted">
            <Info aria-hidden className="mt-0.5 size-3.5 shrink-0 text-ink-faint" />
            {copy.footnote}
          </p>

          <div className="flex justify-end gap-2.5 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => setOpen(false)}
              className="font-medium"
            >
              {copy.cancel}
            </Button>

            <Button type="submit" size="lg" disabled={pending} className="font-semibold">
              {pending && (
                <LoaderCircle aria-hidden className="deck-spin size-4" />
              )}
              {pending ? copy.submitPending : copy.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
