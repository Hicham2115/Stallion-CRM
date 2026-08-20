"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { LogOut, PanelLeft } from "lucide-react";

import { StallionLogo } from "@/components/brand/stallion-logo";
import { ConsoleNav } from "@/components/console/console-nav";
import { SidebarStat } from "@/components/console/sidebar-stat";
import { brandConfig } from "@/config/brand";
import { consoleConfig } from "@/config/console";
import { navigation, type Role } from "@/config/navigation";
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
 */
export function ConsoleSidebar({
  role,
  defaultCollapsed = false,
}: {
  role: Role;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    // Written straight to the cookie rather than through a server action: it is
    // a display preference, so a round trip would add latency to a toggle that
    // should feel instant. One year, and scoped to the whole app.
    document.cookie = `${layout.sidebarCookie}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
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
      className="deck-grid deck-scroll relative hidden shrink-0 flex-col overflow-y-auto border-r border-hairline bg-deck-rail transition-[width] duration-300 ease-out lg:flex"
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
          href={navigation.roleHome[role] ?? "/admin"}
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
      <div className={cn("relative z-10 flex-1 px-3 pt-2", collapsed && "px-2")}>
        <ConsoleNav role={role} collapsed={collapsed} />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Footer: stat readout, collapse toggle, sign out                   */}
      {/* ---------------------------------------------------------------- */}
      <div className={cn("relative z-10 mt-auto flex flex-col gap-2 p-3", collapsed && "p-2")}>
        {features.sidebarStat && !collapsed && <SidebarStat />}

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

        <Link
          href={navigation.signOut.href}
          className={cn(
            "flex h-11 items-center gap-3 rounded-xl px-3 text-[0.9375rem] text-ink-soft transition-colors hover:bg-white/[0.045] hover:text-ink",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-deck-rail",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut aria-hidden className="size-[1.15rem] shrink-0 text-ink-muted" />
          <span className={cn(collapsed && "sr-only")}>
            {navigation.signOut.label}
          </span>
        </Link>
      </div>
    </aside>
  );
}
