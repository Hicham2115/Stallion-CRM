"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { PanelLeft } from "lucide-react";

import { StallionLogo } from "@/components/brand/stallion-logo";
import { ConsoleNav } from "@/components/console/console-nav";
import { SidebarStat } from "@/components/console/sidebar-stat";
import { SignOutLink } from "@/components/console/sign-out-link";
import { brandConfig } from "@/config/brand";
import { consoleConfig } from "@/config/console";
import { type Role } from "@/config/navigation";
import { roleDefinitions } from "@/config/roles";
import { homeFor } from "@/lib/session";
import { cn } from "@/lib/utils";

const { features, layout, content } = consoleConfig;

/**
 * The desktop navigation rail.
 *
 * Hidden below `lg`, where MobileNav takes over — an icon rail on a phone eats
 * a fifth of the screen to show six icons.
 *
 * COLLAPSE STATE lives in a cookie, read on the server and handed down as
 * `defaultCollapsed`. Keeping it in `useState` alone would reset on every
 * navigation; restoring it in a `useEffect` would render expanded and then snap
 * closed on every single page load, which is worse than not persisting it.
 *
 * The rail is one of the two places the blueprint grid survives into the
 * console. Texture belongs on chrome, never behind data.
 *
 * ── IT IS EXACTLY ONE VIEWPORT TALL, AND IT DOES NOT SCROLL ────────────────
 * `sticky top-0 h-dvh self-start`. It used to be a plain flex child of a
 * `min-h-dvh` shell, which stretched it to the height of the PAGE — so on a
 * long screen the Log Out control sat below the fold and you had to scroll the
 * content just to sign out. Worse, it moved: the footer's position depended on
 * how much content the page happened to have.
 *
 * `self-start` is the load-bearing half. Without it the flex container's
 * default `align-items: stretch` forces the rail to full container height and
 * `h-dvh` has nothing to do, so sticky never engages.
 *
 * The rail itself is `overflow-hidden` and only the NAV REGION scrolls. That
 * keeps the logo pinned at the top and the stat, collapse toggle and Log Out
 * pinned at the bottom, whatever the window height — which is the whole point.
 */
export function ConsoleSidebar({
  role,
  defaultCollapsed = false,
}: {
  role: Role;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  /**
   * The stat card is a SALES figure — the team's dial average for an admin,
   * the rep's own dials today for a rep (SidebarStat picks which).
   *
   * AN ALLOW-LIST, for the same reason the route guards are. It first read
   * `role !== "client"`, which was correct with three roles and quietly wrong
   * the moment a fourth arrived: the dev team started seeing the sales team's
   * dial average in their sidebar. It is not secret from them, but it is not
   * theirs and it is not useful to them — a delivery screen carrying a sales
   * KPI is just noise that has to be learned and then ignored.
   *
   * Naming who it IS for means a new role gets nothing by default and has to
   * be added deliberately.
   */
  // Declared once, in config/roles.ts, next to that role's purpose and
  // permissions. `SidebarStat` reads the same field to decide WHICH figure.
  const showStat =
    features.sidebarStat && roleDefinitions[role].sidebarStat !== "none";

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    // Written straight to the cookie rather than through a server action: it is
    // a display preference, so a round trip would add latency to a toggle that
    // should feel instant. Lifetime and name both come from config.
    const maxAge = layout.sidebarCookieDays * 24 * 60 * 60;
    document.cookie = `${layout.sidebarCookie}=${next ? "1" : "0"}; path=/; max-age=${maxAge}; samesite=lax`;
  }

  return (
    <aside
      // Navigation cannot be used on paper, and it would eat a sixth of the
      // width of every printed report. See the PRINT block in app/globals.css.
      data-print="hide"
      data-collapsed={collapsed || undefined}
      style={
        {
          width: collapsed
            ? layout.sidebarCollapsedWidth
            : layout.sidebarWidth,
        } as CSSProperties
      }
      className="deck-grid sticky top-0 relative hidden h-dvh shrink-0 flex-col self-start overflow-hidden border-r border-hairline bg-deck-rail transition-[width] duration-300 ease-out lg:flex"
    >
      {/* ---------------------------------------------------------------- */}
      {/* Header: logo lockup + product name                                */}
      {/* ---------------------------------------------------------------- */}
      <div
        className={cn(
          "relative z-10 flex h-[4.5rem] shrink-0 items-center gap-3 px-5",
          collapsed && "justify-center px-0",
        )}
      >
        <Link
          href={homeFor(role)}
          className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
        >
          <StallionLogo
            variant={collapsed ? "mark" : "lockup"}
            priority
            className="h-6"
          />
          {!collapsed && (
            <span className="font-mono text-xs uppercase tracking-[0.24em] text-brand">
              {brandConfig.productName}
            </span>
          )}
        </Link>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Navigation                                                        */}
      {/* ---------------------------------------------------------------- */}
      {/* The only scrolling region. `min-h-0` is required: a flex child
          defaults to `min-height: auto`, which refuses to shrink below its
          content and would push the footer off the bottom instead of
          scrolling. */}
      <div
        className={cn(
          "deck-scroll relative z-10 min-h-0 flex-1 overflow-y-auto px-3 pt-2",
          collapsed && "px-2",
        )}
      >
        <ConsoleNav role={role} collapsed={collapsed} />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Footer: stat readout, collapse toggle, sign out                   */}
      {/* ---------------------------------------------------------------- */}
      {/* Pinned to the bottom of the VIEWPORT, not of the page. `shrink-0` so a
          short window scrolls the nav above rather than crushing these. */}
      <div
        className={cn(
          "relative z-10 flex shrink-0 flex-col gap-2 p-3",
          collapsed && "p-2",
        )}
      >
        {showStat && !collapsed && <SidebarStat />}

        {features.collapsibleSidebar && (
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? content.expandSidebar : content.collapseSidebar}
            aria-expanded={!collapsed}
            className={cn(
              "flex h-10 items-center gap-3 rounded-xl px-3 text-[0.8125rem] text-ink-muted transition-colors hover:bg-white/[0.045] hover:text-ink-soft",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-deck-rail",
              collapsed && "justify-center px-0",
            )}
          >
            <PanelLeft
              aria-hidden
              className={cn(
                "size-[1.15rem] shrink-0 transition-transform duration-300",
                collapsed && "rotate-180",
              )}
            />
            {!collapsed && <span>{content.collapseSidebar}</span>}
          </button>
        )}

        {/* Clears the session cookie before leaving — see the note in
            components/console/sign-out-link.tsx for why that matters the
            moment there are two roles. */}
        <SignOutLink collapsed={collapsed} />
      </div>
    </aside>
  );
}
