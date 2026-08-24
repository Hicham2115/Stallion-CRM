"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { toast } from "sonner";

import { fieldBase, fieldErrorText, fieldLabel } from "@/components/deck/field";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { Button } from "@/components/ui/button";
import { devConfig } from "@/config/dev";
import { formatDaysAgo } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

const copy = devConfig.content.updates;

/**
 * ============================================================================
 *  POST AN UPDATE
 * ============================================================================
 *  A short note that lands at the top of the client's own dashboard.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  WHY THIS PANEL HAD TO EXIST
 *  ─────────────────────────────────────────────────────────────────────────
 *  The client portal reads `lead.updates`, and until now nothing in the
 *  product could WRITE it. The client's "Latest updates" feed was frozen at
 *  whatever the seed had put there — a panel that looked alive and was not.
 *  This is the other end of it.
 *
 *  IT IS NOT `lead.activity`. The activity timeline is the internal sales
 *  history — "First dial attempt made" — and no client ever sees it. Updates
 *  are written deliberately, in the client's direction, in their language. The
 *  two are separate fields for exactly that reason; see the CLIENT-SAFE RULE
 *  in config/portal.ts.
 *
 *  THE RECENT LIST IS NOT DECORATION. Without it a developer has no idea what
 *  was last said to this client, so the realistic failure is posting the same
 *  "designs are ready" twice a week apart. Three entries is enough to prevent
 *  that and short enough not to become a second feed.
 * ============================================================================
 */
export function UpdateComposer({ lead }: { lead: Lead }) {
  const { actions } = useCrm();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError(copy.errors.titleRequired);
      document.getElementById("update-title")?.focus();
      return;
    }

    setPending(true);
    const result = await actions.postUpdate(lead, {
      title: title.trim(),
      body: body.trim(),
    });
    setPending(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setTitle("");
    setBody("");
    toast.success(copy.toast);
  }

  const recent = lead.updates.slice(0, copy.recentLimit);

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title={copy.title} hint={copy.hint} />

      <PanelBody className="flex flex-1 flex-col">
        <p className="text-[0.875rem] leading-relaxed text-ink-soft">
          {copy.description}
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-3">
          <div>
            <label htmlFor="update-title" className={fieldLabel}>
              {copy.titleLabel}
            </label>
            <input
              id="update-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={copy.titlePlaceholder}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "update-error" : undefined}
              className={cn(fieldBase, "mt-2 h-11 w-full px-3.5")}
            />
          </div>

          <div>
            <label htmlFor="update-body" className={fieldLabel}>
              {copy.bodyLabel}
            </label>
            <textarea
              id="update-body"
              rows={3}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={copy.bodyPlaceholder}
              className={cn(fieldBase, "mt-2 w-full resize-y px-3.5 py-2.5 leading-relaxed")}
            />
          </div>

          <div aria-live="polite">
            {error && (
              <p id="update-error" role="alert" className={fieldErrorText}>
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              // Empty headline means nothing to post, and the field is visibly
              // empty — there is no error worth explaining.
              disabled={pending || title.trim().length === 0}
              className="h-11 font-semibold"
            >
              {pending ? (
                <LoaderCircle aria-hidden className="deck-spin size-4" />
              ) : (
                <Send aria-hidden className="size-4" />
              )}
              {pending ? copy.submitPending : copy.submit}
            </Button>
          </div>
        </form>

        {/* ---------------------------------------------------------------- */}
        {/* What this client was last told                                    */}
        {/* ---------------------------------------------------------------- */}
        <div className="mt-auto border-t border-hairline pt-4 mt-5">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
            {copy.recentLabel}
          </p>

          {recent.length === 0 ? (
            <p className="mt-2 text-[0.8125rem] text-ink-muted">
              {copy.emptyDescription}
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2.5">
              {recent.map((update) => (
                <li
                  key={update.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5"
                >
                  <span className="min-w-0 truncate text-[0.875rem] text-ink-soft">
                    {update.title}
                  </span>
                  <span className="deck-nums shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
                    {formatDaysAgo(update.daysAgo)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PanelBody>
    </Panel>
  );
}
