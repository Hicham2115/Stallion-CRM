import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  Globe,
  Lock,
  Eye,
  type LucideIcon,
} from "lucide-react";

import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { portalConfig } from "@/config/portal";
import { formatDaysAgo, template } from "@/lib/format";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

const { content, features, routes } = portalConfig;

/**
 * ============================================================================
 *  YOUR LINKS — preview and live
 * ============================================================================
 *  The two questions every client of a web project asks, in the order they ask
 *  them: "can I see it yet?" and "is it up?".
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  ON THE WORDING
 *  ─────────────────────────────────────────────────────────────────────────
 *  Internally these are staging and production. Neither word appears anywhere
 *  on this panel, because neither means anything to the person reading it —
 *  and a client who has to ask what "staging" is has already been made to feel
 *  like they are in the wrong room.
 *
 *    preview  the private, unfinished version. The card says so twice: a
 *             "Work in progress" badge, and a line warning that things move
 *             around. Both exist so nobody reports the half-finished layout
 *             they were shown on purpose as a bug.
 *    live     the public one their own customers use.
 *
 *  Every string is in `content.links` in config/portal.ts. Change the whole
 *  vocabulary there.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  WHICH ONE GETS THE LIME
 *  ─────────────────────────────────────────────────────────────────────────
 *  Exactly one, per THE ONE LIME ANSWER RULE in DESIGN.md, and which one
 *  depends on where the project is: the live site once it exists, the preview
 *  until then. That tracks what the client came for — before launch the
 *  interesting link is the one showing new work, and after launch it is the
 *  real thing. The other card keeps the same shape and takes a quiet outline
 *  button, so the pair still reads as one instrument.
 * ============================================================================
 */

export function ProjectLinks({
  lead,
  /**
   * Whether to offer the link through to the gallery.
   *
   * The Previews screen sets this false: it renders this panel at the top and
   * the gallery directly underneath, so a "See all previews" link there points
   * at the page you are already reading.
   */
  showGalleryLink = true,
}: {
  lead: Lead;
  showGalleryLink?: boolean;
}) {
  // Newest first, so the freshest preview is the one linked. Falling back to a
  // stale entry would put an out-of-date URL behind a button labelled
  // "Open preview", which is worse than showing the empty state.
  const preview = lead.previews[0];

  // The live site wins the accent whenever it exists — see the note above.
  const livePrimary = Boolean(lead.liveUrl);

  return (
    <Panel>
      <PanelHeader
        title={content.links.title}
        hint={content.links.hint}
        actions={
          // Only offered when there is more than the one preview already
          // linked below — a "see all" that leads to a page showing the same
          // single card is a wasted click.
          showGalleryLink &&
          features.previewGallery &&
          lead.previews.length > 1 ? (
            <Link
              href={routes.previews}
              className="rounded text-[0.8125rem] font-medium text-ink-muted underline-offset-4 transition-colors hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
            >
              {content.previews.seeAll}
            </Link>
          ) : undefined
        }
      />

      <PanelBody>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* ---------------------------------------------------------------- */}
          {/* Preview — the work in progress                                    */}
          {/* ---------------------------------------------------------------- */}
          <LinkCard
            icon={Eye}
            badge={content.links.previewBadge}
            badgeTone="neutral"
            title={content.links.previewTitle}
            body={content.links.previewBody}
            href={preview?.url ?? null}
            action={content.links.previewAction}
            primary={!livePrimary}
            meta={
              preview
                ? template(content.links.previewUpdated, {
                    when: formatDaysAgo(preview.updatedDaysAgo).toLowerCase(),
                  })
                : undefined
            }
            // The client is being handed a private URL. Saying where it may go
            // is part of handing it over — leaving it unsaid is how a preview
            // ends up forwarded to a supplier before launch.
            note={preview?.url ? content.links.privacyNote : undefined}
            emptyIcon={Clock}
            emptyTitle={content.links.previewEmptyTitle}
            emptyBody={content.links.previewEmptyBody}
          />

          {/* ---------------------------------------------------------------- */}
          {/* Live — the public version                                         */}
          {/* ---------------------------------------------------------------- */}
          <LinkCard
            icon={Globe}
            badge={content.links.liveBadge}
            badgeTone="good"
            title={content.links.liveTitle}
            body={content.links.liveBody}
            href={lead.liveUrl}
            action={content.links.liveAction}
            primary={livePrimary}
            emptyIcon={Lock}
            emptyTitle={content.links.liveEmptyTitle}
            emptyBody={content.links.liveEmptyBody}
          />
        </div>
      </PanelBody>
    </Panel>
  );
}

