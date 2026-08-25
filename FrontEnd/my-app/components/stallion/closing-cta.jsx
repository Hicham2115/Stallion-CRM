import { CtaButton } from "@/components/stallion/cta-button";
import { StarRating } from "@/components/stallion/star-rating";
export function ClosingCta() {
    return (<section className="mx-auto max-w-[900px] px-6 pt-10 pb-24 text-center">
      <h2 className="mb-10 font-heading text-[clamp(30px,5vw,50px)] font-bold text-white uppercase">
        Ready to fix <span className="text-[#bafc0c]">yours?</span>
      </h2>
      <CtaButton>Book Your Free Strategy Call</CtaButton>

      <div className="mt-9 flex justify-center">
        <StarRating size={14}/>
      </div>
    </section>);
}
