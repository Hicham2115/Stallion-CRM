import { CtaButton } from "@/components/stallion/cta-button";
import { VideoPlaceholder } from "@/components/stallion/video-placeholder";
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

      <div className="mx-auto grid max-w-[1040px] grid-cols-1 gap-8 rounded-2xl border border-[#65891c]/40 bg-[#15181d] p-5 text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)] md:grid-cols-[1.15fr_1fr]">
        <VideoPlaceholder variant="hero" />

        <div className="flex flex-col justify-center py-2">
          <p className="mb-4.5 font-heading text-lg font-semibold text-[#ace044]">
            What&apos;s really costing you clients
          </p>
          {chapters.map((chap) => (
            <div
              key={chap.num}
              className="flex items-baseline gap-4 border-b border-white/10 py-3"
            >
              <span className="min-w-7 font-heading text-lg font-bold text-[#bafc0c]">
                {chap.num}
              </span>
              <span className="text-[15px] text-[#f0f0f0]">{chap.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-11">
        <CtaButton>Book Your Free Strategy Call</CtaButton>
      </div>
    </section>
  );
}
