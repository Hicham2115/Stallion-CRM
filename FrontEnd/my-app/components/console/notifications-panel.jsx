"use client";
import Link from "next/link";
import { BellOff, LoaderCircle } from "lucide-react";
import { PopoverContent } from "@/components/ui/popover";
import { formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

// Presentational only — ConsoleTopbar owns the query/mutations and just
// hands this the data, so the fetching story lives in one place.
export function NotificationsPanel({
  notifications,
  isPending,
  onSelect,
  onMarkAllRead,
  isMarkingAllRead,
}) {
  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <PopoverContent align="end" className="w-80 p-0">
      <div className="flex items-center justify-between border-b border-hairline px-3.5 py-2.5">
        <p className="text-[0.8125rem] font-semibold text-ink">Notifications</p>
        {hasUnread && (
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={isMarkingAllRead}
            className="text-[0.75rem] text-brand transition-colors hover:text-brand/80 disabled:opacity-50"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isPending ? (
          <div className="flex items-center justify-center gap-2 py-8 text-[0.8125rem] text-ink-muted">
            <LoaderCircle aria-hidden className="deck-spin size-4" />
            Loading…
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-ink-muted">
            <BellOff aria-hidden className="size-5" />
            <p className="text-[0.8125rem]">You're all caught up.</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const isUnread = !notification.read_at;
            const { title, body, url } = notification.data ?? {};
            const content = (
              <>
                <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink">
                  {isUnread && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-brand" />}
                  {title}
                </p>
                {body && <p className="mt-0.5 text-[0.75rem] text-ink-muted">{body}</p>}
                <p className="mt-1 text-[0.6875rem] text-ink-muted/70">{formatTimeAgo(notification.created_at)}</p>
              </>
            );
            const className = cn(
              "block w-full border-b border-hairline px-3.5 py-2.5 text-left last:border-b-0 transition-colors hover:bg-white/[0.03]",
              isUnread && "bg-brand/5",
            );

            return url ? (
              <Link key={notification.id} href={url} onClick={() => onSelect(notification)} className={className}>
                {content}
              </Link>
            ) : (
              <button key={notification.id} type="button" onClick={() => onSelect(notification)} className={className}>
                {content}
              </button>
            );
          })
        )}
      </div>
    </PopoverContent>
  );
}
