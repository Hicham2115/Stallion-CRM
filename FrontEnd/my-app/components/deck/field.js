// Shared field styling so the login form, Add Client dialog and Create Account panel don't drift apart.
// Size (h-*, px-*) is intentionally left out — call sites differ enough to need their own.
// Colors come from the --status-critical token, not raw Tailwind reds, so error states stay consistent.
export const fieldBase = "deck-input w-full rounded-xl border border-hairline bg-white/[0.02] text-[0.9375rem] text-ink caret-brand outline-none transition duration-200 placeholder:text-ink-muted hover:border-hairline-strong hover:bg-white/[0.035] focus:border-brand/55 focus:bg-white/[0.05] focus:ring-4 focus:ring-brand/10";
// Applied on top of fieldBase when validation fails; only the border/focus ring change so it still reads as the same control.
export const fieldInvalid = "border-status-critical/45 hover:border-status-critical/60 focus:border-status-critical/70 focus:ring-status-critical/10";
export const fieldLabel = "font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted";
/** The message under a failed field. Add your own top margin at the call site. */
export const fieldErrorText = "text-[0.8125rem] text-status-critical";
/** A caution under a field that has not failed — caps lock, for instance. */
export const fieldWarningText = "text-[0.8125rem] text-status-warning";
/** Form-level alert box: bad credentials, server unreachable. */
export const fieldAlert = "flex items-start gap-2.5 rounded-xl border border-status-critical/28 bg-status-critical/10 px-3.5 py-3 text-[0.8125rem] leading-relaxed text-status-critical";
/** An icon inset in the left edge of a field. Host needs `group relative`. */
export const fieldIcon = "pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-muted transition-colors group-focus-within:text-brand";
// Keeps an invalid field's icon red so it doesn't contradict the message underneath.
export const fieldIconInvalid = "text-status-critical group-focus-within:text-status-critical";
