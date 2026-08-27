import { Hourglass, Rocket, Sparkles } from "lucide-react";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { portalConfig } from "@/config/portal";
import { template } from "@/lib/format";
import { cn } from "@/lib/utils";
const { content } = portalConfig;
// Says WHAT IS HAPPENING (vs. the progress rail's HOW MUCH is done), as one
// of three genuinely different messages (starting/working/launched) rather
// than the same message with a number swapped in. Deliberately not the
// reserved status palette below — a project underway isn't a warning and a
// new project isn't an error, so these are brand/ink tints instead, with the
// state itself carried by the heading text.
const STATE_STYLE = {
    starting: "border-hairline bg-white/[0.03] text-ink-soft",
    working: "border-brand/25 bg-brand/10 text-brand",
    launched: "border-brand/30 bg-brand/12 text-brand",
};
export function ProjectStatus({ progress }) {
    const { icon: Icon, key, title, body } = describe(progress);
    return (<Panel className="flex h-full flex-col">
      <PanelHeader title={content.status.title} hint={content.status.hint}/>

      <PanelBody className="flex flex-1 flex-col">
        <div className="flex items-start gap-4">
          <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl border", STATE_STYLE[key])}>
            <Icon aria-hidden className="size-[1.25rem]"/>
          </span>

          <div className="min-w-0">
            <p className="font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
              {title}
            </p>
            <p className="mt-1.5 text-[0.875rem] leading-relaxed text-ink-soft">
              {body}
            </p>
          </div>
        </div>

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
    </Panel>);
}
function describe(progress) {
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
