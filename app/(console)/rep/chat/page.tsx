import type { Metadata } from "next";

import { RepChatView } from "./chat-view";

export const metadata: Metadata = { title: "Team Chat" };

/** /rep/chat — see app/(console)/rep/page.tsx for the pattern. */
export default function RepChatPage() {
  return <RepChatView />;
}
