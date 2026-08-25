"use client";

import { useState } from "react";
import { ChevronLeft, MessagesSquare, Users } from "lucide-react";

import { MessageComposer } from "@/components/admin/chat/message-composer";
import { MessageList } from "@/components/admin/chat/message-list";
import { ThreadList } from "@/components/admin/chat/thread-list";
import { PageShell } from "@/components/console/page-shell";
import { EmptyState } from "@/components/deck/empty-state";
import { InitialsAvatar } from "@/components/deck/initials-avatar";
import { Panel, PanelHeader } from "@/components/deck/panel";
import { chatConfig } from "@/config/chat";
import { useCrm } from "@/lib/store/crm-store";
import { cn } from "@/lib/utils";

const { content, features } = chatConfig;

/**
 * ============================================================================
 *  TEAM CHAT
 * ============================================================================
 *  A rep list and a conversation pane.
 *
 *  RESPONSIVE SHAPE. Two panes side by side is a desktop layout; on a phone it
 *  gives 160px to each and neither is usable. Below `md` the list IS the view,
 *  and opening a thread pushes to it with a back control — the standard phone
 *  messaging pattern, and the only one that fits.
 *
 *  IT IS NOT REAL-TIME AND THE SCREEN SAYS SO. Nothing here can receive a
 *  message: there is no server, no socket, no poll. `sendMessage` in
 *  lib/crm-api.ts carries the TODO naming websocket/SSE as the missing half,
 *  and the composer prints the caveat under the field — because a chat panel
 *  that looks live but delivers nothing is how someone misses a message they
 *  believed they had sent.
 * ============================================================================
 */
export function ChatView() {
  const { state, actions } = useCrm();

  const reps = features.hideInactiveReps
    ? state.reps.filter((rep) => rep.active)
    : state.reps;

  // Opens on the first rep so the pane is never empty on a desktop arrival.
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    () => state.threads.find((thread) => thread.repId === reps[0]?.id)?.id ?? null,
  );

  // Phones show one pane at a time; this decides which.
  const [mobilePane, setMobilePane] = useState<"list" | "thread">("list");

  const thread = state.threads.find((entry) => entry.id === selectedThreadId);
  const rep = state.reps.find((entry) => entry.id === thread?.repId);

  function handleSelect(threadId: string) {
    setSelectedThreadId(threadId);
    setMobilePane("thread");
  }

  async function handleSend(body: string): Promise<boolean> {
    if (!thread) return false;
    const result = await actions.sendMessage(thread.id, body);
    return result.ok;
  }

  if (reps.length === 0) {
    // Inside PageShell like every other screen: without it this state sat at
    // a different width from the rest of the console.
    return (
      <PageShell>
        <Panel className="mx-auto w-full max-w-2xl">
          <EmptyState
            icon={Users}
            title={content.noRepsTitle}
            description={content.noRepsDescription}
          />
        </Panel>
      </PageShell>
    );
  }

  return (
    <PageShell gap={false}>
      {/* A fixed-height shell: the two panes scroll internally rather than the
          page, which is what keeps the composer pinned in view while a long
          history scrolls behind it. */}
      <div className="grid h-[calc(100dvh-9.5rem)] grid-cols-1 gap-5 md:grid-cols-12">
        {/* ---------------------------------------------------------------- */}
        {/* Conversations                                                     */}
        {/* ---------------------------------------------------------------- */}
        <Panel
          className={cn(
            "flex min-h-0 flex-col md:col-span-4 lg:col-span-3",
            mobilePane === "thread" && "hidden md:flex",
          )}
        >
          <PanelHeader title={content.listTitle} hint={content.listHint} />
          <div className="mt-4 flex min-h-0 flex-1 flex-col">
            <ThreadList
              reps={reps}
              threads={state.threads}
              selectedThreadId={selectedThreadId}
              onSelect={handleSelect}
            />
          </div>
        </Panel>

        {/* ---------------------------------------------------------------- */}
        {/* Conversation                                                      */}
        {/* ---------------------------------------------------------------- */}
        <Panel
          className={cn(
            "flex min-h-0 flex-col md:col-span-8 lg:col-span-9",
            mobilePane === "list" && "hidden md:flex",
          )}
        >
          {thread && rep ? (
            <>
              <header className="flex items-center gap-3 border-b border-hairline px-4 py-3.5 sm:px-5">
                {/* Phones only — the desktop layout never hides the list. */}
                <button
                  type="button"
                  onClick={() => setMobilePane("list")}
                  className="-ml-1 grid size-8 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 md:hidden"
                  aria-label={content.backLabel}
                >
                  <ChevronLeft aria-hidden className="size-4" />
                </button>

                <InitialsAvatar name={rep.name} size="lg" />

                <div className="min-w-0">
                  <h2 className="truncate text-[0.9375rem] font-medium text-ink">
                    {rep.name}
                  </h2>
                  <p className="truncate text-[0.75rem] text-ink-muted">
                    {rep.role}
                    {!rep.active && ` · ${content.inactiveSuffix}`}
                  </p>
                </div>
              </header>

              <MessageList messages={thread.messages} threadId={thread.id} />

              <MessageComposer onSend={handleSend} />
            </>
          ) : (
            <EmptyState
              icon={MessagesSquare}
              title={content.noSelectionTitle}
              description={content.noSelectionDescription}
              className="flex-1"
            />
          )}
        </Panel>
      </div>
    </PageShell>
  );
}
