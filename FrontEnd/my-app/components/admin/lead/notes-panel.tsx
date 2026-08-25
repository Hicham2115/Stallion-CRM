"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, StickyNote } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { Button } from "@/components/ui/button";
import { leadConfig } from "@/config/lead";
import { formatDaysAgo } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import type { Note } from "@/lib/types";

const { content, features } = leadConfig;

/**
 * The lead's notes, newest first, with an inline composer.
 *
 * The composer submits on Ctrl/Cmd+Enter as well as the button. A note is a
 * multi-line field, so plain Enter has to insert a newline — but a rep typing
 * one line and reaching for Enter is the common case, and the modifier gives
 * them a keyboard path without breaking the other.
 */
export function NotesPanel({
  leadId,
  notes,
}: {
  leadId: string;
  notes: Note[];
}) {
  const { actions } = useCrm();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  const canSubmit = body.trim().length > 0 && !pending;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setPending(true);
    const result = await actions.addNote(leadId, body.trim());
    if (result.ok) {
      setBody("");
      toast.success(content.addNoteToast);
    }
    setPending(false);
  }

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title={content.notesTitle} hint={content.notesHint} />

      <PanelBody className="flex flex-1 flex-col">
        {features.notes && (
          <form onSubmit={handleSubmit} className="mb-5" data-print="hide">
            <label htmlFor="lead-note" className="sr-only">
              {content.addNoteLabel}
            </label>
            <textarea
              id="lead-note"
              rows={2}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  void handleSubmit(event);
                }
              }}
              placeholder={content.addNotePlaceholder}
              className="deck-input w-full resize-none rounded-xl border border-hairline bg-white/[0.02] px-3.5 py-3 text-[0.875rem] leading-relaxed text-ink caret-brand outline-none transition duration-200 placeholder:text-ink-muted hover:border-hairline-strong hover:bg-white/[0.035] focus:border-brand/55 focus:bg-white/[0.05] focus:ring-4 focus:ring-brand/10"
            />

            <div className="mt-2 flex justify-end">
              {/* Outline, not the lime default: "Convert to Client" in the
                  header is this screen's primary action, and two lime fills
                  make neither of them the answer to "what do I do here". */}
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={!canSubmit}
              >
                {pending ? (
                  <LoaderCircle aria-hidden className="deck-spin size-3.5" />
                ) : null}
                {content.addNoteSubmit}
              </Button>
            </div>
          </form>
        )}

        {notes.length === 0 ? (
          <EmptyState icon={StickyNote} title={content.notesEmpty} />
        ) : (
          <ul className="flex flex-col gap-3">
            {notes.map((note) => (
              <li
                key={note.id}
                className="rounded-xl border border-hairline bg-white/[0.02] p-3.5"
              >
                <p className="text-[0.875rem] leading-relaxed text-ink-soft">
                  {note.body}
                </p>
                <p className="mt-2 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted">
                  {note.authorName} · {formatDaysAgo(note.daysAgo)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </PanelBody>
    </Panel>
  );
}
