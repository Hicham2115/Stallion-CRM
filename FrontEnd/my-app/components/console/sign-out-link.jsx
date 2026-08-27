"use client";
import { LogOut } from "lucide-react";
import { navigation } from "@/config/navigation";
import { api } from "@/lib/axios";
import { useSessionStore } from "@/lib/store/session-store";
import { cn } from "@/lib/utils";
// Clears the session before navigating, not a plain <Link href="/login"> —
// otherwise the old role in localStorage would silently land the next
// sign-in back in the half of the app just left.
export function SignOutLink({
  /** Icon-only rail. The label stays as sr-only text for the accessible name. */
  collapsed = false,
  /** Called before navigating — the mobile sheet uses it to close itself. */
  onNavigate,
  className,
}) {
  async function handleSignOut() {
    onNavigate?.();
    // Revoke on the server first (so the token can't be replayed), then
    // forget it locally regardless of whether that call succeeds.
    await api.post("/api/logout").catch(() => {});
    useSessionStore.getState().clearSession();
    window.location.assign(navigation.signOut.href);
  }
  return (
    <button
      type="button"
      onClick={handleSignOut}
      className={cn(
        "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[0.9375rem] text-ink-soft transition-colors hover:bg-white/[0.045] hover:text-ink",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-deck-rail",
        collapsed && "justify-center px-0",
        className,
      )}
    >
      <LogOut aria-hidden className="size-[1.15rem] shrink-0 text-ink-muted" />
      <span className={cn(collapsed && "sr-only")}>
        {navigation.signOut.label}
      </span>
    </button>
  );
}
