import { AmbientBackground } from "@/components/stallion/ambient-background";
import { SiteHeader } from "@/components/stallion/site-header";
import { Hero } from "@/components/stallion/hero";
import { SocialProof } from "@/components/stallion/social-proof";
import { Results } from "@/components/stallion/results";
import { ClosingCta } from "@/components/stallion/closing-cta";
import { SiteFooter } from "@/components/stallion/site-footer";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0a0c0e] bg-gradient-to-br from-[#0a0c0e] via-[#131519] to-[#0a0c0e] font-sans text-[#d1d5db]">
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
