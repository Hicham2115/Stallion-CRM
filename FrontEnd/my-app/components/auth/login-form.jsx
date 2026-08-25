"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { SegmentedControl } from "@/components/deck/segmented-control";
import { WarningChip } from "@/components/deck/warning-chip";
import { loginConfig } from "@/config/login";
import {
  authBackendConnected,
  signInWithGoogle,
  signInWithPassword,
} from "@/lib/auth";
import { homeFor, writePreviewSession } from "@/lib/session";
import { cn } from "@/lib/utils";
const { content, features, routes, validation } = loginConfig;
// Both halves must be true: the flag says a preview bypass is allowed, and
// authBackendConnected says whether one is needed. Wiring the backend flips
// the second automatically, so the bypass can't be left on by accident.
const previewMode = features.previewFallback && !authBackendConnected;
// Only relevant in preview mode — once credentials are checked, the account
// decides where you land. See features.previewRoleSwitch in config/login.ts.
const roleSwitch = previewMode && features.previewRoleSwitch;
const ROLE_OPTIONS = content.previewRoles.map((entry) => ({
  value: entry.role,
  label: entry.label,
}));
function submitLabelFor(role) {
  return (
    content.previewRoles.find((entry) => entry.role === role)?.submitLabel ??
    content.previewSubmitLabel
  );
}
// Field styling comes from components/deck/field.ts, shared with the console
// dialogs; only what's different about this surface lives here.
const inputBase = cn(
  fieldBase,
  "h-12 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.035)] focus:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.07),0_10px_30px_-16px_rgb(186_252_12/0.55)]",
);
const errorText = cn("mt-2", fieldErrorText);
const delay = (ms) => ({ "--reveal-delay": `${ms}ms` });
function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="size-[1.125rem]">
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.5 6.6-16.1z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.9 0 10.9-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.6-3.9-12.3-9.1H4.3v5.7C7.9 41.1 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.7 28.1c-.4-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1v-5.7H4.3C2.8 17.2 2 20.5 2 24s.8 6.8 2.3 9.8l7.4-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.4 2 7.9 6.9 4.3 14.2l7.4 5.7c1.7-5.2 6.6-9.1 12.3-9.1z"
      />
    </svg>
  );
}
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  // Ignored entirely once auth is real — see `roleSwitch` above.
  const [previewRole, setPreviewRole] = useState("admin");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  // Which action is in flight, so the two buttons show separate spinners.
  const [pending, setPending] = useState("idle");
  const busy = pending !== "idle";
  // Client-side checks only — the server must validate again regardless.
  function validate() {
    const errors = {};
    const trimmed = email.trim();
    if (!trimmed) errors.email = content.errors.emailRequired;
    else if (!validation.emailPattern.test(trimmed))
      errors.email = content.errors.emailInvalid;
    if (!password) errors.password = content.errors.passwordRequired;
    else if (password.length < validation.minPasswordLength)
      errors.password = content.errors.passwordTooShort;
    return errors;
  }
  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    // Preview build: nothing to check, so validation is skipped entirely.
    if (previewMode) {
      setPending("password");
      // The server reads this cookie to decide sidebar/identity/routes.
      // See lib/session.ts.
      writePreviewSession(roleSwitch ? previewRole : "admin");
      // A document navigation, not router.push(): Next's client cache
      // doesn't know the cookie changed and can replay a payload rendered
      // for the previous role. A full load has no cache to go stale.
      window.location.assign(homeFor(roleSwitch ? previewRole : "admin"));
      return;
    }
    const errors = validate();
    setFieldErrors(errors);
    if (errors.email || errors.password) {
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
        // Stay in the pending state so the form can't be double-submitted
        // while the route transition runs.
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
  function trackCapsLock(event) {
    setCapsLock(event.getModifierState("CapsLock"));
  }
  return (
    <div className="w-full max-w-[27rem]">
      <div
        className="reveal-card deck-lift relative overflow-hidden rounded-2xl border border-hairline bg-deck-card/85 p-7 backdrop-blur-xl sm:p-9"
        style={delay(220)}
      >
        {/* Lit top edge — reads as a light source above the card. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgb(186_252_12/0.45),transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-44 bg-[radial-gradient(70%_100%_at_50%_0%,rgb(186_252_12/0.05),transparent_72%)]"
        />

        <header>
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

        {/* Preview build only — see `roleSwitch`. */}
        {roleSwitch && (
          <div className="mt-7">
            <p className={fieldLabel}>{content.previewRoleLabel}</p>

            <SegmentedControl
              // `quiet`, not the default lime fill — the submit button below is
              // already this card's one lime answer.
              tone="quiet"
              className="mt-2.5 w-full"
              label={content.previewRoleGroupLabel}
              value={previewRole}
              onValueChange={setPreviewRole}
              options={ROLE_OPTIONS}
            />

            <p className="mt-2 text-[0.75rem] leading-relaxed text-ink-muted">
              {content.previewRoleHint}
            </p>
          </div>
        )}

        {/* Remove by setting features.googleSignIn = false in config/login.ts. */}
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

        {/* Live region stays mounted so screen readers announce the message
            when it appears, not when the node is inserted. */}
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

        <form
          onSubmit={handleSubmit}
          noValidate
          className={cn(
            "space-y-5",
            !features.googleSignIn && !formError && "mt-7",
          )}
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
                className={cn(
                  inputBase,
                  "pl-11 pr-4",
                  fieldErrors.email && fieldInvalid,
                )}
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
                className={cn(
                  fieldIcon,
                  fieldErrors.password && fieldIconInvalid,
                )}
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
                className={cn(
                  inputBase,
                  "pl-11 pr-12",
                  fieldErrors.password && fieldInvalid,
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={
                  showPassword
                    ? content.hidePasswordLabel
                    : content.showPasswordLabel
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
                {previewMode
                  ? roleSwitch
                    ? submitLabelFor(previewRole)
                    : content.previewSubmitLabel
                  : content.submitLabel}
                <ArrowRight
                  aria-hidden
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </>
            )}
          </button>

          {previewMode && (
            <p className="text-center text-[0.75rem] text-ink-muted">
              {content.previewHint}
            </p>
          )}
        </form>

        {features.supportFootnote && (
          <p className="mt-7 text-center text-[0.8125rem] text-ink-muted">
            {content.supportFootnote}{" "}
            <span className="font-medium text-brand">
              {content.supportLinkLabel}
            </span>
          </p>
        )}
      </div>

      <div
        className="reveal mt-7 flex items-center justify-between gap-4 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted"
        style={delay(520)}
      >
        <span>
          &copy; {new Date().getFullYear()} {content.legal}
        </span>
        <Link
          href={routes.privacy}
          className="transition-colors hover:text-brand"
        >
          {content.privacyLabel}
        </Link>
      </div>
    </div>
  );
}
