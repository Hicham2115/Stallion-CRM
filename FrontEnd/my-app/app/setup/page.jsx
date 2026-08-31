import { BrandPanel } from "@/components/auth/brand-panel";
import { SetupForm } from "@/components/auth/setup-form";

// Always reachable, before login — see SetupController for why this is
// safe (only the very first submission ever wipes demo data).
export default function SetupPage() {
  return (
    <main data-surface="deck" className="relative isolate flex-1">
      <div className="grid min-h-dvh grid-cols-1 grid-rows-[auto_1fr] lg:grid-cols-[1.08fr_0.92fr] lg:grid-rows-1">
        <BrandPanel />

        <section className="deck-spot deck-vignette deck-grain relative flex items-center justify-center overflow-hidden bg-deck-panel px-6 pt-7 pb-12 sm:px-10 sm:pt-10 lg:px-14 lg:py-12">
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 hidden w-px bg-[linear-gradient(to_bottom,transparent,var(--deck-hairline)_16%,rgb(186_252_12/0.32)_50%,var(--deck-hairline)_84%,transparent)] lg:block"
          />

          <div className="relative z-10 flex w-full justify-center lg:-translate-x-6">
            <SetupForm />
          </div>
        </section>
      </div>
    </main>
  );
}
