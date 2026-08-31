"use client";
import Link from "next/link";
import { useState } from "react";
import { PanelLeft } from "lucide-react";
import { StallionLogo } from "@/components/brand/stallion-logo";
import { ConsoleNav } from "@/components/console/console-nav";
import { SidebarStat } from "@/components/console/sidebar-stat";
import { SignOutLink } from "@/components/console/sign-out-link";
import { brandConfig } from "@/config/brand";
import { consoleConfig } from "@/config/console";
import { homeForRole, roleDefinitions } from "@/config/roles";
import { useSession } from "@/components/console/session-provider";
import { cn } from "@/lib/utils";
const { features, layout, content } = consoleConfig;
// Hidden below `lg`, where MobileNav takes over. Collapse state lives in a
// cookie (read server-side, handed down as `defaultCollapsed`) rather than
// useState alone, which would reset on navigation, or a useEffect, which
// would render expanded then snap closed on every load.
//
// `sticky top-0 h-dvh self-start` keeps it exactly one viewport tall and
// non-scrolling — without `self-start`, the flex container's default
// align-items: stretch forces full container height and sticky never
// engages. Only the nav region scrolls (rail itself is overflow-hidden), so
// the logo stays pinned top and the footer stays pinned bottom regardless of
// window height.
export function ConsoleSidebar({ defaultCollapsed = false, }) {
    const { role } = useSession();
    const [collapsed, setCollapsed] = useState(defaultCollapsed);
    // Allow-list rather than `role !== "client"`: naming who the stat IS for
    // means a new role gets nothing by default instead of silently inheriting
    // a sales KPI that isn't theirs. Declared in config/roles.ts, next to that
    // role's other permissions; SidebarStat reads the same field for WHICH figure.
    const showStat = features.sidebarStat && roleDefinitions[role].sidebarStat !== "none";
    function toggle() {
        const next = !collapsed;
        setCollapsed(next);
        // Written straight to the cookie rather than through a server action —
        // it's a display preference, so a toggle should feel instant.
        const maxAge = layout.sidebarCookieDays * 24 * 60 * 60;
        document.cookie = `${layout.sidebarCookie}=${next ? "1" : "0"}; path=/; max-age=${maxAge}; samesite=lax`;
    }
    return (<aside
    // Navigation can't be used on paper. See the PRINT block in app/globals.css.
    data-print="hide" data-collapsed={collapsed || undefined} style={{
            width: collapsed
                ? layout.sidebarCollapsedWidth
                : layout.sidebarWidth,
        }} className="deck-grid sticky top-0 relative hidden h-dvh shrink-0 flex-col self-start overflow-hidden border-r border-hairline bg-deck-rail transition-[width] duration-300 ease-out lg:flex">
      <div className={cn("relative z-10 flex h-[4.5rem] shrink-0 items-center gap-3 px-5", collapsed && "justify-center px-0")}>
        <Link href={homeForRole(role)} className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
          <StallionLogo variant={collapsed ? "mark" : "lockup"} priority className="h-6"/>
          {!collapsed && (<span className="font-mono text-xs uppercase tracking-[0.24em] text-brand">
              {brandConfig.productName}
            </span>)}
        </Link>
      </div>

      {/* min-h-0 required: a flex child defaults to min-height: auto, which
          refuses to shrink below its content and would push the footer off
          the bottom instead of scrolling. */}
      <div className={cn("deck-scroll relative z-10 min-h-0 flex-1 overflow-y-auto px-3 pt-2", collapsed && "px-2")}>
        <ConsoleNav role={role} collapsed={collapsed}/>
      </div>

      <div className={cn("relative z-10 flex shrink-0 flex-col gap-2 p-3", collapsed && "p-2")}>
        {showStat && !collapsed && <SidebarStat />}

        {features.collapsibleSidebar && (<button type="button" onClick={toggle} aria-label={collapsed ? content.expandSidebar : content.collapseSidebar} aria-expanded={!collapsed} className={cn("flex h-10 items-center gap-3 rounded-md px-3 text-[0.8125rem] text-ink-muted transition-colors hover:bg-white/[0.045] hover:text-ink-soft", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-deck-rail", collapsed && "justify-center px-0")}>
            <PanelLeft aria-hidden className={cn("size-[1.15rem] shrink-0 transition-transform duration-300", collapsed && "rotate-180")}/>
            {!collapsed && <span>{content.collapseSidebar}</span>}
          </button>)}

        <SignOutLink collapsed={collapsed}/>
      </div>
    </aside>);
}
