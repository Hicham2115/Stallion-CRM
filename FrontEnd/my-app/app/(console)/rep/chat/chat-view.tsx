"use client";

import { MessageSquareDashed } from "lucide-react";

import { MessageComposer } from "@/components/admin/chat/message-composer";
import { MessageList } from "@/components/admin/chat/message-list";
import { PageShell } from "@/components/console/page-shell";
import { EmptyState } from "@/components/deck/empty-state";
import { InitialsAvatar } from "@/components/deck/initials-avatar";
import { Panel, PanelHeader } from "@/components/deck/panel";
import { RepMissing, RepSkeleton } from "@/components/rep/rep-states";
import { useRepScope } from "@/components/rep/use-rep-scope";
import { repConfig } from "@/config/rep";
import { useCrm } from "@/lib/store/crm-store";
import { messagesForViewer } from "@/lib/store/selectors";

const copy = repConfig.content.chat;

/**
 * ============================================================================
 *  /rep/chat — MY MANAGER
 * ============================================================================
 *  One conversation, no list.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  WHY THERE IS NO THREAD LIST
 *  ─────────────────────────────────────────────────────────────────────────
 *  The admin screen has one because an admin talks to eight reps. A rep has
 *  exactly one conversation in this product — with their manager — and a
 *  sidebar listing a single row would be a navigation control for a choice
 *  that does not exist. Dropping it also gives the messages the full width,
 *  which is what the pane is for.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  "fromMe" IS RE-DERIVED, AND THIS IS THE SCREEN THAT PROVED IT HAD TO BE
 *  ─────────────────────────────────────────────────────────────────────────
 *  `ChatMessage.fromMe` is stored, and the seed wrote it from the sales
 *  MANAGER's point of view. Opening the same thread from the rep's side made
 *  every flag backwards: a rep would have seen their own messages painted and
 *  aligned as the manager's, on the one screen whose entire job is telling the
 *  two apart.
 *
 *  `fromMe` is not a property of a message; it is a property of a message AND A
 *  READER. `messagesForViewer()` computes it at render time — see the note on
 *  it in lib/store/selectors.ts, which also carries the TODO for dropping the
 *  stored flag once messages carry an author id.
 *
 *  IT IS NOT REAL-TIME AND THE SCREEN SAYS SO, same as the admin's: nothing
 *  here can RECEIVE a message. A chat panel that looks live but delivers
 *  nothing is how someone misses a message they believed they had sent.
 * ============================================================================
 */
export function RepChatView() {
  const { state, actions } = useCrm();
  const { rep, loading } = useRepScope();

  if (loading) return <RepSkeleton />;
  if (!rep) return <RepMissing />;

  // The rep's own thread. Threads are keyed by rep, so a rep has exactly one
  // and it is the same record their manager opens from /admin/chat — one
  // conversation with two doors, not two conversations.
  const thread = state.threads.find((entry) => entry.repId === rep.id);

  // The other side of it. `state.currentUser` is the manager: the mock has one
  // agency account, and it is who a rep is talking to.
  const manager = state.currentUser;

  if (!thread) {
    return (
      <PageShell>
        <Panel className="mx-auto w-full max-w-2xl">
          <EmptyState
            icon={MessageSquareDashed}
            title={copy.noManagerTitle}
            description={copy.noManagerDescription}
          />
        </Panel>
      </PageShell>
    );
  }

  async function handleSend(body: string): Promise<boolean> {
    if (!thread) return false;
    const result = await actions.sendMessage(thread.id, body);
    return result.ok;
  }

  return (
    <PageShell>
      <Panel className="flex h-[calc(100dvh-11rem)] flex-col overflow-hidden">
        <PanelHeader
          title={
            <span className="flex items-center gap-2.5">
              <InitialsAvatar name={manager.name} size="lg" />
              {manager.name}
            </span>
          }
          hint={manager.title}
        />

        {/* The log. `flex-1 overflow-hidden` rather than a fixed height, so the
            pane grows with the viewport and the composer stays pinned. */}
        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <MessageList
            threadId={thread.id}
            messages={messagesForViewer(thread.messages, rep.name)}
          />

          {/* No second caveat here. `MessageComposer` already prints
              `chatConfig.content.notLiveNotice` under the field, and this
              panel briefly printed a near-identical sentence directly beneath
              it — two warnings saying the same thing makes a reader stop and
              check whether they differ. One honest notice, in the component
              that owns the field. */}
          <div className="border-t border-hairline p-4 sm:p-5">
            <MessageComposer onSend={handleSend} />
          </div>
        </div>
      </Panel>
    </PageShell>
  );
}
