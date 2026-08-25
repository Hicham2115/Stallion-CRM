import { Button } from "@/components/ui/button";

export function CtaButton({ children }: { children: React.ReactNode }) {
  return (
    <Button className="h-auto rounded-xl bg-gradient-to-r from-[#65891c] to-[#7a9e2a] px-11 py-[19px] text-[15px] font-extrabold tracking-wide text-white uppercase shadow-[0_0_30px_rgba(186,252,12,0.3),0_10px_30px_rgba(0,0,0,0.35)] hover:opacity-90">
      {children}
    </Button>
  );
}
