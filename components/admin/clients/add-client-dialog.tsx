"use client";

import { useState, type FormEvent } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clientsConfig } from "@/config/clients";
import { pipelineConfig } from "@/config/pipeline";
import { template } from "@/lib/format";
import {
  fieldAlert,
  fieldBase,
  fieldErrorText,
  fieldInvalid,
  fieldLabel,
} from "@/components/deck/field";
import { useCrm } from "@/lib/store/crm-store";
import { cn } from "@/lib/utils";

const { content, validation } = clientsConfig;
const copy = content.dialog;

/* --------------------------------------------------------------------------
   Field styling, lifted verbatim from the login form so the two surfaces are
   the same control at the same size. Restyle every field here in one place.
   -------------------------------------------------------------------------- */

/** Console dialogs run 2.75rem fields. Everything else is shared — see
 *  components/deck/field.ts. */
const inputBase = cn(fieldBase, "h-11 px-3.5");

const errorText = cn("mt-1.5", fieldErrorText);

type FieldKey = "name" | "company" | "phone" | "email";
type FieldErrors = Partial<Record<FieldKey, string>>;

/**
 * ============================================================================
 *  ADD CLIENT DIALOG
 * ============================================================================
 *  Mirrors the login form's validation contract exactly, because a user who
 *  has learned how one form behaves should not have to learn a second one:
 *
 *    - `noValidate`, so our messages show rather than the browser's
 *    - `aria-invalid` + `aria-describedby` wiring each error to its field
 *    - focus moved to the FIRST failing field on submit, so a keyboard or
 *      screen-reader user lands on the problem instead of hunting for it
 *    - a pending state that disables the submit, so it cannot be double-sent
 *    - field-level errors from the API pointed at the right input, via the
 *      `field` on the ApiResult
 *
 *  Focus trapping, Esc-to-close and focus restoration to the trigger come from
 *  Base UI's Dialog and are not reimplemented here.
 * ============================================================================
 */
