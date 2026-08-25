"use client";
import { useRef, useState } from "react";
import { LoaderCircle, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chatConfig } from "@/config/chat";
const { content, features } = chatConfig;
// Enter sends, Shift+Enter inserts a newline — the standard chat pattern,
// hinted under the field since an undiscoverable shortcut helps nobody.
export function MessageComposer({ onSend,
/** Disabled while there is no thread open. */
disabled = false, }) {
    const [body, setBody] = useState("");
    const [pending, setPending] = useState(false);
    const fieldRef = useRef(null);
    const canSend = body.trim().length > 0 && !pending && !disabled;
    async function submit() {
        if (!canSend)
            return;
        setPending(true);
        const sent = await onSend(body.trim());
        if (sent) {
            setBody("");
            fieldRef.current?.focus();
        }
        setPending(false);
    }
    function handleSubmit(event) {
        event.preventDefault();
        void submit();
    }
    function handleKeyDown(event) {
        if (!features.enterSends)
            return;
        if (event.key !== "Enter" || event.shiftKey)
            return;
        // Don't intercept Enter during IME composition — it commits the
        // candidate word for CJK input, not a submit.
        if (event.nativeEvent.isComposing)
            return;
        event.preventDefault();
        void submit();
    }
    return (<form onSubmit={handleSubmit} className="border-t border-hairline p-3 sm:p-4">
      <div className="flex items-end gap-2">
        <label htmlFor="chat-composer" className="sr-only">
          {content.composerPlaceholder}
        </label>

        <textarea id="chat-composer" ref={fieldRef} rows={1} value={body} disabled={disabled} onChange={(event) => setBody(event.target.value)} onKeyDown={handleKeyDown} placeholder={content.composerPlaceholder} className="deck-input max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-hairline bg-white/[0.02] px-3.5 py-3 text-[0.875rem] leading-snug text-ink caret-brand outline-none transition duration-200 placeholder:text-ink-muted hover:border-hairline-strong hover:bg-white/[0.035] focus:border-brand/55 focus:bg-white/[0.05] focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-50"/>

        <Button type="submit" size="icon-lg" disabled={!canSend} aria-label={content.sendLabel} className="size-11 shrink-0 rounded-xl">
          {pending ? (<LoaderCircle aria-hidden className="deck-spin size-4"/>) : (<SendHorizontal aria-hidden/>)}
        </Button>
      </div>

      <p className="mt-2 text-[0.6875rem] text-ink-muted">
        {features.enterSends && `${content.sendHint} · `}
        {content.notLiveNotice}
      </p>
    </form>);
}
