"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { LoaderCircle, SendHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { chatConfig } from "@/config/chat";

const { content, features } = chatConfig;

/**
 * The message composer.
 *
 * KEYBOARD PATH. The prototype had a text field and a Send button and nothing
 * else — every message ended with a reach for the mouse. Enter now sends and
 * Shift+Enter inserts a newline, which is what every chat client does and what
 * anyone typing here will try first. The hint under the field says so, because
 * an undiscoverable shortcut helps only the person who wrote it.
 *
 * Send is disabled while the field is empty or only whitespace, so the control
 * cannot produce a blank message.
 */
export function MessageComposer({
  onSend,
  /** Disabled while there is no thread open. */
  disabled = false,
}: {
  onSend: (body: string) => Promise<boolean>;
  disabled?: boolean;
}) {
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  const canSend = body.trim().length > 0 && !pending && !disabled;

  async function submit() {
    if (!canSend) return;

    setPending(true);
    const sent = await onSend(body.trim());
    if (sent) {
      setBody("");
      // Focus stays in the composer: the overwhelmingly likely next action is
      // another message, and losing focus after every send means re-clicking
      // the field each time.
      fieldRef.current?.focus();
    }
    setPending(false);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!features.enterSends) return;
    if (event.key !== "Enter" || event.shiftKey) return;

    // Never intercept Enter while an IME composition is open — for a Japanese
    // or Chinese typist that keystroke commits the candidate word, and sending
    // on it would truncate their message mid-word.
    if (event.nativeEvent.isComposing) return;

    event.preventDefault();
    void submit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-hairline p-3 sm:p-4"
    >
      <div className="flex items-end gap-2">
        <label htmlFor="chat-composer" className="sr-only">
          {content.composerPlaceholder}
        </label>

        <textarea
          id="chat-composer"
          ref={fieldRef}
          rows={1}
          value={body}
          disabled={disabled}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={content.composerPlaceholder}
          className="deck-input max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-hairline bg-white/[0.02] px-3.5 py-3 text-[0.875rem] leading-snug text-ink caret-brand outline-none transition duration-200 placeholder:text-ink-muted hover:border-hairline-strong hover:bg-white/[0.035] focus:border-brand/55 focus:bg-white/[0.05] focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-50"
        />

        <Button
          type="submit"
          size="icon-lg"
          disabled={!canSend}
          aria-label={content.sendLabel}
          className="size-11 shrink-0 rounded-xl"
        >
          {pending ? (
            <LoaderCircle aria-hidden className="deck-spin size-4" />
          ) : (
            <SendHorizontal aria-hidden />
          )}
        </Button>
      </div>

      <p className="mt-2 text-[0.6875rem] text-ink-muted">
        {features.enterSends && `${content.sendHint} · `}
        {content.notLiveNotice}
      </p>
    </form>
  );
}
