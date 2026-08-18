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
 * comes from the .deck-* utility classes in app/globals.css; all four layers
 * are tunable from the --deck-* variables at the top of that file.
 */
export function BrandPanel() {
  return (
    <aside className="deck-grid deck-glow deck-grain relative isolate flex flex-col justify-between overflow-hidden bg-deck-void px-7 pt-8 pb-6 sm:px-10 sm:pb-8 lg:px-14 lg:py-12">
      {/* Oversized horse mark, bleeding off the bottom-left corner so the
          composition breaks its own frame. Desktop only — on mobile the panel
          is too short for it to read as anything but noise. */}
      {/* Toggle with features.logoWatermark in config/login.ts. */}
      {features.logoWatermark && (
        <div className="pointer-events-none absolute -bottom-[12%] -left-[9%] hidden select-none lg:block">
          <StallionLogo
            variant="mark"
            className="deck-float h-[76vh] opacity-[0.055]"
          />
        </div>
      )}


      {/* Below lg the two halves stack, so the panel bottom would otherwise
          land as a hard horizontal seam. Fade it into the auth column. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-[linear-gradient(to_bottom,transparent,var(--deck-panel))] lg:hidden"
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
          className="reveal mb-6 inline-flex items-center gap-2.5 rounded-full border border-brand/25 bg-brand/[0.07] px-3.5 py-1.5 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-brand"
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
          <span className="relative inline-block whitespace-nowrap text-brand">
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
          — and the horse mark, being taller, appears to stand behind it.

          Sits at z-0 against the copy's z-10, so it can never cover text.
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
