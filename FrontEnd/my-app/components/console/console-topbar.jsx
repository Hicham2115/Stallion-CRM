"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { MobileNav } from "@/components/console/mobile-nav";
import { NotificationsPanel } from "@/components/console/notifications-panel";
import { InitialsAvatar } from "@/components/deck/initials-avatar";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { usePageTitle } from "@/components/console/page-title";
import { useSession } from "@/components/console/session-provider";
import { adminConfig } from "@/config/admin";
import { consoleConfig } from "@/config/console";
import { findNavItem, notificationIcon as Bell } from "@/config/navigation";
import { api } from "@/lib/axios";
import { firstNameOf, template } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import { useSessionStore } from "@/lib/store/session-store";
import { selectSessionUser } from "@/lib/store/selectors";
// Page title/subtitle aren't passed in per page — looked up from the route
// in config/navigation.ts, so a title can never disagree with the sidebar
// label pointing at it.
export function ConsoleTopbar() {
  const pathname = usePathname();
  const { state } = useCrm();
  const session = useSession();
  const queryClient = useQueryClient();
  // Not state.currentUser directly — the store holds one seeded identity,
  // but a client session needs to show the client's own name/company/badge.
  // Resolving from the session keeps that out of persisted state.
  const user = selectSessionUser(state, session);
  const item = findNavItem(pathname);

  // Only real (Sanctum-backed) accounts have a token — the client portal's
  // session is a mock demo identity with nothing to fetch here.
  const token = useSessionStore((s) => s.token);
  const notificationsEnabled = consoleConfig.features.notifications && Boolean(token);

  // selectSessionUser() resolves a CLIENT's name from the mock store, which
  // has nothing for a real portal login — it would show the demo seed's
  // name instead of the signed-in person's own. Real for that one role only;
  // admin/sales/dev's mock identity already matches who's actually signed in.
  const isRealClient = Boolean(token) && session.role === "client";
  const { data: realUser } = useQuery({
    queryKey: ["user"],
    queryFn: async () => (await api.get("/api/user")).data,
    enabled: isRealClient,
  });
  if (isRealClient && realUser) {
    user.name = realUser.name; // safe — selectSessionUser() built this object fresh, it's not shared state
  }

  const { data, isPending } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get("/api/notifications")).data,
    enabled: notificationsEnabled,
    refetchInterval: 30000,
  });
  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unread_count ?? 0;

  const markRead = useMutation({
    mutationFn: (id) => api.patch(`/api/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAllRead = useMutation({
    mutationFn: () => api.patch("/api/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  function handleSelectNotification(notification) {
    if (!notification.read_at) markRead.mutate(notification.id);
  }
  const override = usePageTitle();
  const routeTitle = template(item?.title ?? "", {
    firstName: firstNameOf(user.name),
  });
  // A detail page may override both and add a breadcrumb to its parent.
  const title = override.title ?? routeTitle;
  const subtitle = override.title ? override.subtitle : item?.subtitle;
  return (
    <header className="sticky top-0 z-30 flex min-h-[4.5rem] shrink-0 items-center gap-4 border-b border-hairline bg-deck-bar/90 px-4 py-3 backdrop-blur-xl sm:px-6">
      <span data-print="hide">
        <MobileNav role={user.role} />
      </span>

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

      <div
        data-print="hide"
        className="flex shrink-0 items-center gap-2 sm:gap-3"
      >
        {consoleConfig.features.notifications && (
          <Popover>
            <PopoverTrigger
              aria-label={consoleConfig.content.notificationsLabel}
              className="relative grid size-10 place-items-center rounded-xl border border-hairline bg-white/[0.03] text-ink-soft transition-colors hover:bg-white/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
            >
              <Bell aria-hidden className="size-[1.15rem]" />
              {unreadCount > 0 && (
                <span
                  aria-hidden
                  className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 font-mono text-[0.625rem] font-semibold text-deck-void"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </PopoverTrigger>
            <NotificationsPanel
              notifications={notifications}
              isPending={notificationsEnabled && isPending}
              onSelect={handleSelectNotification}
              onMarkAllRead={() => markAllRead.mutate()}
              isMarkingAllRead={markAllRead.isPending}
            />
          </Popover>
        )}

        <ProfileBlock user={user} />
      </div>
    </header>
  );
}

// Only admin has a Settings screen today (config/admin.js) — other roles
// keep the old static block rather than link somewhere that doesn't exist.
function ProfileBlock({ user }) {
  const content = (
    <>
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
    </>
  );

  if (user.role !== "admin") {
    return <div className="flex items-center gap-2.5">{content}</div>;
  }

  return (
    <Link
      href={adminConfig.routes.settings}
      aria-label={consoleConfig.content.userMenuLabel}
      className="flex items-center gap-2.5 rounded-xl transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
    >
      {content}
    </Link>
  );
}
