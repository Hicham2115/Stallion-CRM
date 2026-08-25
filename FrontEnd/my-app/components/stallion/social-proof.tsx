import { StarRating } from "@/components/stallion/star-rating";

const trustLogos = ["NOVA", "APEXWORKS", "BRIGHTPATH", "VELIQ"];

export function SocialProof() {
  return (
    <section className="mx-auto max-w-[1180px] px-6 py-20 text-center">
      <div className="mb-14 flex justify-center">
        <StarRating />
      </div>

      <p className="mb-7 text-xs tracking-[3px] text-[#9ca3af] uppercase">
        Trusted by brands like
      </p>
      <div className="flex flex-wrap items-center justify-center gap-12 opacity-55">
        {trustLogos.map((name) => (
          <span
            key={name}
            className="font-heading text-xl font-bold tracking-wide text-white"
          >
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}
