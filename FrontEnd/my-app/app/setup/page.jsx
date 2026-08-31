"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { BrandPanel } from "@/components/auth/brand-panel";
import { SetupForm } from "@/components/auth/setup-form";
import { api } from "@/lib/axios";

// Redirects to /login once setup is done — this page only exists for the
// brief window before a real admin account replaces the seeded one.
export default function SetupPage() {
  const router = useRouter();
  const { data, isPending } = useQuery({
    queryKey: ["setup-status"],
    queryFn: async () => (await api.get("/api/setup/status")).data,
  });

  useEffect(() => {
    if (data && !data.needs_setup) router.replace("/login");
  }, [data, router]);

  return (
    <main data-surface="deck" className="relative isolate flex-1">
      <div className="grid min-h-dvh grid-cols-1 grid-rows-[auto_1fr] lg:grid-cols-[1.08fr_0.92fr] lg:grid-rows-1">
        <BrandPanel />

        <section className="deck-spot deck-vignette deck-grain relative flex items-center justify-center overflow-hidden bg-deck-panel px-6 pt-7 pb-12 sm:px-10 sm:pt-10 lg:px-14 lg:py-12">
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 hidden w-px bg-[linear-gradient(to_bottom,transparent,var(--deck-hairline)_16%,rgb(186_252_12/0.32)_50%,var(--deck-hairline)_84%,transparent)] lg:block"
          />

          <div className="relative z-10 flex w-full justify-center lg:-translate-x-6">
            {isPending || !data ? (
              <LoaderCircle
                aria-hidden
                className="deck-spin size-6 text-ink-muted"
              />
            ) : data.needs_setup ? (
              <SetupForm />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
