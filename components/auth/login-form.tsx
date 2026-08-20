"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties, type FormEvent, type KeyboardEvent } from "react";
import {
  ArrowRight,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  TriangleAlert,
} from "lucide-react";

import {
  fieldAlert,
  fieldBase,
  fieldErrorText,
  fieldIcon,
  fieldIconInvalid,
  fieldInvalid,
  fieldLabel,
  fieldWarningText,
} from "@/components/deck/field";
import { WarningChip } from "@/components/deck/warning-chip";
import { loginConfig } from "@/config/login";
import {
  authBackendConnected,
  signInWithGoogle,
  signInWithPassword,
} from "@/lib/auth";
import { cn } from "@/lib/utils";

const { content, features, routes, validation } = loginConfig;

/**
 * Whether this build lets people through without checking anything.
 *
 * Both halves have to be true: the flag says a preview bypass is ALLOWED, and
 * `authBackendConnected` says whether one is NEEDED. Wiring the backend flips
 * the second on its own, so the bypass disappears without anyone editing
 * config — which is the only version of this that cannot be left on by
 * accident in production.
 */
const previewMode = features.previewFallback && !authBackendConnected;

/* --------------------------------------------------------------------------
   Field styling comes from components/deck/field.ts, shared with the console
   dialogs. Only what is genuinely different about THIS surface lives here.
   -------------------------------------------------------------------------- */

/**
 * The login card runs 3rem fields with a lit top edge and a lime bloom on
 * focus. The console dialogs run 2.75rem fields with neither: this is a lobby
 * control seen once, those are working controls seen all day.
 */
const inputBase = cn(
  fieldBase,
  "h-12 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.035)] focus:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.07),0_10px_30px_-16px_rgb(186_252_12/0.55)]",
);

const errorText = cn("mt-2", fieldErrorText);

/** Staggered page-load choreography — see .reveal in app/globals.css. */
const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

/** Google's four-colour "G". Inlined so the card stays free of remote assets. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="size-[1.125rem]">
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.5 6.6-16.1z" />
      <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.6-3.9-12.3-9.1H4.3v5.7C7.9 41.1 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.7 28.1c-.4-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1v-5.7H4.3C2.8 17.2 2 20.5 2 24s.8 6.8 2.3 9.8l7.4-5.7z" />
      <path fill="#EA4335" d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.4 2 7.9 6.9 4.3 14.2l7.4 5.7c1.7-5.2 6.6-9.1 12.3-9.1z" />
    </svg>
  );
}

type FieldErrors = { email?: string; password?: string };

/**
 * The sign-in card.
 *
 * A Client Component, because it owns form state and the show/hide password
 * toggle. It never talks to an auth provider itself — everything goes through
 * lib/auth.ts, so swapping providers does not touch this file.
 */
