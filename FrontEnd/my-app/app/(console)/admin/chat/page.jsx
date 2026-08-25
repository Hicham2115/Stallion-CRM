import { ChatView } from "./chat-view";
export const metadata = {
    title: "Team Chat",
    description: "Message any rep on the Stallion Advertising sales team.",
};
// TODO(backend): chat needs more than a REST endpoint. Sending is covered
// by sendMessage in lib/crm-api.ts, but receiving needs a live transport
// (websocket or SSE) so another person's message arrives without a refresh.
export default function ChatPage() {
    return <ChatView />;
}
