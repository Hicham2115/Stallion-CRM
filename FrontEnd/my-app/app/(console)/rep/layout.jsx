"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, useSessionHydrated } from "@/components/console/session-provider";
import { homeForRole } from "@/config/roles";
// Route guard for /rep, one rep's own pipeline — the screens assume it
// throughout (first-person copy, no owner column). Same caveat as the other
// three guards: the role lives in localStorage, which anyone can edit, and
// the check is client-only now — hasHydrated holds the page on a blank frame
// instead of briefly showing /rep before correcting.
export default function RepLayout({ children }) {
  const router = useRouter();
  const hydrated = useSessionHydrated();
  const { role } = useSession();

  useEffect(() => {
    if (hydrated && role !== "sales") router.replace(homeForRole(role));
  }, [hydrated, role, router]);

  if (!hydrated || role !== "sales") return null;
  return children;
}
