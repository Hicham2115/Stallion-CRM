"use client";
import { useState } from "react";
import { CircleAlert, LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { fieldAlert, fieldBase, fieldErrorText, fieldInvalid, fieldLabel, } from "@/components/deck/field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { clientsConfig } from "@/config/clients";
import { pipelineConfig } from "@/config/pipeline";
import { template } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import { cn } from "@/lib/utils";
const { content, validation } = clientsConfig;
const copy = content.dialog;
const inputBase = cn(fieldBase, "h-11 px-3.5");
const errorText = cn("mt-1.5", fieldErrorText);
// The rep's version of the admin's Add Client dialog — one real difference:
// the record is assigned to the rep creating it (the admin dialog leaves
// assignedRepId null and assigns it afterwards). Copy/validation are shared
// with the admin dialog's config so the two forms can't describe fields
// differently.
export function AddMyClientDialog({ repId }) {
    const { actions } = useCrm();
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);
    const [name, setName] = useState("");
    const [company, setCompany] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [source, setSource] = useState(pipelineConfig.sources[0]);
    const [note, setNote] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState(null);
    function reset() {
        setName("");
        setCompany("");
        setPhone("");
        setEmail("");
        setSource(pipelineConfig.sources[0]);
        setNote("");
        setFieldErrors({});
        setFormError(null);
    }
    function validate() {
        const errors = {};
        const trimmedName = name.trim();
        if (!trimmedName)
            errors.name = copy.errors.nameRequired;
        else if (trimmedName.length < validation.minNameLength)
            errors.name = copy.errors.nameTooShort;
        if (!company.trim())
            errors.company = copy.errors.companyRequired;
        const trimmedPhone = phone.trim();
        if (!trimmedPhone)
            errors.phone = copy.errors.phoneRequired;
        else if (!validation.phonePattern.test(trimmedPhone))
            errors.phone = copy.errors.phoneInvalid;
        const trimmedEmail = email.trim();
        if (!trimmedEmail)
            errors.email = copy.errors.emailRequired;
        else if (!validation.emailPattern.test(trimmedEmail))
            errors.email = copy.errors.emailInvalid;
        return errors;
    }
    async function handleSubmit(event) {
        event.preventDefault();
        setFormError(null);
        const errors = validate();
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            const first = ["name", "company", "phone", "email"].find((key) => errors[key]);
            document.getElementById(`rep-client-${first}`)?.focus();
            return;
        }
        setPending(true);
        const result = await actions.addClient({
            name: name.trim(),
            company: company.trim(),
            phone: phone.trim(),
            email: email.trim(),
            source,
            note: note.trim(),
            assignedRepId: repId,
        });
        setPending(false);
        if (!result.ok) {
            const field = result.field;
            if (field && ["name", "company", "phone", "email"].includes(field)) {
                setFieldErrors({ [field]: result.message });
                document.getElementById(`rep-client-${field}`)?.focus();
            }
            else {
                setFormError(result.message);
            }
            return;
        }
        toast.success(template(copy.successToast, { name: result.data.name }));
        setOpen(false);
        reset();
    }
    return (<Dialog open={open} onOpenChange={(next) => {
            setOpen(next);
            if (!next)
                reset();
        }}>
      <DialogTrigger render={<Button size="lg" className="h-10 rounded-xl font-semibold"/>}>
        <Plus aria-hidden className="size-4"/>
        {content.addLabel}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[30rem]">
        <DialogTitle className="font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
          {copy.title}
        </DialogTitle>
        <DialogDescription className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-muted">
          {copy.description}
        </DialogDescription>

        <div aria-live="polite">
          {formError && (<div role="alert" className={cn(fieldAlert, "mt-5")}>
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0"/>
              <span>{formError}</span>
            </div>)}
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rep-client-name" className={fieldLabel}>
                {copy.nameLabel}
              </label>
              <input id="rep-client-name" value={name} onChange={(event) => setName(event.target.value)} placeholder={copy.namePlaceholder} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "rep-client-name-error" : undefined} className={cn(inputBase, "mt-2", fieldErrors.name && fieldInvalid)}/>
              {fieldErrors.name && (<p id="rep-client-name-error" role="alert" className={errorText}>
                  {fieldErrors.name}
                </p>)}
            </div>

            <div>
              <label htmlFor="rep-client-company" className={fieldLabel}>
                {copy.companyLabel}
              </label>
              <input id="rep-client-company" value={company} onChange={(event) => setCompany(event.target.value)} placeholder={copy.companyPlaceholder} aria-invalid={Boolean(fieldErrors.company)} aria-describedby={fieldErrors.company ? "rep-client-company-error" : undefined} className={cn(inputBase, "mt-2", fieldErrors.company && fieldInvalid)}/>
              {fieldErrors.company && (<p id="rep-client-company-error" role="alert" className={errorText}>
                  {fieldErrors.company}
                </p>)}
            </div>

            <div>
              <label htmlFor="rep-client-phone" className={fieldLabel}>
                {copy.phoneLabel}
              </label>
              <input id="rep-client-phone" type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={copy.phonePlaceholder} aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? "rep-client-phone-error" : undefined} className={cn(inputBase, "mt-2", fieldErrors.phone && fieldInvalid)}/>
              {fieldErrors.phone && (<p id="rep-client-phone-error" role="alert" className={errorText}>
                  {fieldErrors.phone}
                </p>)}
            </div>

            <div>
              <label htmlFor="rep-client-email" className={fieldLabel}>
                {copy.emailLabel}
              </label>
              <input id="rep-client-email" type="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={copy.emailPlaceholder} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "rep-client-email-error" : undefined} className={cn(inputBase, "mt-2", fieldErrors.email && fieldInvalid)}/>
              {fieldErrors.email && (<p id="rep-client-email-error" role="alert" className={errorText}>
                  {fieldErrors.email}
                </p>)}
            </div>
          </div>

          <div>
            <label htmlFor="rep-client-source" className={fieldLabel}>
              {copy.sourceLabel}
            </label>
            {/* Base UI types onValueChange as string | null; guarded rather
                than cast so a future clear button can't silently write null. */}
            <Select value={source} onValueChange={(value) => setSource(value ?? source)}>
              <SelectTrigger id="rep-client-source" className={cn(inputBase, "mt-2 justify-between")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pipelineConfig.sources.map((entry) => (<SelectItem key={entry} value={entry}>
                    {entry}
                  </SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="rep-client-note" className={fieldLabel}>
              {copy.noteLabel}
            </label>
            <textarea id="rep-client-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder={copy.notePlaceholder} className={cn(fieldBase, "mt-2 w-full resize-y px-3.5 py-2.5 leading-relaxed")}/>
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <Button type="button" variant="ghost" size="lg" onClick={() => setOpen(false)} className="font-medium">
              {copy.cancelLabel}
            </Button>

            <Button type="submit" size="lg" disabled={pending} className="font-semibold">
              {pending && <LoaderCircle aria-hidden className="deck-spin size-4"/>}
              {pending ? copy.submitPendingLabel : copy.submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);
}
