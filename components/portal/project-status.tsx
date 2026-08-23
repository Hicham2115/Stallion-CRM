import { Hourglass, Rocket, Sparkles, type LucideIcon } from "lucide-react";

import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { portalConfig } from "@/config/portal";
import { template } from "@/lib/format";
import type { ProjectProgress } from "@/lib/store/selectors";
import { cn } from "@/lib/utils";

const { content } = portalConfig;

/**
 * ============================================================================
 *  WHERE THINGS STAND
 * ============================================================================
 *  The sentence a client would ask for out loud. The progress rail above says
 *  HOW MUCH is done; this says WHAT IS HAPPENING, which is a different question
 *  and the one people actually phone about.
 *
 *  Three states, and each is a genuinely different message rather than the same
 *  message with a number swapped in:
 *
 *    starting   nothing has been completed and nothing is under way yet
 *    working    one stage is in progress — named, because "in progress" on its
 *               own tells the client nothing they did not already know
 *    launched   every stage is finished
 *
 *  All three copy strings live in config/portal.ts. None of them uses the words
 *  "milestone", "stage id" or "pipeline".
 * ============================================================================
 */

/**
 * The accent each state carries.
 *
 * Deliberately NOT the reserved status palette. A project being under way is
 * not a warning, and a project being new is not an error — borrowing
 * `--status-warning` for "we are working on Design" is exactly the misuse the
 * Reserved Palette Rule in DESIGN.md exists to stop. These are brand and ink
 * tints instead, and the STATE ITSELF is carried by the heading text.
 */
const STATE_STYLE = {
  starting: "border-hairline bg-white/[0.03] text-ink-soft",
  working: "border-brand/25 bg-brand/10 text-brand",
  launched: "border-brand/30 bg-brand/12 text-brand",
} as const;

export function ProjectStatus({ progress }: { progress: ProjectProgress }) {
  const { icon: Icon, key, title, body } = describe(progress);

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title={content.status.title} hint={content.status.hint} />

      <PanelBody className="flex flex-1 flex-col">
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-xl border",
              STATE_STYLE[key],
            )}
          >
            <Icon aria-hidden className="size-[1.25rem]" />
          </span>

          <div className="min-w-0">
            {/* Title step (1.0625rem). The statement outranks the panel
                heading by voice — display face, semibold, full Ink against the
                header's Ink Muted hint — not by inventing a size step that is
                not on the ramp in DESIGN.md. */}
            <p className="font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
              {title}
            </p>
            <p className="mt-1.5 text-[0.875rem] leading-relaxed text-ink-soft">
              {body}
            </p>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* What comes after this one                                         */}
        {/* ---------------------------------------------------------------- */}
        {/* Pinned to the bottom so this panel and the contact card beside it
            line up at the foot, whichever of the three states is showing. */}
        <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-hairline pt-4 mt-5">
          <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
            {content.status.nextLabel}
          </span>
          <span className="text-[0.875rem] text-ink-soft">
            {progress.next?.label ?? content.status.nextNone}
          </span>
        </div>
      </PanelBody>
    </Panel>
  );
}

/** Which of the three messages this project gets. */
function describe(progress: ProjectProgress): {
  key: keyof typeof STATE_STYLE;
  icon: LucideIcon;
  title: string;
  body: string;
} {
  if (progress.launched) {
    return {
      key: "launched",
      icon: Rocket,
      title: content.status.launchedTitle,
      body: content.status.launchedBody,
    };
  }

  if (progress.current) {
    return {
      key: "working",
      icon: Hourglass,
      title: template(content.status.workingTitle, {
        phase: progress.current.label,
      }),
      body: content.status.workingBody,
    };
  }

  return {
    key: "starting",
    icon: Sparkles,
    title: content.status.startingTitle,
    body: content.status.startingBody,
  };
}
