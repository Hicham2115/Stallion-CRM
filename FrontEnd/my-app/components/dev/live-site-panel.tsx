"use client";

import { useState, type FormEvent } from "react";
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
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

const copy = devConfig.content.live;

/**
 * ============================================================================
 *  LIVE SITE
 * ============================================================================
 *  The public URL, and the switch that turns on the client's "Your live site"
 *  card.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  IT WARNS BEFORE A PREMATURE LAUNCH
 *  ─────────────────────────────────────────────────────────────────────────
 *  Saving a live link while steps are still open is the most consequential
 *  thing on this whole screen, and it is silent by nature: the developer sees a
 *  saved field, and the CLIENT sees a card that says the work is finished. If
 *  it is not, they will click it, find half-built pages at a public address,
 *  and reasonably conclude the agency launched without telling them.
 *
 *  So the panel counts the open steps and says so, in place, before the save —
 *  not as a modal to dismiss, because this is often exactly what you meant to
 *  do (a soft launch, a holding page) and a blocking prompt on a legitimate
 *  action is a prompt people learn to click through.
 *
 *  CLEARING IS CONFIRMED, THOUGH. Removing the link takes something away from
 *  the client rather than giving it, and there is no undo on this field.
 * ============================================================================
 */
export function LiveSitePanel({ lead }: { lead: Lead }) {
  const { actions } = useCrm();

  const [draft, setDraft] = useState(lead.liveUrl ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  /**
   * Keep the field honest when the record changes underneath it — a demo
   * reset, or an admin editing the same lead in another tab. Without this the
   * input keeps showing a value that is no longer stored, which is the one
   * thing a URL field must never do.
   *
   * ADJUSTED DURING RENDER, NOT IN AN EFFECT. This is React's documented
   * pattern for "reset some state when a prop changes"
   * (react.dev/reference/react/useState#storing-information-from-previous-renders):
   * the comparison runs during render, React restarts this component
   * immediately without touching the DOM or the children, and there is no
   * second commit. The `useEffect` version does the same job one paint later
   * and is a cascading render — which is what the lint rule is pointing at.
   */
  const stored = lead.liveUrl ?? "";
  const [lastStored, setLastStored] = useState(stored);
  if (lastStored !== stored) {
    setLastStored(stored);
    setDraft(stored);
  }

  const progress = selectProjectProgress(lead);
  const openSteps = progress.total - progress.done;

  const dirty = draft.trim() !== (lead.liveUrl ?? "");

  async function handleSave(event: FormEvent) {
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
    } else {
      toast.error(result.message);
    }
  }

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title={copy.title}
        hint={copy.hint}
        actions={
          <StatusPill
            tone={lead.liveUrl ? "good" : "neutral"}
            label={lead.liveUrl ? copy.liveNow : copy.notLive}
          />
        }
      />

      <PanelBody className="flex flex-1 flex-col">
        <p className="text-[0.875rem] leading-relaxed text-ink-soft">
          {copy.description}
        </p>

        <form onSubmit={handleSave} className="mt-4 flex flex-wrap gap-2.5">
          <span className="group relative min-w-0 flex-1">
            <Globe
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted transition-colors group-focus-within:text-brand"
            />
            <input
              type="url"
              inputMode="url"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={copy.placeholder}
              aria-label={copy.title}
              aria-invalid={Boolean(error)}
              className={cn(fieldBase, "h-11 w-full pl-10 pr-3.5")}
            />
          </span>

          <Button
            type="submit"
            size="lg"
            // Nothing to save when nothing changed. A button that runs a
            // request and reports success without doing anything trains people
            // to distrust the confirmation.
            disabled={pending || !dirty}
            className="h-11 shrink-0 font-semibold"
          >
            {pending && <LoaderCircle aria-hidden className="deck-spin size-4" />}
            {pending ? copy.saving : copy.save}
          </Button>
        </form>

        <div aria-live="polite">
          {error && (
            <p role="alert" className={cn("mt-2.5", fieldErrorText)}>
              {error}
            </p>
          )}
        </div>

        {/* The warning: in place, not blocking. Shown while there is something
            to type OR something already saved, since both are a launch. */}
        {openSteps > 0 && (draft.trim() || lead.liveUrl) && (
          <p className="mt-3 flex items-start gap-2.5 rounded-xl border border-status-warning/25 bg-status-warning/[0.07] px-3.5 py-3 text-[0.8125rem] leading-relaxed text-status-warning">
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            {template(copy.earlyWarning, { n: openSteps })}
          </p>
        )}

        {/* ---- What is live right now ---- */}
        {lead.liveUrl && (
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4 mt-5">
            <a
              href={lead.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex min-w-0 items-center gap-1.5 text-[0.875rem] font-medium text-ink-soft transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
            >
              <span className="truncate">{copy.openLabel}</span>
              <ArrowUpRight
                aria-hidden
                className="size-3.5 shrink-0 transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px"
              />
            </a>

            <button
              type="button"
              onClick={() => setClearing(true)}
              className="shrink-0 rounded px-1.5 py-0.5 text-[0.875rem] font-medium text-status-critical/85 transition-colors hover:text-status-critical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-critical/50"
            >
              {copy.clear}
            </button>
          </div>
        )}
      </PanelBody>

      <ConfirmDialog
        open={clearing}
        onOpenChange={setClearing}
        title={copy.clearTitle}
        description={copy.clearDescription}
        recordName={lead.liveUrl ?? undefined}
        confirmLabel={copy.clearConfirm}
        pendingLabel={copy.clearPending}
        onConfirm={handleClear}
      />
    </Panel>
  );
}
