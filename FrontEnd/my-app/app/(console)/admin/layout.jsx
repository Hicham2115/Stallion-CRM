"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, useSessionHydrated } from "@/components/console/session-provider";
import { homeForRole } from "@/config/roles";
// Route guard for /admin, the agency lead's surface (whole pipeline, every
// lead, rep performance, reports, settings). A layout rather than a per-page
// check so it also covers every future route added to this folder.
// Redirects rather than 404s since the person is signed in and the page
// exists — it's just not theirs.
//
// Not real security: the role lives in localStorage, which anyone can edit.
// It's also client-only now, so it can't redirect before paint the way a
// server check could — hasHydrated gates the check so a visitor is held on
// a blank frame rather than briefly shown /admin before being corrected.
export default function AdminLayout({ children }) {
  const router = useRouter();
  const hydrated = useSessionHydrated();
  const { role } = useSession();

  useEffect(() => {
    // Allow-list, not a deny-list, so a new role is locked out by default
    // rather than silently let in.
    if (hydrated && role !== "admin") router.replace(homeForRole(role));
  }, [hydrated, role, router]);

  if (!hydrated || role !== "admin") return null;
  return children;
}
