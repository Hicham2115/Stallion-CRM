import Link from "next/link";
import { ArrowUpRight, Clock, Eye, } from "lucide-react";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { portalConfig } from "@/config/portal";
import { formatDaysAgo, template } from "@/lib/format";
import { cn } from "@/lib/utils";
const { content, features, routes } = portalConfig;
// Live site link removed at the client's request — preview is the only link
// shown here now, so it's always the lime "primary" action.
export function ProjectLinks({ lead,
// The Previews screen sets this false since it already renders the gallery
// directly below this panel.
showGalleryLink = true, }) {
    // Newest first, so the freshest preview is the one linked rather than a
    // stale URL.
    const preview = lead.previews[0];
    return (<Panel>
      <PanelHeader title={content.links.title} hint={content.links.hint} actions={
        // Only offered when there's more than the one preview already linked.
        showGalleryLink &&
            features.previewGallery &&
            lead.previews.length > 1 ? (<Link href={routes.previews} className="rounded text-[0.8125rem] font-medium text-ink-muted underline-offset-4 transition-colors hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
              {content.previews.seeAll}
            </Link>) : undefined}/>

      <PanelBody>
        <LinkCard icon={Eye} badge={content.links.previewBadge} badgeTone="neutral" title={content.links.previewTitle} body={content.links.previewBody} href={preview?.url ?? null} action={content.links.previewAction} primary meta={preview
            ? template(content.links.previewUpdated, {
                when: formatDaysAgo(preview.updatedDaysAgo).toLowerCase(),
            })
            : undefined} note={preview?.url ? content.links.privacyNote : undefined} emptyIcon={Clock} emptyTitle={content.links.previewEmptyTitle} emptyBody={content.links.previewEmptyBody}/>
      </PanelBody>
    </Panel>);
}
const BADGE_TONE = {
    neutral: "border-hairline bg-white/[0.04] text-ink-muted",
};
function LinkCard({ icon: Icon, badge, badgeTone, title, body, href, action, primary, meta, note, emptyIcon: EmptyIcon, emptyTitle, emptyBody, }) {
    const available = Boolean(href);
    return (<div className={cn("flex flex-col rounded-xl border p-4 sm:p-5",
        // Recedes rather than disappears, so a single-card row doesn't hide
        // that a live site is coming.
        available
            ? "border-hairline bg-white/[0.02]"
            : "border-hairline/60 bg-white/[0.012]")}>
      <div className="flex items-center justify-between gap-3">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg border border-hairline bg-white/[0.03]", available ? "text-ink-soft" : "text-ink-muted")}>
          <Icon aria-hidden className="size-[1.0625rem]"/>
        </span>

        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.16em]", BADGE_TONE[badgeTone])}>
          {badge}
        </span>
      </div>

      <p className={cn("mt-4 font-display text-[1.0625rem] font-semibold tracking-[-0.02em]", available ? "text-ink" : "flex items-center gap-2 text-ink-soft")}>
        {!available && (<EmptyIcon aria-hidden className="size-4 shrink-0 text-ink-muted"/>)}
        {available ? title : emptyTitle}
      </p>
      <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-muted">
        {available ? body : emptyBody}
      </p>

      <div className="mt-auto pt-5">
        {available && (<>
            {meta && (<p className="mb-2.5 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
                {meta}
              </p>)}

            {/* Real anchor, not a button+onClick, so middle-click / open-in-new-tab
                / copy-link work. rel="noopener noreferrer" is required with
                target="_blank" to stop the opened page reaching back via window.opener. */}
            <a href={href} target="_blank" rel="noopener noreferrer" className={cn("group inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[0.875rem] font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-deck-surface", primary
                ? "bg-brand text-deck-void shadow-[0_10px_26px_-14px_rgb(186_252_12/0.9)] hover:brightness-[1.06]"
                : "border border-hairline bg-white/[0.03] text-ink hover:border-hairline-strong hover:bg-white/[0.06]")}>
              {action}
              <ArrowUpRight aria-hidden className="size-4 transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px"/>
              <span className="sr-only">{content.links.newTabLabel}</span>
            </a>

            {note && (<p className="mt-3 text-[0.75rem] leading-relaxed text-ink-muted">
                {note}
              </p>)}
          </>)}
      </div>
    </div>);
}
