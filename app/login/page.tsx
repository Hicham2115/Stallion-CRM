import type { Metadata } from "next";

import { BrandPanel } from "@/components/auth/brand-panel";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log in",
  description:
    "Sign in to Stallion CRM to track dials, appointments and conversions across your team.",
};

/**
 * /login — the "Command Deck" auth screen.
 *
 * Layout is a two-column grid that collapses to a single column below `lg`:
 *   - left  : BrandPanel  (Server Component, zero client JS)
 *   - right : LoginForm   (Client Component, owns the form state)
 *
 * On large screens the card is nudged 1.5rem toward the seam so it reads as
 * leaning into the brand half rather than sitting dead-centre in its own
 * column. It is a small offset on purpose: enough to break the symmetry,
 * not enough to look like a mistake.
 */
export default function LoginPage() {
  return (
    <main data-surface="deck" className="relative isolate flex-1">
      <div className="grid min-h-dvh grid-cols-1 grid-rows-[auto_1fr] lg:grid-cols-[1.08fr_0.92fr] lg:grid-rows-1">
        <BrandPanel />

        <section className="deck-grain relative flex items-center justify-center overflow-hidden bg-deck-panel px-6 pt-7 pb-12 sm:px-10 sm:pt-10 lg:px-14 lg:py-12">
          {/* The seam: a hairline that warms to lime at eye level. */}
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 hidden w-px bg-[linear-gradient(to_bottom,transparent,var(--deck-hairline)_16%,rgb(186_252_12/0.32)_50%,var(--deck-hairline)_84%,transparent)] lg:block"
          />

          <div className="relative z-10 flex w-full justify-center lg:-translate-x-6">
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
