"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { consoleConfig } from "@/config/console";
import { navigation, type NavItem, type Role } from "@/config/navigation";
import { cn } from "@/lib/utils";

/**
 * The navigation list, shared by the desktop rail and the mobile sheet.
 *
 * One implementation on purpose: two copies of a nav list drift, and the one
 * you are not looking at is the one that goes stale.
 *
 * Items, order, icons and per-role visibility all come from
 * config/navigation.ts — there is no route named in this file.
 */
export function ConsoleNav({
  role,
  collapsed = false,
  onNavigate,
}: {
  /** The signed-in user's role. Items they cannot see are not rendered.
   *  NOTE: this is convenience, not security — the routes must also be
   *  authorised server-side. */
  role: Role;
  /** Icon-only rail. Labels stay in the DOM as sr-only text so the links keep
   *  their accessible names. */
  collapsed?: boolean;
  /** Called after a link is followed — the mobile sheet uses it to close. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  /**
   * Whether an item owns the current route.
   *
   * `matchNested` items stay lit on their child routes, so opening a lead
   * detail page keeps "Clients" highlighted instead of leaving the whole
   * sidebar dark with nothing selected.
   */
  const isActive = (item: NavItem): boolean =>
    item.matchNested
      ? pathname === item.href || pathname.startsWith(`${item.href}/`)
      : pathname === item.href;

  return (
    <nav aria-label={consoleConfig.content.navLabel} className="flex flex-col gap-6">
      {navigation.sections.map((section) => {
        const items = section.items.filter((item) => item.roles.includes(role));
        if (items.length === 0) return null;

        return (
          <div key={section.label}>
            {section.label && !collapsed && (
              <p className="mb-3 px-3 font-mono text-[0.625rem] uppercase tracking-[0.22em] text-ink-muted">
                {section.label}
              </p>
            )}

            <ul className="flex flex-col gap-1">
              {items.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      // aria-current is what tells a screen reader which page
                      // is open. The lime pill only says it to people who can
                      // see colour.
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group flex h-11 items-center gap-3 rounded-xl px-3 text-[0.9375rem] transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-deck-rail",
                        collapsed && "justify-center px-0",
                        active
                          ? // The single strongest use of lime in the app. It is
                            // the answer to "where am I", so nothing else in the
                            // rail competes with it.
                            "bg-brand font-semibold text-deck-void shadow-[0_10px_26px_-14px_rgb(186_252_12/0.9)]"
                          : "text-ink-soft hover:bg-white/[0.045] hover:text-ink",
                      )}
                    >
                      <Icon
                        aria-hidden
                        className={cn(
                          "size-[1.15rem] shrink-0 transition-colors",
                          active ? "text-deck-void" : "text-ink-muted group-hover:text-ink-soft",
                        )}
                      />
                      <span className={cn(collapsed && "sr-only")}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
