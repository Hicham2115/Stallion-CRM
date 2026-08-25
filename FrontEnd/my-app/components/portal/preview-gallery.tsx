import { ArrowUpRight, ImageOff, MonitorPlay } from "lucide-react";

import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { portalConfig } from "@/config/portal";
import { formatDaysAgo, template } from "@/lib/format";
import type { ProjectPreview } from "@/lib/types";

const { content } = portalConfig;

/**
 * ============================================================================
 *  PREVIEW GALLERY
 * ============================================================================
 *  Everything the agency has shared for review, newest first. This is the
 *  prototype's "Previews" panel, given a screen of its own so the tiles have
 *  room to be looked at instead of being one row on a crowded overview.
 *
 *  THE PLACEHOLDER IS DESIGNED, NOT MISSING. Most previews have no screenshot —
 *  the agency shares a link long before anyone gets round to grabbing an image —
 *  so "no screenshot" is the COMMON case, not the error case. The prototype
 *  rendered a bare grey rectangle for it, which reads as an image that failed
 *  to load. This draws the deck's own blueprint grid with a caption saying what
 *  is going on, so an empty tile looks deliberate.
 *
 *  TODO(backend): when `imageUrl` starts carrying real URLs, swap the <img> for
 *  next/image and add the preview host to `images.remotePatterns` in
 *  next.config.ts. Keep the placeholder branch — it stays the common case.
 * ============================================================================
 */
export function PreviewGallery({ previews }: { previews: ProjectPreview[] }) {
  return (
    <Panel>
      <PanelHeader title={content.previews.title} hint={content.previews.hint} />

      <PanelBody>
        {previews.length === 0 ? (
          <EmptyState
            icon={MonitorPlay}
            title={content.previews.emptyTitle}
            description={content.previews.emptyDescription}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {previews.map((preview) => (
              <li
                key={preview.id}
                className="flex flex-col overflow-hidden rounded-xl border border-hairline bg-white/[0.02]"
              >
                <PreviewTile preview={preview} />

                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <p className="text-[0.9375rem] font-medium text-ink">
                    {preview.label}
                  </p>

                  {preview.note && (
                    <p className="text-[0.8125rem] leading-relaxed text-ink-muted">
                      {preview.note}
                    </p>
                  )}

                  <p className="deck-nums mt-1 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
                    {template(content.links.previewUpdated, {
                      when: formatDaysAgo(preview.updatedDaysAgo).toLowerCase(),
                    })}
                  </p>

                  {preview.url && (
                    <a
                      href={preview.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group mt-auto inline-flex w-fit items-center gap-1.5 pt-3 text-[0.875rem] font-medium text-ink-soft transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
                    >
                      {content.previews.openLabel}
                      <ArrowUpRight
                        aria-hidden
                        className="size-3.5 transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px"
                      />
                      {/* Names WHICH preview, so a screen reader hearing five
                          "Open" links in a row can tell them apart. */}
                      <span className="sr-only">
                        {preview.label} — {content.links.newTabLabel}
                      </span>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* NO PRIVACY NOTE HERE. `ProjectLinks` states it, and that panel sits
            directly above this one on the only screen the gallery appears on —
            printing the same warning twice in one viewport makes a reader
            check whether the second one says something different. If you ever
            render this gallery on its own, carry the note across. */}
      </PanelBody>
    </Panel>
  );
}

/** The 16:9 image area at the top of a card. */
function PreviewTile({ preview }: { preview: ProjectPreview }) {
  if (preview.imageUrl) {
    return (
      /* A plain <img>, not next/image: the optimiser has to be told which
         hosts it may fetch from (`images.remotePatterns` in next.config.ts)
         and the preview host is not known until the backend exists. Declaring
         a placeholder host would either block the real one later or, worse,
         quietly allow any. See the TODO at the top of this file. */
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={preview.imageUrl}
        alt={preview.label}
        className="aspect-video w-full border-b border-hairline object-cover"
      />
    );
  }

  return (
    <div className="deck-grid relative grid aspect-video w-full place-items-center border-b border-hairline bg-deck-void/40">
      <div className="relative z-10 flex flex-col items-center gap-2">
        <ImageOff aria-hidden className="size-5 text-ink-faint" />
        {/* Ink Muted, not Ink Faint — the icon above may decorate, but this is
            a sentence someone has to read. See THE MUTED FLOOR RULE. */}
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
          {content.previews.noScreenshot}
        </p>
      </div>
    </div>
  );
}
