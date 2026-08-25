import type { Metadata } from "next";

import { ChatView } from "./chat-view";

export const metadata: Metadata = {
  title: "Team Chat",
  description: "Message any rep on the Stallion Advertising sales team.",
};

/**
 * /admin/chat
 *
 * A Server Component owning only the metadata — the threads live in the CRM
 * store in the browser.
 *
 * TODO(backend): chat needs more than a REST endpoint. Sending is covered by
 * `sendMessage` in lib/crm-api.ts, but RECEIVING needs a live transport
 * (websocket or SSE) so another person's message arrives without a refresh.
 * Until that exists this screen is a one-way demo, and the composer says so.
 */
export default function ChatPage() {
  return <ChatView />;
}
