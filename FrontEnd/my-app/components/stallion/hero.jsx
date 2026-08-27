import { Play, Volume2 } from "lucide-react";
import { CtaButton } from "@/components/stallion/cta-button";
const chapters = [
  { num: "01", title: "Why leads go cold" },
  { num: "02", title: "The real cost of slow follow-up" },
  { num: "03", title: "Agencies who fixed their funnel" },
  { num: "04", title: "How the Stallion system works" },
  { num: "05", title: "Your next step, book a call" },
];

export function Hero() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 pt-10 text-center">
      <h1 className="mx-auto mb-10 max-w-[820px] font-heading text-[clamp(32px,5.5vw,60px)] leading-[1.05] font-bold tracking-tight text-white uppercase">
        Stop Losing Leads to a{" "}
        <span className="text-[#bafc0c]">Bottleneck.</span>
      </h1>

      <div className="mx-auto max-w-full overflow-hidden rounded-2xl border border-[#65891c]/40 bg-[#15181d] shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        <div className="relative aspect-video w-full overflow-hidden bg-[radial-gradient(circle_at_30%_20%,#1f2530,#0f1215)]">
          <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full border border-white/15 bg-[#0f1215]/70 px-3.5 py-1.5 text-xs tracking-wide text-white uppercase backdrop-blur-sm">
            <Volume2 size={13} /> Tap for Sound
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-20 items-center justify-center rounded-full border border-[#bafc0c]/60 bg-[#0f1215]/60">
              <Play size={28} className="text-[#bafc0c]" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-11">
        <CtaButton>Book Your Free Strategy Call</CtaButton>
      </div>
    </section>
  );
}
