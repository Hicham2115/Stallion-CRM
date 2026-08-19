import { AreaWatermark } from "@/components/auth/area-watermark";
import { StallionLogo } from "@/components/brand/stallion-logo";
import { loginConfig } from "@/config/login";

const { brand, content, features } = loginConfig;

/**
 * A crosshair registration mark, like the corner ticks on a print plate.
 * Purely decorative — it gives the panel its "instrument housing" feel.
 */
function CornerTick({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden
      className={`absolute size-3.5 text-ink-faint ${className ?? ""}`}
    >
      <path
        d="M10 0v20M0 10h20"
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * The left-hand "deck": the brand half of the split screen.
 *
 * It is a Server Component — no state, no interactivity, so none of this ships
 * as client JavaScript. The atmosphere (blueprint grid, lime bloom, film grain)
 * comes from the .deck-* utility classes in app/globals.css; every layer is
 * tunable from the --deck-* knobs in the same file.
 *
 * Stacking order, back to front. Everything decorative is pinned below z-10 so
 * it can never cover copy:
 *    background   bg-deck-void plus the lime bloom from .deck-glow
 *    ::before     blueprint grid
 *    z-auto       horse mark watermark
 *    z-0          area chart horizon
 *    z-[1]        the mobile fade into the auth column, over both of those
 *    ::after      film grain, over the lot
 *    z-10         header, headline, footer
 */
export function BrandPanel() {
  return (
    <aside className="deck-grid deck-glow deck-grain relative isolate flex flex-col justify-between overflow-hidden bg-deck-void px-7 pt-8 pb-6 sm:px-10 sm:pb-8 lg:px-14 lg:py-12">
      {/* ---------------------------------------------------------------- */}
      {/* Horse mark watermark                                              */}
      {/* ---------------------------------------------------------------- */}
      {/* Toggle the whole thing — both placements — with features.logoWatermark
          in config/login.ts. Weight is --deck-mark-opacity in globals.css.

          Two placements rather than one, because the panel changes shape: a
          tall column on desktop, a short wide strip below lg. Both are masked
          so the mark dissolves into the surface instead of ending on a hard
          edge, which is the difference between a watermark and a pasted PNG. */}
      {features.logoWatermark && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 select-none"
        >
          {/* Desktop: oversized, bleeding off the bottom-left corner so the
              composition breaks its own frame. It drifts slowly through a
              stationary mask, so the fade never travels with it. */}
          <div className="deck-mark deck-mark-corner absolute -bottom-[12%] -left-[9%] hidden lg:block">
            <StallionLogo variant="mark" className="deck-float h-[76vh]" />
          </div>

          {/* Mobile and tablet: smaller, off the right edge, clear of the
              headline. Sized in rem rather than vh, because the strip is
              content-height — a viewport unit here would swing wildly with
              the length of the headline. */}
          <div className="deck-mark deck-mark-edge absolute top-1/2 -right-[9%] block -translate-y-1/2 lg:hidden">
            <StallionLogo variant="mark" className="h-[19rem] sm:h-[23rem]" />
          </div>
        </div>
      )}

      {/* Below lg the two halves stack, so the panel bottom would otherwise
          land as a hard horizontal seam. Fade it into the auth column. Sits
          above the watermark so the mark fades out with everything else. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-16 bg-[linear-gradient(to_bottom,transparent,var(--deck-panel))] lg:hidden"
      />

      {/* Registration marks at the panel corners. */}
      <CornerTick className="left-5 top-5 hidden lg:block" />
      <CornerTick className="bottom-5 right-5 hidden lg:block" />

      {/* ---------------------------------------------------------------- */}
      {/* Header: logo lockup + product name                               */}
      {/* ---------------------------------------------------------------- */}
      <header
        className="reveal relative z-10 flex items-center gap-4"
        style={{ "--reveal-delay": "60ms" } as React.CSSProperties}
      >
        <StallionLogo variant="lockup" priority className="h-7 sm:h-8" />
        <span className="h-6 w-px bg-hairline-strong" aria-hidden />
        <span className="font-mono text-xs uppercase tracking-[0.24em] text-brand">
          {brand.productName}
        </span>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Headline block                                                    */}
      {/* ---------------------------------------------------------------- */}
      <div className="relative z-10 max-w-[38rem] pt-8 pb-0 sm:pb-6 lg:py-0">
        <p
          className="reveal mb-6 inline-flex items-center gap-2.5 rounded-full border border-brand/25 bg-brand/[0.07] px-3.5 py-1.5 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-brand shadow-[0_0_26px_-8px_rgb(186_252_12/0.45)] backdrop-blur-sm"
          style={{ "--reveal-delay": "160ms" } as React.CSSProperties}
        >
          <span className="deck-dot size-1.5 rounded-full bg-brand" aria-hidden />
          {content.eyebrow}
        </p>

        <h1
          className="reveal font-display text-[clamp(2.1rem,4.4vw,4rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-ink"
          style={{ "--reveal-delay": "240ms" } as React.CSSProperties}
        >
          {content.headlineLead}{" "}
          {/* The accent gets a wide, very soft lime halo. At this radius it
              never reads as a glow effect — it just keeps the lime from
              looking flat against near-black. */}
          <span className="relative inline-block whitespace-nowrap text-brand [text-shadow:0_0_44px_rgb(186_252_12/0.3)]">
            {content.headlineAccent}
            {/* Hand-drawn rule that draws itself in once the headline lands. */}
            <svg
              viewBox="0 0 200 10"
              preserveAspectRatio="none"
              aria-hidden
              className="deck-underline absolute -bottom-1 left-0 h-[0.32em] w-full overflow-visible text-brand/55"
              style={{ "--reveal-delay": "620ms" } as React.CSSProperties}
            >
              <path
                d="M1 7.2C38 2.6 96 1.8 199 4.4"
                pathLength={1}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </span>
        </h1>

        <p
          className="reveal mt-7 hidden max-w-md text-[0.9375rem] leading-relaxed text-ink-soft sm:block lg:text-base"
          style={{ "--reveal-delay": "340ms" } as React.CSSProperties}
        >
          {content.subhead}
        </p>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Area horizon                                                      */}
      {/* ---------------------------------------------------------------- */}
      {/* An area chart is a wide, shallow shape, so it wants the full width of
          the panel rather than a corner. Anchored to the bottom edge and bled
          past both sides, it reads as a horizon the rest of the panel sits on
          — and the horse mark, being taller and painted before it, appears to
          stand behind it.

          Sits at z-0 against the copy at z-10, so it can never cover text.
          Toggle with features.areaWatermark in config/login.ts. */}
      {features.areaWatermark && (
        <div className="pointer-events-none absolute -inset-x-[5%] bottom-0 z-0 hidden h-[36vh] lg:block">
          <AreaWatermark />
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Footer: status readout                                            */}
      {/* ---------------------------------------------------------------- */}
      <footer
        className="reveal relative z-10 hidden lg:block"
        style={{ "--reveal-delay": "440ms" } as React.CSSProperties}
      >
        {/* Tick ruler — a hairline with measurement marks along it. */}
        <div
          aria-hidden
          className="mb-5 h-2.5 w-full border-t border-hairline bg-[repeating-linear-gradient(to_right,var(--ink-faint)_0_1px,transparent_1px_28px)] opacity-40 [mask-image:linear-gradient(to_right,#000,transparent_78%)]"
        />
        <p className="flex items-center gap-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-muted">
          <span className="deck-dot size-1.5 rounded-full bg-brand" aria-hidden />
          {content.statusLabel}
        </p>
      </footer>
    </aside>
  );
}
