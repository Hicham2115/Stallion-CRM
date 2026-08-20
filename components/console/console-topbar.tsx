"use client";

import { usePathname } from "next/navigation";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { MobileNav } from "@/components/console/mobile-nav";
import { InitialsAvatar } from "@/components/deck/initials-avatar";
import { MockDataChip } from "@/components/console/mock-data-chip";
import { usePageTitle } from "@/components/console/page-title";
import { consoleConfig } from "@/config/console";
import { findNavItem, notificationIcon as Bell } from "@/config/navigation";
import { firstNameOf, template } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";

/**
 * The bar across the top of every console page.
 *
 * The page title and subtitle are NOT passed in by each page — they are looked
 * up from the current route in config/navigation.ts. That means a new page gets
 * its heading by existing, and a title can never disagree with the sidebar
 * label pointing at it.
 */
export function ConsoleTopbar() {
  const pathname = usePathname();
  const { state } = useCrm();
  const user = state.currentUser;

  const item = findNavItem(pathname);
  const override = usePageTitle();

  // Titles may carry a {firstName} token — the dashboard greets by name.
  const routeTitle = template(item?.title ?? "", {
    firstName: firstNameOf(user.name),
  });

  // A detail page may override both, and adds a breadcrumb back to its parent.
  // The route lookup is still the default, so nothing static had to change.
  const title = override.title ?? routeTitle;
  const subtitle = override.title ? override.subtitle : item?.subtitle;

  return (
    <header className="sticky top-0 z-30 flex min-h-[4.5rem] shrink-0 items-center gap-4 border-b border-hairline bg-deck-bar/90 px-4 py-3 backdrop-blur-xl sm:px-6">
      <span data-print="hide">
        <MobileNav role={user.role} />
      </span>

      {/* ------------------------------------------------------------------ */}
      {/* Page identity                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="min-w-0 flex-1">
        {override.parent && (
          <Link
            href={override.parent.href}
            className="-ml-1 mb-0.5 inline-flex items-center gap-1 rounded text-[0.75rem] text-ink-muted transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
          >
            <ChevronLeft aria-hidden className="size-3.5" />
            {override.parent.label}
          </Link>
        )}

        <h1 className="truncate font-display text-[1.375rem] font-semibold tracking-[-0.03em] text-ink sm:text-[1.5rem]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 hidden truncate text-[0.8125rem] text-ink-muted sm:block">
            {subtitle}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Controls                                                            */}
      {/* ------------------------------------------------------------------ */}
      {/* The heading above stays in print — it names the report. These are
          controls, so they go. */}
      <div
        data-print="hide"
        className="flex shrink-0 items-center gap-2 sm:gap-3"
      >
        <MockDataChip />

        {consoleConfig.features.notifications && (
          <button
            type="button"
            aria-label={consoleConfig.content.notificationsLabel}
            className="grid size-10 place-items-center rounded-xl border border-hairline bg-white/[0.03] text-ink-soft transition-colors hover:bg-white/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
          >
            <Bell aria-hidden className="size-[1.15rem]" />
          </button>
        )}

        {/* User block. Not a menu yet — the prototype has no account dropdown,
            and a control that opens nothing is worse than no control. */}
        <div className="flex items-center gap-2.5">
          {/* Tinted, not filled. The active nav item in the rail is the
              console's one lime fill; a solid lime disc up here competed with
              it on every single screen. See DESIGN.md, The One Lime Answer
              Rule. */}
          <InitialsAvatar name={user.name} size="xl" />

          <div className="hidden leading-tight sm:block">
            <p className="flex items-center gap-2 text-[0.875rem] font-medium text-ink">
              {user.name}
              <span className="rounded-full bg-brand/15 px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-brand">
                {user.roleBadge}
              </span>
            </p>
            <p className="text-[0.75rem] text-ink-muted">{user.title}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
