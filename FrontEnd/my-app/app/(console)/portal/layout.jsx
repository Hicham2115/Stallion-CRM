"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, useSessionHydrated } from "@/components/console/session-provider";
import { homeForRole } from "@/config/roles";
// Route guard for /portal — only the "client" role gets past this; everyone
// else is redirected home. Guarded both directions (not just non-clients out)
// because an admin session left in here would resolve session.clientLeadId to
// the demo client and render a stranger's project convincingly under its own
// name — an intentional "view as client" feature is the right way to do that.
// Not real security: the role lives in localStorage, which anyone can edit,
// and the check is client-only now — hasHydrated holds the page on a blank
// frame instead of briefly showing /portal before correcting.
export default function PortalLayout({ children }) {
  const router = useRouter();
  const hydrated = useSessionHydrated();
  const { role } = useSession();

  useEffect(() => {
    if (hydrated && role !== "client") router.replace(homeForRole(role));
  }, [hydrated, role, router]);

  if (!hydrated || role !== "client") return null;
  // The shell one level up supplies the rail and topbar.
  return children;
}