export function AddClientDialog() {
  const { actions } = useCrm();

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState(pipelineConfig.sources[0]);
  const [note, setNote] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  /**
   * Close and clear.
   *
   * Reopening must never show the previous attempt's values, or worse its stale
   * error messages sitting against empty fields.
   *
   * Done here rather than in an effect watching `open`: resetting eight pieces
   * of state from an effect body triggers a cascade of renders after the dialog
   * has already closed, for no benefit. Every close path routes through this
   * function, including Esc and the backdrop (Base UI reports both through
   * `onOpenChange`).
   */
  function close() {
    setOpen(false);
    setName("");
    setCompany("");
    setPhone("");
    setEmail("");
    setSource(pipelineConfig.sources[0]);
    setNote("");
    setFieldErrors({});
    setFormError(null);
  }

  /** Client-side checks only — the server must validate again regardless. */
  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    const trimmedName = name.trim();
    if (!trimmedName) errors.name = copy.errors.nameRequired;
    else if (trimmedName.length < validation.minNameLength)
      errors.name = copy.errors.nameTooShort;

    if (!company.trim()) errors.company = copy.errors.companyRequired;

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) errors.phone = copy.errors.phoneRequired;
    else if (!validation.phonePattern.test(trimmedPhone))
      errors.phone = copy.errors.phoneInvalid;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) errors.email = copy.errors.emailRequired;
    else if (!validation.emailPattern.test(trimmedEmail))
      errors.email = copy.errors.emailInvalid;

    return errors;
  }

  /** Field order, so "the first error" means the first one on screen. */
  const FIELD_ORDER: FieldKey[] = ["name", "company", "phone", "email"];

  function focusFirstError(errors: FieldErrors) {
    const first = FIELD_ORDER.find((key) => errors[key]);
    if (first) document.getElementById(`client-${first}`)?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      focusFirstError(errors);
      return;
    }

    setPending(true);

    try {
      const result = await actions.addClient({
        name: name.trim(),
        company: company.trim(),
        phone: phone.trim(),
        email: email.trim(),
        source,
        note: note.trim(),
      });

      if (result.ok) {
        toast.success(template(copy.successToast, { name: result.data.name }));
        close();
        return;
      }

      // A rejection naming a field belongs on that field, not in a banner at
      // the top where the user has to work out which input it means.
      if (result.field && FIELD_ORDER.includes(result.field as FieldKey)) {
        const scoped = { [result.field as FieldKey]: result.message };
        setFieldErrors(scoped);
        focusFirstError(scoped);
      } else {
        setFormError(result.message);
      }
    } catch (error) {
      console.error("[clients] add client failed", error);
      setFormError(copy.errors.unexpected);
    }

    setPending(false);
  }

  /** One labelled text field, wired for accessibility. */
  function field(
    key: FieldKey,
    label: string,
    placeholder: string,
    value: string,
    onChange: (value: string) => void,
    extra?: { type?: string; inputMode?: "email" | "tel"; autoComplete?: string },
  ) {
    const error = fieldErrors[key];
    const id = `client-${key}`;

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
        // Never dismiss mid-request: the record may already have been created.
        if (pending) return;
        if (next) setOpen(true);
        else close();
      }}
    >
      <DialogTrigger
        render={
          <Button size="lg" className="h-10 rounded-xl font-semibold" />
        }
      >
        <Plus aria-hidden />
        {content.addLabel}
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto border border-hairline bg-deck-card p-6 sm:max-w-lg">
        <header>
          <DialogTitle className="font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
            {copy.title}
          </DialogTitle>
          <DialogDescription className="mt-2 text-[0.8125rem] leading-relaxed text-ink-muted">
            {copy.description}
          </DialogDescription>
        </header>

        {/* Form-level failures only — anything field-specific is shown at the
            field. Stays mounted so the message is announced when it appears. */}
        <div aria-live="polite">
          {formError && (
            <div
              role="alert"
              className={cn("mt-5", fieldAlert)}
            >
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("name", copy.nameLabel, copy.namePlaceholder, name, setName, {
              autoComplete: "name",
            })}
            {field(
              "company",
              copy.companyLabel,
              copy.companyPlaceholder,
              company,
              setCompany,
              { autoComplete: "organization" },
            )}
            {field("phone", copy.phoneLabel, copy.phonePlaceholder, phone, setPhone, {
              type: "tel",
              inputMode: "tel",
              autoComplete: "tel",
            })}
            {field("email", copy.emailLabel, copy.emailPlaceholder, email, setEmail, {
              type: "email",
              inputMode: "email",
              autoComplete: "email",
            })}
          </div>

          <div>
            <label htmlFor="client-source" className={fieldLabel}>
              {copy.sourceLabel}
            </label>
            <Select value={source} onValueChange={(value) => setSource(value as string)}>
              <SelectTrigger
                id="client-source"
                className="mt-2 h-11 w-full rounded-xl border-hairline bg-white/[0.02] text-[0.9375rem] text-ink hover:bg-white/[0.035]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border border-hairline bg-deck-card">
                {pipelineConfig.sources.map((option) => (
                  <SelectItem key={option} value={option} className="text-[0.875rem]">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="client-note" className={fieldLabel}>
              {copy.noteLabel}{" "}
              <span className="normal-case tracking-normal text-ink-muted">
                {copy.noteHint}
              </span>
            </label>
            <textarea
              id="client-note"
              name="note"
              rows={3}
              placeholder={copy.notePlaceholder}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={cn(inputBase, "mt-2 h-auto resize-none py-3 leading-relaxed")}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={pending}
              onClick={close}
            >
              {copy.cancelLabel}
            </Button>

            <Button type="submit" size="lg" disabled={pending} className="font-semibold">
              {pending ? (
                <>
                  <LoaderCircle aria-hidden className="deck-spin size-4" />
                  {copy.submitPendingLabel}
                </>
              ) : (
                copy.submitLabel
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
