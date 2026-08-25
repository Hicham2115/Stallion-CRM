/**
 * ============================================================================
 *  FIELD STYLING — one definition of what a text input looks like
 * ============================================================================
 *  The login form, the Add Client dialog and the Create Account panel each
 *  carried their own copy of these strings. The comment at the top of two of
 *  them said "lifted verbatim from the login form", which is an accurate
 *  description of a drift bug waiting to happen: three copies stay identical
 *  right up until someone edits one.
 *
 *  Restyle every field in the product by editing this file.
 *
 *  WHY THE SIZE IS NOT IN HERE. `fieldBase` deliberately carries no height and
 *  no horizontal padding. The login card runs 3rem fields with icons inset on
 *  the left; the console dialogs run 2.75rem fields with plain padding. Those
 *  are real differences — a lobby control and a working control — so each call
 *  site adds its own `h-*` and `px-*` and everything else is shared.
 *
 *  COLOUR COMES FROM THE RESERVED STATUS PALETTE. An invalid field is a state,
 *  which is exactly what --status-critical is for. These used to be Tailwind's
 *  default `red-500` / `red-300`, which meant a user could see two different
 *  reds for the same meaning in one interaction — the dialog's error text and
 *  the row menu's Delete — and the print stylesheet, which remaps the token,
 *  had no idea the raw red existed.
 * ============================================================================
 */

/** Everything a deck text input shares. Add `h-*` and `px-*` at the call site. */
export const fieldBase =
  "deck-input w-full rounded-xl border border-hairline bg-white/[0.02] text-[0.9375rem] text-ink caret-brand outline-none transition duration-200 placeholder:text-ink-muted hover:border-hairline-strong hover:bg-white/[0.035] focus:border-brand/55 focus:bg-white/[0.05] focus:ring-4 focus:ring-brand/10";

/**
 * Applied on top of `fieldBase` when the field has failed validation.
 *
 * It overrides the border and the focus ring only — the fill and the caret stay
 * as they are, so an invalid field still reads as the same control rather than
 * as a different component.
 */
export const fieldInvalid =
  "border-status-critical/45 hover:border-status-critical/60 focus:border-status-critical/70 focus:ring-status-critical/10";

/** The micro-label above a field. */
export const fieldLabel =
  "font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted";

/** The message under a failed field. Add your own top margin at the call site. */
export const fieldErrorText = "text-[0.8125rem] text-status-critical";

/** A caution under a field that has not failed — caps lock, for instance. */
export const fieldWarningText = "text-[0.8125rem] text-status-warning";

/** Form-level alert box: bad credentials, server unreachable. */
export const fieldAlert =
  "flex items-start gap-2.5 rounded-xl border border-status-critical/28 bg-status-critical/10 px-3.5 py-3 text-[0.8125rem] leading-relaxed text-status-critical";

/** An icon inset in the left edge of a field. Host needs `group relative`. */
export const fieldIcon =
  "pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-muted transition-colors group-focus-within:text-brand";

/** Keeps an invalid field's icon red, so the colour never contradicts the
 *  message sitting underneath it. */
export const fieldIconInvalid =
  "text-status-critical group-focus-within:text-status-critical";
