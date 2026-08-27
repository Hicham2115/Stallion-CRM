import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main
      data-surface="deck"
      className="deck-spot deck-vignette deck-grain relative flex min-h-dvh flex-1 items-center justify-center overflow-hidden bg-deck-panel px-6"
    >
      <div className="reveal-card deck-lift relative flex max-w-md flex-col items-center gap-5 rounded-2xl border border-hairline bg-deck-card/85 px-8 py-12 text-center backdrop-blur-xl">
        <div className="flex size-14 items-center justify-center rounded-full border border-hairline bg-white/[0.03] text-brand">
          <Compass aria-hidden className="size-6" />
        </div>

        <div>
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-brand">
            404
          </p>
          <h1 className="mt-3 font-display text-2xl font-semibold tracking-[-0.025em] text-ink">
            Page not found
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            The page you&apos;re looking for doesn&apos;t exist or may have
            moved.
          </p>
        </div>

        <Button asChild className="h-11 bg-[linear-gradient(100deg,var(--brand-green-mid),var(--brand-lime))] font-semibold text-[#0a1000] hover:opacity-90">
          <Link href="/login">Back to log in</Link>
        </Button>
      </div>
    </main>
  );
}