/* --------------------------------------------------------------------------
   One card
   -------------------------------------------------------------------------- */

/**
 * Badge tints.
 *
 * `good` is the reserved status token and is used for exactly one thing here —
 * "Live" — because being live IS a state. "Work in progress" gets a neutral
 * hairline chip rather than `--status-warning`: an unfinished preview is the
 * normal, expected condition of a project mid-build, and painting it amber
 * would tell the client something is wrong when nothing is.
 */
const BADGE_TONE = {
  neutral: "border-hairline bg-white/[0.04] text-ink-muted",
  good: "border-status-good/28 bg-status-good/10 text-status-good",
} as const;

function LinkCard({
  icon: Icon,
  badge,
  badgeTone,
  title,
  body,
  href,
  action,
  primary,
  meta,
  note,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyBody,
}: {
  icon: LucideIcon;
  badge: string;
  badgeTone: keyof typeof BADGE_TONE;
  title: string;
  body: string;
  /** The destination, or null when there is nothing to open yet. */
  href: string | null;
  action: string;
  /** Whether this card carries the screen's one lime fill. */
  primary: boolean;
  /** Small line above the action, e.g. when the preview last changed. */
  meta?: string;
  /** Standing note under the action, e.g. the privacy reminder. */
  note?: string;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyBody: string;
}) {
  const available = Boolean(href);

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border p-4 sm:p-5",
        // An unavailable card recedes rather than disappearing. Dropping it
        // entirely would leave a single card on the row and hide the fact that
        // a live site is coming at all.
        available
          ? "border-hairline bg-white/[0.02]"
          : "border-hairline/60 bg-white/[0.012]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg border border-hairline bg-white/[0.03]",
            available ? "text-ink-soft" : "text-ink-muted",
          )}
        >
          <Icon aria-hidden className="size-[1.0625rem]" />
        </span>

        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.16em]",
            BADGE_TONE[badgeTone],
          )}
        >
          {badge}
        </span>
      </div>

      {/* When there is nothing to open, the empty icon sits INLINE with the
          title. It used to repeat "Not live yet" again at the foot of the
          card, which said the same four words twice in the space of three
          lines — one of them had to go, and the one carrying an icon is the
          one worth keeping. */}
      <p
        className={cn(
          "mt-4 font-display text-[1.0625rem] font-semibold tracking-[-0.02em]",
          available ? "text-ink" : "flex items-center gap-2 text-ink-soft",
        )}
      >
        {!available && (
          <EmptyIcon aria-hidden className="size-4 shrink-0 text-ink-muted" />
        )}
        {available ? title : emptyTitle}
      </p>
      <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-muted">
        {available ? body : emptyBody}
      </p>

      {/* Actions sit at the foot, so the two cards line up however long their
          copy runs. An empty card renders nothing here — no disabled button. A
          greyed-out control invites a click and then refuses, which reads as
          broken; saying plainly that there is nothing yet reads as a plan. */}
      <div className="mt-auto pt-5">
        {available && (
          <>
            {meta && (
              <p className="mb-2.5 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
                {meta}
              </p>
            )}

            {/* A real anchor, not a button with an onClick: middle-click,
                open-in-new-tab and copy-link-address all have to work on a URL
                a client will want to share with their own team.

                `rel="noopener noreferrer"` is mandatory with target="_blank" —
                without it the opened page gets a handle on this one through
                `window.opener`. */}
            <a
              href={href!}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[0.875rem] font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-deck-surface",
                primary
                  ? "bg-brand text-deck-void shadow-[0_10px_26px_-14px_rgb(186_252_12/0.9)] hover:brightness-[1.06]"
                  : "border border-hairline bg-white/[0.03] text-ink hover:border-hairline-strong hover:bg-white/[0.06]",
              )}
            >
              {action}
              {/* The label alone does not say the link leaves the app; the
                  arrow says it to sighted readers and the sr-only text says it
                  to everyone else. */}
              <ArrowUpRight
                aria-hidden
                className="size-4 transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px"
              />
              <span className="sr-only">{content.links.newTabLabel}</span>
            </a>

            {note && (
              <p className="mt-3 text-[0.75rem] leading-relaxed text-ink-muted">
                {note}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
