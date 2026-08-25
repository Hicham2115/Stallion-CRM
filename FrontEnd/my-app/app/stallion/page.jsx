import { AmbientBackground } from "@/components/stallion/ambient-background";
import { SiteHeader } from "@/components/stallion/site-header";
import { Hero } from "@/components/stallion/hero";
import { SocialProof } from "@/components/stallion/social-proof";
import { Results } from "@/components/stallion/results";
import { ClosingCta } from "@/components/stallion/closing-cta";
import { SiteFooter } from "@/components/stallion/site-footer";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0f1215] bg-gradient-to-br from-[#0f1215] via-[#1a1d23] to-[#0f1215] font-sans text-[#d1d5db]">
      <AmbientBackground />

      <div className="relative z-10">
        <SiteHeader />
        <Hero />
        <SocialProof />
        <Results />
        <ClosingCta />
        <SiteFooter />
      </div>
    </div>
  );
}
