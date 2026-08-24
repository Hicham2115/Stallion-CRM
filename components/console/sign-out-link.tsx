"use client";

import { LogOut } from "lucide-react";

import { navigation } from "@/config/navigation";
import { clearPreviewSession } from "@/lib/session";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 *  SIGN OUT
 * ============================================================================
 *  The control at the bottom of the sidebar and the mobile sheet.
 *
 *  IT USED TO BE A PLAIN <Link href="/login">, and with a role cookie in play
 *  that is a trap: signing out would leave the cookie behind, so the next
 *  sign-in would silently drop you back into whichever half of the app you had
 *  just left. Choosing "Client" on the login card after being an admin would
 *  land you on /admin. This clears the session first.
 *
 *  WHY A FULL PAGE LOAD AND NOT router.push(). Which half of the console you
 *  get is decided on the SERVER, from the cookie, in app/(console)/layout.tsx
 *  and the two guards under it. `router.refresh()` only invalidates the client
 *  cache for the route you are currently on, so a client-side navigation can
 *  legitimately serve a cached /admin payload that was rendered for the old
 *  cookie. A document navigation cannot: the browser asks the server again,
 *  with the new cookie, and there is no cache in between.
 *
 *  A sign-out is also exactly the moment a full reload is free — every bit of
 *  in-memory state SHOULD be dropped on the way out.
 *
 *  TODO(backend): call your provider (`signOut()`, DELETE /api/session) and let
 *  the server expire the httpOnly cookie. `clearPreviewSession()` goes away
 *  with the preview build — a real session cookie is not writable from here.
 * ============================================================================
 */
export function SignOutLink({
  /** Icon-only rail. The label stays as sr-only text for the accessible name. */
  collapsed = false,
  /** Called before navigating — the mobile sheet uses it to close itself. */
  onNavigate,
  className,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  function handleSignOut() {
    onNavigate?.();
    clearPreviewSession();
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
