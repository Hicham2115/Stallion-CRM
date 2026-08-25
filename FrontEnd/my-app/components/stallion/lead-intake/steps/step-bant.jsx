import { DollarSign, MessageSquare, CalendarClock, Paperclip, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { stepBantSchema, BUDGET_BANDS_BY_TRACK, DESIRED_LAUNCH_OPTIONS, validateBriefFile } from "@/lib/validations/lead";

const LAUNCH_LABELS = {
  asap: "ASAP",
  "1-3mo": "1–3 months",
  "3-6mo": "3–6 months",
  "6mo+": "6+ months",
  exploring: "Just exploring",
};

function fieldError(field) {
  const [error] = field.state.meta.errors;
  return field.state.meta.isTouched && error ? error : null;
}

export function StepBant({ form, briefFile, onBriefFileChange, fileError, onFileErrorChange }) {
  const track = form.state.values.track;
  const budgetOptions = BUDGET_BANDS_BY_TRACK[track] ?? [];

  function handleFileSelect(e) {
    const file = e.target.files?.[0] ?? null;
    const result = validateBriefFile(file);
    if (!result.ok) {
      onFileErrorChange(result.message);
      onBriefFileChange(null);
      e.target.value = "";
      return;
    }
    onFileErrorChange(null);
    onBriefFileChange(file);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="font-heading text-lg font-bold text-white">Let&apos;s talk scope</h3>
        <p className="mt-1 text-sm text-white/50">Helps us route this to the right person, fast.</p>
      </div>

      <form.Field
        name="budget_band"
        validators={{
          onChange: ({ value }) => stepBantSchema.shape.budget_band.safeParse(value).error?.issues[0]?.message,
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="budget_band">
              <DollarSign className="size-3.5 text-white/40" /> Budget range
            </Label>
            <Select value={field.state.value} onValueChange={(value) => field.handleChange(value)}>
              <SelectTrigger id="budget_band" className="h-11 w-full bg-white/[0.03] text-[15px]">
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
        )}
      </form.Field>

      <form.Field
        name="need_description"
        validators={{
          onChange: ({ value }) => stepBantSchema.shape.need_description.safeParse(value).error?.issues[0]?.message,
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="need_description">
              <MessageSquare className="size-3.5 text-white/40" /> What problem are you solving?
            </Label>
            <Textarea
              id="need_description"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              rows={4}
              placeholder="Tell us what's not working today..."
              className="bg-white/[0.03] text-[15px]"
            />
            {fieldError(field) && <p className="text-xs text-red-400">{fieldError(field)}</p>}
          </div>
        )}
      </form.Field>

      <form.Field
        name="desired_launch"
        validators={{
          onChange: ({ value }) => stepBantSchema.shape.desired_launch.safeParse(value).error?.issues[0]?.message,
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="desired_launch">
              <CalendarClock className="size-3.5 text-white/40" /> Desired launch
            </Label>
            <Select value={field.state.value} onValueChange={(value) => field.handleChange(value)}>
              <SelectTrigger id="desired_launch" className="h-11 w-full bg-white/[0.03] text-[15px]">
                <SelectValue placeholder="Select a timeline" />
              </SelectTrigger>
              <SelectContent>
                {DESIRED_LAUNCH_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {LAUNCH_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="brief_file">
          <Paperclip className="size-3.5 text-white/40" /> Brief or brand assets
          <span className="font-normal text-white/35">(optional)</span>
        </Label>
        {briefFile ? (
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80">
            <span className="truncate">{briefFile.name}</span>
            <button
              type="button"
              onClick={() => onBriefFileChange(null)}
              className="ml-2 shrink-0 text-white/40 hover:text-white"
              aria-label="Remove file"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <input
            id="brief_file"
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={handleFileSelect}
            className="block w-full text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-white/15"
          />
        )}
        {fileError && <p className="text-xs text-red-400">{fileError}</p>}
      </div>
    </div>
  );
}
