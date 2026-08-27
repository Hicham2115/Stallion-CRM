import { AreaWatermark } from "@/components/auth/area-watermark";
import { StallionLogo } from "@/components/brand/stallion-logo";
import { CornerTick } from "@/components/deck/corner-tick";
import { StatusDot } from "@/components/deck/status-dot";
import { TickRuler } from "@/components/deck/tick-ruler";
import { loginConfig } from "@/config/login";
const { brand, content, features } = loginConfig;
// Server Component — no state or interactivity, so none of this ships as
// client JS. Decorative layers are pinned below z-10 so they never cover
// copy: watermark, then area chart at z-0, then the mobile fade at z-[1],
// then header/headline/footer at z-10.
export function BrandPanel() {
  return (
    <aside className="deck-grid deck-glow deck-grain relative isolate flex flex-col justify-between overflow-hidden bg-deck-void px-7 pt-8 pb-6 sm:px-10 sm:pb-8 lg:px-14 lg:py-12">
      {/* Toggle with features.logoWatermark in config/login.ts. Two
          placements (not one) since the panel changes shape: tall column on
          desktop, short strip below lg. */}
      {features.logoWatermark && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 select-none"
        >
          <div className="deck-mark deck-mark-corner absolute -bottom-[12%] -left-[9%] hidden lg:block">
            <StallionLogo variant="mark" className="deck-float h-[76vh]" />
          </div>

          {/* Sized in rem, not vh — the strip is content-height, so a
              viewport unit would swing with the headline length. */}
          <div className="deck-mark deck-mark-edge absolute top-1/2 -right-[9%] block -translate-y-1/2 lg:hidden">
            <StallionLogo variant="mark" className="h-[19rem] sm:h-[23rem]" />
          </div>
        </div>
      )}

      {/* Below lg the two halves stack, so fade the panel bottom into the
          auth column rather than leaving a hard seam. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-16 bg-[linear-gradient(to_bottom,transparent,var(--deck-panel))] lg:hidden"
      />

      <CornerTick className="left-5 top-5 hidden lg:block" />
      <CornerTick className="bottom-5 right-5 hidden lg:block" />

      <header
        className="reveal relative z-10 flex items-center gap-4"
        style={{ "--reveal-delay": "60ms" }}
      >
        <StallionLogo variant="lockup" priority className="h-7 sm:h-8" />
        <span className="h-6 w-px bg-hairline-strong" aria-hidden />
        <span className="font-mono text-xs uppercase tracking-[0.24em] text-brand">
          {brand.productName}
        </span>
      </header>

      <div className="relative z-10 max-w-[38rem] pt-8 pb-0 sm:pb-6 lg:py-0">
        <p
          className="reveal mb-6 inline-flex items-center gap-2.5 rounded-full border border-brand/25 bg-brand/[0.07] px-3.5 py-1.5 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-brand shadow-[0_0_26px_-8px_rgb(186_252_12/0.45)] backdrop-blur-sm"
          style={{ "--reveal-delay": "160ms" }}
        >
          <StatusDot pulse />
          {content.eyebrow}
        </p>

        <h1
          className="reveal font-display text-[clamp(2.1rem,4.4vw,4rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-ink"
          style={{ "--reveal-delay": "240ms" }}
        >
          {content.headlineLead}{" "}
          <span className="relative inline-block whitespace-nowrap text-brand [text-shadow:0_0_44px_rgb(186_252_12/0.3)]">
            {content.headlineAccent}
            <svg
              viewBox="0 0 200 10"
              preserveAspectRatio="none"
              aria-hidden
              className="deck-underline absolute -bottom-1 left-0 h-[0.32em] w-full overflow-visible text-brand/55"
              style={{ "--reveal-delay": "620ms" }}
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
          style={{ "--reveal-delay": "340ms" }}
        >
          {content.subhead}
        </p>
      </div>

      {/* Bled past both sides so it reads as a horizon. Toggle with
          features.areaWatermark in config/login.ts. */}
      {features.areaWatermark && (
        <div className="pointer-events-none absolute -inset-x-[5%] bottom-0 z-0 hidden h-[36vh] lg:block">
          <AreaWatermark />
        </div>
      )}

      <footer
        className="reveal relative z-10 hidden lg:block"
        style={{ "--reveal-delay": "440ms" }}
      >
        <TickRuler className="mb-5" fade="78%" />
        <p className="flex items-center gap-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-muted">
          <StatusDot pulse />
          {content.statusLabel}
        </p>
      </footer>
    </aside>
  );
}
