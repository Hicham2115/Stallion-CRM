import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlaceholder } from "@/components/stallion/video-placeholder";

const testimonials = [
  {
    name: "Yassine K.",
    result: "3x more booked calls in 60 days",
    quote:
      "We stopped losing leads overnight. Follow-up finally happens the same day.",
  },
  {
    name: "Sara B.",
    result: "Doubled monthly qualified leads",
    quote: "The system caught gaps in our funnel we didn't even know existed.",
  },
  {
    name: "Omar T.",
    result: "40% lower cost per lead",
    quote: "Fastest ROI of any agency we've worked with.",
  },
];

export function Results() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 pt-10 pb-24 text-center">
      <h2 className="mb-4 font-heading text-[clamp(28px,4vw,44px)] font-bold text-white uppercase">
        Real Clients. <span className="text-[#bafc0c]">Real Growth.</span>
      </h2>
      <p className="mx-auto mb-14 max-w-[520px] text-base text-[#d1d5db]">
        Hear directly from the agencies and founders who fixed their funnel
        with Stallion.
      </p>

      <div className="grid grid-cols-1 gap-6 text-left md:grid-cols-3">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="flex flex-col gap-4 rounded-2xl border border-[#65891c]/35 bg-[#15181d] p-4"
          >
            <VideoPlaceholder variant="testimonial" />
            <div>
              <p className="mb-1.5 text-sm font-bold text-[#bafc0c]">{t.name}</p>
              <p className="mb-2 text-[15px] font-bold text-white">{t.result}</p>
              <p className="text-sm text-[#d1d5db]">&ldquo;{t.quote}&rdquo;</p>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        className="mt-12 h-auto rounded-full border-[#bafc0c]/50 bg-transparent px-7 py-3.5 text-sm font-semibold text-[#bafc0c] hover:bg-[#bafc0c]/10 hover:text-[#bafc0c]"
      >
        Show More Stories <ChevronDown size={15} />
      </Button>
    </section>
  );
}
