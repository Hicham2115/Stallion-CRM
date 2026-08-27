"use client";
import { useState } from "react";
import { ArrowUpRight, Globe, LoaderCircle, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/deck/confirm-dialog";
import { fieldBase, fieldErrorText } from "@/components/deck/field";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { StatusPill } from "@/components/deck/status-pill";
import { Button } from "@/components/ui/button";
import { devConfig } from "@/config/dev";
import { template } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import { selectProjectProgress } from "@/lib/store/selectors";
import { cn } from "@/lib/utils";
const copy = devConfig.content.live;
// Saving a live link while steps are still open is silent by nature — the
// developer sees a saved field, the client sees a "finished" card — so the
// panel warns in place (not a blocking modal, since a soft launch is often
// intentional) rather than staying quiet. Clearing the link IS confirmed,
// since it removes something from the client with no undo.
export function LiveSitePanel({ lead }) {
    const { actions } = useCrm();
    const [draft, setDraft] = useState(lead.liveUrl ?? "");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState(null);
    const [clearing, setClearing] = useState(false);
    // Resets draft when the record changes underneath it (demo reset, another
    // tab editing the same lead). Adjusted during render rather than in a
    // useEffect — React's documented pattern for this, avoiding an extra
    // cascading render.
    const stored = lead.liveUrl ?? "";
    const [lastStored, setLastStored] = useState(stored);
    if (lastStored !== stored) {
        setLastStored(stored);
        setDraft(stored);
    }
    const progress = selectProjectProgress(lead);
    const openSteps = progress.total - progress.done;
    const dirty = draft.trim() !== (lead.liveUrl ?? "");
    async function handleSave(event) {
        event.preventDefault();
        setError(null);
        setPending(true);
        const result = await actions.setLiveUrl(lead, draft.trim() || null);
        setPending(false);
        if (!result.ok) {
            setError(result.message);
            return;
        }
        toast.success(draft.trim() ? copy.saveToast : copy.clearToast);
    }
    async function handleClear() {
        const result = await actions.setLiveUrl(lead, null);
        if (result.ok) {
            setDraft("");
            toast.success(copy.clearToast);
        }
        else {
            toast.error(result.message);
        }
    }
    return (<Panel className="flex h-full flex-col">
      <PanelHeader title={copy.title} hint={copy.hint} actions={<StatusPill tone={lead.liveUrl ? "good" : "neutral"} label={lead.liveUrl ? copy.liveNow : copy.notLive}/>}/>

      <PanelBody className="flex flex-1 flex-col">
        <p className="text-[0.875rem] leading-relaxed text-ink-soft">
          {copy.description}
        </p>

        <form onSubmit={handleSave} className="mt-4 flex flex-wrap gap-2.5">
          <span className="group relative min-w-0 flex-1">
            <Globe aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted transition-colors group-focus-within:text-brand"/>
            <input type="url" inputMode="url" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={copy.placeholder} aria-label={copy.title} aria-invalid={Boolean(error)} className={cn(fieldBase, "h-11 w-full pl-10 pr-3.5")}/>
          </span>

          <Button type="submit" size="lg" disabled={pending || !dirty} className="h-11 shrink-0 font-semibold">
            {pending && <LoaderCircle aria-hidden className="deck-spin size-4"/>}
            {pending ? copy.saving : copy.save}
          </Button>
        </form>

        <div aria-live="polite">
          {error && (<p role="alert" className={cn("mt-2.5", fieldErrorText)}>
              {error}
            </p>)}
        </div>

        {openSteps > 0 && (draft.trim() || lead.liveUrl) && (<p className="mt-3 flex items-start gap-2.5 rounded-xl border border-status-warning/25 bg-status-warning/[0.07] px-3.5 py-3 text-[0.8125rem] leading-relaxed text-status-warning">
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0"/>
            {template(copy.earlyWarning, { n: openSteps })}
          </p>)}

        {lead.liveUrl && (<div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4 mt-5">
            <a href={lead.liveUrl} target="_blank" rel="noopener noreferrer" className="group inline-flex min-w-0 items-center gap-1.5 text-[0.875rem] font-medium text-ink-soft transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
              <span className="truncate">{copy.openLabel}</span>
              <ArrowUpRight aria-hidden className="size-3.5 shrink-0 transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px"/>
            </a>

            <button type="button" onClick={() => setClearing(true)} className="shrink-0 rounded px-1.5 py-0.5 text-[0.875rem] font-medium text-status-critical/85 transition-colors hover:text-status-critical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-critical/50">
              {copy.clear}
            </button>
          </div>)}
      </PanelBody>

      <ConfirmDialog open={clearing} onOpenChange={setClearing} title={copy.clearTitle} description={copy.clearDescription} recordName={lead.liveUrl ?? undefined} confirmLabel={copy.clearConfirm} pendingLabel={copy.clearPending} onConfirm={handleClear}/>
    </Panel>);
}
