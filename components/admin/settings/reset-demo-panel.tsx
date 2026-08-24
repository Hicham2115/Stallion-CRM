"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/deck/confirm-dialog";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { Button } from "@/components/ui/button";
import { settingsConfig } from "@/config/settings";
import { STORE_VERSION } from "@/lib/store/persistence";
import { useCrm } from "@/lib/store/crm-store";

const { content } = settingsConfig;

/**
 * ============================================================================
 *  RESET DEMO DATA
 * ============================================================================
 *  REQUIRED, not optional, for as long as this console runs on mocks.
 *
 *  Console state persists to localStorage, which means every change survives a
 *  refresh and the app looks exactly like real software backed by a real
 *  database. That is the point — it demos properly — but it also means a demo
 *  can be walked into with half the leads dragged somewhere odd and three test
 *  clients called "asdf" in the table, with no way back short of clearing site
 *  data in devtools.
 *
 *  This is the guardrail that pairs with the MOCK DATA chip in the topbar: the
 *  chip says the data is not real, and this puts it back.
 *
 *  It is destructive and genuinely irreversible, so it goes through the same
 *  ConfirmDialog as every other destructive action — but with NO undo offered,
 *  because there is nothing to restore from.
 *
 *  TODO(backend): delete this panel with lib/mock/ and lib/store/persistence.ts.
 * ============================================================================
 */
export function ResetDemoPanel() {
  const { actions } = useCrm();
  const [open, setOpen] = useState(false);

  return (
    <Panel>
      <PanelHeader title={content.resetTitle} hint={content.resetHint} />

      <PanelBody className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-lg text-[0.8125rem] leading-relaxed text-ink-muted">
          {content.resetDialogDescription}
        </p>

        <div className="flex shrink-0 items-center gap-3">
          {/* Surfaced because it is the first thing to check when someone
              reports "my data disappeared after pulling" — a version bump moves
              the storage key, which is exactly what it is meant to do. */}
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted">
            store v{STORE_VERSION}
          </span>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setOpen(true)}
            className="h-10 rounded-xl"
          >
            <RotateCcw aria-hidden />
            {content.resetLabel}
          </Button>
        </div>
      </PanelBody>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={content.resetDialogTitle}
        description={content.resetDialogDescription}
        confirmLabel={content.resetConfirmLabel}
        onConfirm={() => {
          actions.resetDemoData();
          toast.success(content.resetToast);
        }}
      />
    </Panel>
  );
}
