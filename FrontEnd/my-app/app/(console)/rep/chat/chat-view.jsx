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
// One conversation, no thread list — a rep only ever talks to their manager,
// unlike the admin screen which lists many reps. `fromMe` is re-derived per
// viewer by messagesForViewer() rather than trusted from the stored
// (manager's-POV) flag, since a rep viewing it directly would otherwise see
// every message painted backwards. See lib/store/selectors.ts.
export function RepChatView() {
    const { state, actions } = useCrm();
    const { rep, loading } = useRepScope();
    if (loading)
        return <RepSkeleton />;
    if (!rep)
        return <RepMissing />;
    // Threads are keyed by rep, so this is the same record their manager
    // opens from /admin/chat — one conversation, two doors.
    const thread = state.threads.find((entry) => entry.repId === rep.id);
    const manager = state.currentUser;
    if (!thread) {
        return (<PageShell>
        <Panel className="mx-auto w-full max-w-2xl">
          <EmptyState icon={MessageSquareDashed} title={copy.noManagerTitle} description={copy.noManagerDescription}/>
        </Panel>
      </PageShell>);
    }
    async function handleSend(body) {
        if (!thread)
            return false;
        const result = await actions.sendMessage(thread.id, body);
        return result.ok;
    }
    return (<PageShell>
      <Panel className="flex h-[calc(100dvh-11rem)] flex-col overflow-hidden">
        <PanelHeader title={<span className="flex items-center gap-2.5">
              <InitialsAvatar name={manager.name} size="lg"/>
              {manager.name}
            </span>} hint={manager.title}/>

        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <MessageList threadId={thread.id} messages={messagesForViewer(thread.messages, rep.name)}/>

          <div className="border-t border-hairline p-4 sm:p-5">
            <MessageComposer onSend={handleSend}/>
          </div>
        </div>
      </Panel>
    </PageShell>);
}
