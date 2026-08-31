"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { StatusDot } from "@/components/deck/status-dot";
import { Button } from "@/components/ui/button";
import { findStage, pipelineConfig, stageColor } from "@/config/pipeline";
import { settingsConfig } from "@/config/settings";
import { template } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
const { content } = settingsConfig;
// Renaming only edits the label — leads store the stage id, so a rename
// can't reassign leads or break the dashboard. Reorder chevrons are disabled
// at the ends (rather than silently doing nothing) and each move is
// announced in a live region plus a toast.
export function StageEditor() {
    const { state, actions } = useCrm();
    const [editingId, setEditingId] = useState(null);
    const [draftLabel, setDraftLabel] = useState("");
    // Spoken after a reorder — the visual change alone is silent.
    const [announcement, setAnnouncement] = useState("");
    const stages = state.stageOrder;
    async function commitRename(id, original) {
        const label = draftLabel.trim();
        setEditingId(null);
        if (!label || label === original)
            return;
        const result = await actions.renameStage(id, label);
        if (result.ok)
            toast.success(template(content.renameToast, { name: label }));
    }
    async function move(index, direction) {
        const target = index + direction;
        if (target < 0 || target >= stages.length)
            return;
        const next = stages.slice();
        [next[index], next[target]] = [next[target], next[index]];
        // Full ordered id list, not a delta, so a dropped request can't leave
        // the order half-applied.
        const result = await actions.reorderStages(next.map((stage) => stage.id));
        if (!result.ok)
            return;
        setAnnouncement(template(content.reorderAnnouncement, {
            name: stages[index].label,
            position: target + 1,
            total: stages.length,
        }));
        toast.success(content.reorderToast);
    }
    return (<Panel>
      <PanelHeader title={content.stagesTitle} hint={content.stagesHint}/>

      <PanelBody>
        <p className="mb-5 flex items-start gap-2.5 rounded-md border border-hairline bg-white/[0.02] px-3.5 py-3 text-[0.8125rem] leading-relaxed text-ink-muted">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-faint"/>
          {content.stagesReassurance}
        </p>

        <ul className="flex flex-col gap-2">
          {stages.map((stage, index) => {
            const known = findStage(pipelineConfig.stages, stage.id);
            const editing = editingId === stage.id;
            const first = index === 0;
            const last = index === stages.length - 1;
            return (<li key={stage.id} className="flex items-center gap-3 rounded-md border border-hairline bg-white/[0.02] px-3.5 py-2.5">
                <StatusDot color={known ? stageColor(known) : "var(--stage-neutral)"}/>

                {editing ? (<input autoFocus value={draftLabel} onChange={(event) => setDraftLabel(event.target.value)} onBlur={() => void commitRename(stage.id, stage.label)} onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            void commitRename(stage.id, stage.label);
                        }
                        if (event.key === "Escape")
                            setEditingId(null);
                    }} aria-label={content.stageNameLabel} className="deck-input h-8 min-w-0 flex-1 rounded-md border border-brand/45 bg-white/[0.04] px-2.5 text-[0.875rem] text-ink caret-brand outline-none focus:ring-2 focus:ring-brand/25"/>) : (<button type="button" onClick={() => {
                        setEditingId(stage.id);
                        setDraftLabel(stage.label);
                    }} className="min-w-0 flex-1 truncate rounded text-left text-[0.875rem] text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
                    {stage.label}
                  </button>)}

                <code className="hidden shrink-0 font-mono text-[0.625rem] text-ink-muted sm:block">
                  {stage.id}
                </code>

                <div className="flex shrink-0 items-center gap-0.5">
                  <Button variant="ghost" size="icon-sm" disabled={first} aria-label={`${content.moveUpLabel} — ${stage.label}`} onClick={() => void move(index, -1)} className="text-ink-muted hover:text-ink">
                    <ChevronUp aria-hidden/>
                  </Button>

                  <Button variant="ghost" size="icon-sm" disabled={last} aria-label={`${content.moveDownLabel} — ${stage.label}`} onClick={() => void move(index, 1)} className="text-ink-muted hover:text-ink">
                    <ChevronDown aria-hidden/>
                  </Button>
                </div>
              </li>);
        })}
        </ul>

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </PanelBody>
    </Panel>);
}
