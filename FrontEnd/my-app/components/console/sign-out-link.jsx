"use client";
import { LogOut } from "lucide-react";
import { navigation } from "@/config/navigation";
import { endSession } from "@/lib/session";
import { cn } from "@/lib/utils";
// Clears the session cookie before navigating, not a plain <Link href="/login">
// — otherwise the old role cookie would silently land the next sign-in back
// in the half of the app just left. Uses a full document navigation, not
// router.push(), since which half of the console renders is decided
// server-side from the cookie, and a client-side nav can serve a cached
// payload rendered for the old cookie.
//
export function SignOutLink({
/** Icon-only rail. The label stays as sr-only text for the accessible name. */
collapsed = false,
/** Called before navigating — the mobile sheet uses it to close itself. */
onNavigate, className, }) {
    async function handleSignOut() {
        onNavigate?.();
        await endSession();
        window.location.assign(navigation.signOut.href);
    }
    return (<button type="button" onClick={handleSignOut} className={cn("flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[0.9375rem] text-ink-soft transition-colors hover:bg-white/[0.045] hover:text-ink", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-deck-rail", collapsed && "justify-center px-0", className)}>
      <LogOut aria-hidden className="size-[1.15rem] shrink-0 text-ink-muted"/>
      <span className={cn(collapsed && "sr-only")}>
        {navigation.signOut.label}
      </span>
    </button>);
}