export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  /** Which action is in flight, so the two buttons show separate spinners. */
  const [pending, setPending] = useState<"idle" | "password" | "google">("idle");

  const busy = pending !== "idle";

  /** Client-side checks only — the server must validate again regardless. */
  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    const trimmed = email.trim();

    if (!trimmed) errors.email = content.errors.emailRequired;
    else if (!validation.emailPattern.test(trimmed))
      errors.email = content.errors.emailInvalid;

    if (!password) errors.password = content.errors.passwordRequired;
    else if (password.length < validation.minPasswordLength)
      errors.password = content.errors.passwordTooShort;

    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    // Preview build: nothing to check, so nothing is checked. Validation is
    // skipped deliberately rather than passed — gating entry on a well-formed
    // email would be theatre when the email is never read by anything.
    //
    // The pending state is still shown: it is part of the design being
    // reviewed, and a button that changes nothing on click reads as broken.
    if (previewMode) {
      setPending("password");
      router.push(routes.afterSignIn);
      return;
    }

    const errors = validate();
    setFieldErrors(errors);

    if (errors.email || errors.password) {
      // Send focus to the first field that failed so keyboard and screen
      // reader users land on the problem instead of hunting for it.
      document.getElementById(errors.email ? "email" : "password")?.focus();
      return;
    }

    setPending("password");

    try {
      const result = await signInWithPassword({
        email: email.trim(),
        password,
        remember,
      });

      if (result.ok) {
        router.push(routes.afterSignIn);
        // Deliberately stay in the pending state: the button remains disabled
        // while the route transition runs, so the form cannot be double-sent.
        return;
      }

      if (result.field === "email") {
        setFieldErrors({ email: result.message });
        document.getElementById("email")?.focus();
      } else if (result.field === "password") {
        setFieldErrors({ password: result.message });
        document.getElementById("password")?.focus();
      } else {
        setFormError(result.message);
      }
    } catch (error) {
      console.error("[login] sign-in failed", error);
      setFormError(content.errors.unexpected);
    }

    setPending("idle");
  }

  async function handleGoogle() {
    setFormError(null);
    setPending("google");
    try {
      await signInWithGoogle();
      // On success the provider redirects away, so nothing to do here.
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : content.errors.unexpected,
      );
      setPending("idle");
    }
  }

  /** Warn about Caps Lock — the single most common cause of "wrong password". */
  function trackCapsLock(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState("CapsLock"));
  }

  return (
    <div className="w-full max-w-[27rem]">
      {/* ================================================================== */}
      {/* The card                                                            */}
      {/* ================================================================== */}
      <div
        className="reveal-card deck-lift relative overflow-hidden rounded-2xl border border-hairline bg-deck-card/85 p-7 backdrop-blur-xl sm:p-9"
        style={delay(220)}
      >
        {/* Lit top edge — reads as a light source above the card. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgb(186_252_12/0.45),transparent)]"
        />

        {/* The light from that edge, falling into the card. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-44 bg-[radial-gradient(70%_100%_at_50%_0%,rgb(186_252_12/0.05),transparent_72%)]"
        />

        <header>
          {/* Kicker left, standing status right — the same header shape the
              console panels use. The chip is a condition, not an error, so it
              lives up here rather than in the alert slot below. */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-brand">
              {content.cardKicker}
            </p>

            {previewMode && (
              <WarningChip
                icon={TriangleAlert}
                label={content.previewChipLabel}
                title={content.previewChipTooltip}
              />
            )}
          </div>
          <h2 className="mt-3 font-display text-[1.75rem] font-semibold tracking-[-0.025em] text-ink">
            {content.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {content.subtitle}
          </p>
        </header>

        {/* ---------------------------------------------------------------- */}
        {/* Google SSO — remove by setting features.googleSignIn = false      */}
        {/* in config/login.ts. The divider below it goes with it.            */}
        {/* ---------------------------------------------------------------- */}
        {features.googleSignIn && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="mt-7 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-hairline bg-white/[0.03] text-[0.9375rem] font-medium text-ink shadow-[inset_0_1px_0_0_rgb(255_255_255/0.045)] transition duration-200 hover:-translate-y-px hover:border-hairline-strong hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-deck-card active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
            >
              {pending === "google" ? (
                <LoaderCircle aria-hidden className="deck-spin size-4" />
              ) : (
                <GoogleIcon />
              )}
              {content.googleLabel}
            </button>

            <div className="my-7 flex items-center gap-3.5">
              <span className="h-px flex-1 bg-hairline" />
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
                {content.dividerLabel}
              </span>
              <span className="h-px flex-1 bg-hairline" />
            </div>
          </>
        )}

        {/* Form-level errors (bad credentials, server unreachable, ...).
            The live region stays mounted so screen readers announce the
            message when it appears, not when the node is inserted. */}
        <div aria-live="polite">
          {formError && (
            <div
              role="alert"
              className={cn(
                fieldAlert,
                features.googleSignIn ? "mb-6" : "mt-7",
              )}
            >
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Email + password                                                  */}
        {/* ---------------------------------------------------------------- */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className={cn("space-y-5", !features.googleSignIn && !formError && "mt-7")}
        >
          <div>
            <label htmlFor="email" className={fieldLabel}>
              {content.emailLabel}
            </label>
            <div className="group relative mt-2.5">
              <Mail
                aria-hidden
                className={cn(fieldIcon, fieldErrors.email && fieldIconInvalid)}
              />
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={content.emailPlaceholder}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                className={cn(inputBase, "pl-11 pr-4", fieldErrors.email && fieldInvalid)}
              />
            </div>
            {fieldErrors.email && (
              <p id="email-error" role="alert" className={errorText}>
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="password" className={fieldLabel}>
                {content.passwordLabel}
              </label>
              {/* Remove via features.forgotPassword in config/login.ts.
                  Its destination is routes.forgotPassword. */}
              {features.forgotPassword && (
                <Link
                  href={routes.forgotPassword}
                  className="text-xs font-medium text-ink-muted underline-offset-4 transition-colors hover:text-brand hover:underline"
                >
                  {content.forgotLabel}
                </Link>
              )}
            </div>

            <div className="group relative mt-2.5">
              <Lock
                aria-hidden
                className={cn(fieldIcon, fieldErrors.password && fieldIconInvalid)}
              />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder={content.passwordPlaceholder}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyUp={trackCapsLock}
                onKeyDown={trackCapsLock}
                onBlur={() => setCapsLock(false)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password
                    ? "password-error"
                    : capsLock
                      ? "caps-hint"
                      : undefined
                }
                className={cn(inputBase, "pl-11 pr-12", fieldErrors.password && fieldInvalid)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={
                  showPassword ? content.hidePasswordLabel : content.showPasswordLabel
                }
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-muted transition hover:bg-white/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                {showPassword ? (
                  <EyeOff aria-hidden className="size-4" />
                ) : (
                  <Eye aria-hidden className="size-4" />
                )}
              </button>
            </div>

            {fieldErrors.password && (
              <p id="password-error" role="alert" className={errorText}>
                {fieldErrors.password}
              </p>
            )}
            {capsLock && !fieldErrors.password && (
              <p id="caps-hint" className={cn("mt-2", fieldWarningText)}>
                {content.capsLockWarning}
              </p>
            )}
          </div>

          {/* Remove via features.rememberMe in config/login.ts. Its value is
              passed to signInWithPassword and should drive session lifetime. */}
          {features.rememberMe && (
            <label className="group inline-flex cursor-pointer select-none items-center gap-2.5 pt-0.5">
              <span className="relative grid size-[18px] shrink-0 place-items-center">
                <input
                  type="checkbox"
                  name="remember"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="peer absolute inset-0 cursor-pointer appearance-none rounded-md outline-none"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-md border border-hairline-strong bg-white/[0.03] transition-colors peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-deck-card"
                />
                <Check
                  aria-hidden
                  strokeWidth={3.5}
                  className="pointer-events-none relative size-3 text-deck-void opacity-0 transition-opacity peer-checked:opacity-100"
                />
              </span>
              <span className="text-[0.8125rem] text-ink-muted transition-colors group-hover:text-ink-soft">
                {content.rememberLabel}
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={busy}
            className="deck-sweep group relative isolate flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[linear-gradient(100deg,var(--brand-green-mid),var(--brand-lime))] text-[0.9375rem] font-semibold tracking-[-0.01em] text-[#0a1000] shadow-[0_12px_32px_-14px_rgb(186_252_12/0.65)] transition duration-200 hover:-translate-y-0.5 hover:brightness-[1.06] hover:shadow-[0_18px_40px_-14px_rgb(186_252_12/0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-deck-card active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:brightness-100"
          >
            {pending === "password" ? (
              <>
                <LoaderCircle aria-hidden className="deck-spin size-4" />
                {content.submitPendingLabel}
              </>
            ) : (
              <>
                {previewMode ? content.previewSubmitLabel : content.submitLabel}
                <ArrowRight
                  aria-hidden
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </>
            )}
          </button>

          {/* Says out loud what the chip implies. The button label alone
              ("Continue to console") could still read as "sign me in", and a
              reviewer with no credentials should not have to guess whether the
              empty fields will stop them. */}
          {previewMode && (
            <p className="text-center text-[0.75rem] text-ink-muted">
              {content.previewHint}
            </p>
          )}
        </form>

        {/* Remove via features.supportFootnote in config/login.ts. */}
        {features.supportFootnote && (
          <p className="mt-7 text-center text-[0.8125rem] text-ink-muted">
            {content.supportFootnote}{" "}
            <span className="font-medium text-brand">{content.supportLinkLabel}</span>
          </p>
        )}
      </div>

      {/* ================================================================== */}
      {/* Footer beneath the card                                             */}
      {/* ================================================================== */}
      <div
        className="reveal mt-7 flex items-center justify-between gap-4 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted"
        style={delay(520)}
      >
        <span>
          &copy; {new Date().getFullYear()} {content.legal}
        </span>
        <Link href={routes.privacy} className="transition-colors hover:text-brand">
          {content.privacyLabel}
        </Link>
      </div>
    </div>
  );
}
