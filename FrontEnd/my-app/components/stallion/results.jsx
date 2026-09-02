import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TestimonialVideo } from "@/components/stallion/testimonial-video";
const testimonials = [
  {
    name: "Yassine K.",
    result: "3x more booked calls in 60 days",
    quote:
      "We stopped losing leads overnight. Follow-up finally happens the same day.",
    video: "/testimonials/IMG_5529.mp4",
    poster: "/testimonials/IMG_5529.jpg",
  },
  {
    name: "Sara B.",
    result: "Doubled monthly qualified leads",
    quote: "The system caught gaps in our funnel we didn't even know existed.",
    video: "/testimonials/IMG_5541.mp4",
    poster: "/testimonials/IMG_5541.jpg",
  },
  {
    name: "Omar T.",
    result: "40% lower cost per lead",
    quote: "Fastest ROI of any agency we've worked with.",
    video: "/testimonials/IMG_5580.mp4",
    poster: "/testimonials/IMG_5580.jpg",
  },
  // TODO: placeholder copy — replace name/result/quote with the real client's before launch.
  {
    name: "Client Name",
    result: "Add this client's result here",
    quote: "Add this client's real quote here before launch.",
    video: "/testimonials/IMG_5610.2.mp4",
    poster: "/testimonials/IMG_5610.2.jpg",
  },
  // TODO: placeholder copy — replace name/result/quote with the real client's before launch.
  {
    name: "Client Name",
    result: "Add this client's result here",
    quote: "Add this client's real quote here before launch.",
    video: "/testimonials/IMG_5717.mp4",
    poster: "/testimonials/IMG_5717.jpg",
  },
];
export function Results() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 pt-10 pb-24 text-center">
      <h2 className="mb-4 font-heading text-[clamp(28px,4vw,44px)] font-bold text-white uppercase">
        Real Clients. <span className="text-[#bafc0c]">Real Growth.</span>
      </h2>
      <p className="mx-auto mb-14 max-w-[520px] text-base text-[#d1d5db]">
        Hear directly from the agencies and founders who fixed their funnel with
        Stallion.
      </p>

      <div className="flex flex-wrap justify-center gap-6 text-left">
        {testimonials.map((t) => (
          <div
            key={t.video}
            className="w-full overflow-hidden rounded-2xl border border-[#65891c]/35 bg-[#15181d] p-4 md:w-[calc(33.333%-1rem)]"
          >
            <TestimonialVideo src={t.video} poster={t.poster} />
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
