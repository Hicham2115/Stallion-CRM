"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, useSessionHydrated } from "@/components/console/session-provider";
import { homeForRole } from "@/config/roles";
// Route guard for /dev — delivery work across every client, so only the "dev"
// role gets past this. A client here would see other clients' projects (a
// real data leak, unlike the other guards); an admin would see it through a
// session not meant for ticking delivery steps.
// Not real security: the role lives in localStorage, which anyone can edit,
// and the check is client-only now — hasHydrated holds the page on a blank
// frame instead of briefly showing /dev before correcting. See config/roles.ts
// for the allow-list and lib/store/session-store.ts for where the role lives.
export default function DevLayout({ children }) {
  const router = useRouter();
  const hydrated = useSessionHydrated();
  const { role } = useSession();

  useEffect(() => {
    if (hydrated && role !== "dev") router.replace(homeForRole(role));
  }, [hydrated, role, router]);

  if (!hydrated || role !== "dev") return null;
  return children;
}
