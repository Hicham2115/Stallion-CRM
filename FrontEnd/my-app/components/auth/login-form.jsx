"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
} from "lucide-react";
import {
  fieldBase,
  fieldErrorText,
  fieldIcon,
  fieldIconInvalid,
  fieldInvalid,
  fieldLabel,
  fieldWarningText,
} from "@/components/deck/field";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/lib/get-error-message";
import { useSessionStore } from "@/lib/store/session-store";
import { loginSchema } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";

function fieldError(field) {
  const [error] = field.state.meta.errors;
  return field.state.meta.isTouched && error ? error : null;
}

// Field styling comes from components/deck/field.ts, shared with the console
// dialogs; only what's different about this surface lives here.
const inputBase = cn(
  fieldBase,
  "h-12 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.035)] focus:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.07),0_10px_30px_-16px_rgb(186_252_12/0.55)]",
);
const errorText = cn("mt-2", fieldErrorText);
const delay = (ms) => ({ "--reveal-delay": `${ms}ms` });

const ROLE_ROUTES = {
  admin: "/admin",
  sales: "/rep",
  dev: "/dev",
  client: "/portal",
};

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  // A fresh install (seeded demo accounts, no real admin created yet) goes
  // straight to /setup instead of showing a login form for accounts nobody
  // real owns yet — see SetupController.
  const { data: setupStatus } = useQuery({
    queryKey: ["setup-status"],
    queryFn: async () => (await api.get("/api/setup/status")).data,
  });
  useEffect(() => {
    if (setupStatus?.needs_setup) router.replace("/setup");
  }, [setupStatus, router]);

  const signIn = useMutation({
    mutationFn: async (values) => {
      try {
        const response = await api.post("/api/login", {
          email: values.email,
          password: values.password,
        });
        return response.data;
      } catch (error) {
        if (error.response) {
          throw new Error(
            error.response.data?.error || "Incorrect email or password.",
          );
        }
        throw new Error("We could not reach the server.");
      }
    },
    onSuccess: (data) => {
      // Everything the app needs to know who's signed in — role + token —
      // lands in one place: the Zustand store, persisted to localStorage.
      useSessionStore.getState().setSession({
        role: data.user.role,
        token: data.token,
      });
      router.replace(ROLE_ROUTES[data.user.role] ?? "/admin");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      const parsed = loginSchema.safeParse(value);
      if (!parsed.success) return;
      await signIn.mutateAsync(parsed.data);
    },
  });

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
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-brand">
            Secure access
          </p>
          <h2 className="mt-3 font-display text-[1.75rem] font-semibold tracking-[-0.025em] text-ink">
            Log in
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Use your email and password to access the platform.
          </p>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
          noValidate
          className="mt-7 space-y-5"
        >
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) =>
                loginSchema.shape.email.safeParse(value).error?.issues[0]
                  ?.message,
            }}
          >
            {(field) => (
              <div>
                <label htmlFor="email" className={fieldLabel}>
                  Email address
                </label>
                <div className="group relative mt-2.5">
                  <Mail
                    aria-hidden
                    className={cn(
                      fieldIcon,
                      fieldError(field) && fieldIconInvalid,
                    )}
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@stallionadvertising.ma"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={Boolean(fieldError(field))}
                    aria-describedby={
                      fieldError(field) ? "email-error" : undefined
                    }
                    className={cn(
                      inputBase,
                      "pl-11 pr-4",
                      fieldError(field) && fieldInvalid,
                    )}
                  />
                </div>
                {fieldError(field) && (
                  <p id="email-error" role="alert" className={errorText}>
                    {fieldError(field)}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) =>
                loginSchema.shape.password.safeParse(value).error?.issues[0]
                  ?.message,
            }}
          >
            {(field) => (
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor="password" className={fieldLabel}>
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-ink-muted underline-offset-4 transition-colors hover:text-brand hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="group relative mt-2.5">
                  <Lock
                    aria-hidden
                    className={cn(
                      fieldIcon,
                      fieldError(field) && fieldIconInvalid,
                    )}
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="At least 8 characters"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={(event) => {
                      field.handleBlur();
                      setCapsLock(false);
                      void event;
                    }}
                    onKeyUp={trackCapsLock}
                    onKeyDown={trackCapsLock}
                    aria-invalid={Boolean(fieldError(field))}
                    aria-describedby={
                      fieldError(field)
                        ? "password-error"
                        : capsLock
                          ? "caps-hint"
                          : undefined
                    }
                    className={cn(
                      inputBase,
                      "pl-11 pr-12",
                      fieldError(field) && fieldInvalid,
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
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

                {fieldError(field) && (
                  <p id="password-error" role="alert" className={errorText}>
                    {fieldError(field)}
                  </p>
                )}
                {capsLock && !fieldError(field) && (
                  <p id="caps-hint" className={cn("mt-2", fieldWarningText)}>
                    Caps Lock is on.
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <button
            type="submit"
            disabled={signIn.isPending}
            className="deck-sweep group relative isolate flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[linear-gradient(100deg,var(--brand-green-mid),var(--brand-lime))] text-[0.9375rem] font-semibold tracking-[-0.01em] text-[#0a1000] shadow-[0_12px_32px_-14px_rgb(186_252_12/0.65)] transition duration-200 hover:-translate-y-0.5 hover:brightness-[1.06] hover:shadow-[0_18px_40px_-14px_rgb(186_252_12/0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-deck-card active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:brightness-100"
          >
            {signIn.isPending ? (
              <>
                <LoaderCircle aria-hidden className="deck-spin size-4" />
                Verifying
              </>
            ) : (
              <>
                Log in
                <ArrowRight
                  aria-hidden
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </>
            )}
          </button>
        </form>
      </div>

      <div
        className="reveal mt-7 flex items-center justify-between gap-4 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted"
        style={delay(520)}
      >
        <span>&copy; {new Date().getFullYear()} Stallion Advertising</span>
        <Link href="/privacy" className="transition-colors hover:text-brand">
          Privacy policy
        </Link>
      </div>
    </div>
  );
}
